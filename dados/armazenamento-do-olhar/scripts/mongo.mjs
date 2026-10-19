// MongoDB 8 benchmark. Usage: node scripts/mongo.mjs docs|embedded
import { MongoClient } from 'mongodb';
import { CONCURRENCY } from './config.mjs';
import { makeSession } from './session.mjs';
import { runUploads, runExports } from './runner.mjs';
import { printReport } from './report.mjs';

const FORMAT = process.argv[2];
const client = await new MongoClient('mongodb://localhost:57017', { maxPoolSize: CONCURRENCY }).connect();
const db = client.db('bench');
// Same durability as Postgres' default synchronous_commit: acknowledged only after the journal hits disk.
const WRITE = { writeConcern: { w: 1, j: true } };
const flatten = ({ points, ...p }) => points.map((pt) => ({ ...p, ...pt }));

async function upload(sessionId) {
  const presentations = makeSession(sessionId).map((p, order) => ({ sessionId, order, ...p }));
  await db.collection('sessions').insertOne({ _id: sessionId }, WRITE);
  if (FORMAT === 'embedded') return db.collection('presentations').insertMany(presentations, WRITE);
  const meta = presentations.map(({ points, ...p }) => p);
  const { insertedIds } = await db.collection('presentations').insertMany(meta, WRITE);
  const docs = presentations.flatMap((p, i) => p.points.map((pt) => ({ sessionId, presentationId: insertedIds[i], ...pt })));
  await db.collection('gazeRecords').insertMany(docs, { ...WRITE, ordered: false });
}

async function read(sessionId) {
  const presentations = await db.collection('presentations').find({ sessionId }).sort({ order: 1 }).toArray();
  if (FORMAT === 'embedded') return presentations.flatMap(flatten);
  const byId = new Map(presentations.map((p) => [String(p._id), p]));
  const points = await db.collection('gazeRecords').find({ sessionId }).sort({ timestamp: 1 }).toArray();
  return points.map((pt) => ({ ...byId.get(String(pt.presentationId)), ...pt }));
}

async function sizeOf(name) {
  const [{ storageStats }] = await db.collection(name).aggregate([{ $collStats: { storageStats: {} } }]).toArray();
  return storageStats.storageSize + storageStats.totalIndexSize;
}

await db.dropDatabase();
await db.collection('presentations').createIndex({ sessionId: 1, order: 1 });
if (FORMAT === 'docs') await db.collection('gazeRecords').createIndex({ sessionId: 1, timestamp: 1 });
const uploads = await runUploads(upload);
await client.db('admin').command({ fsync: 1 });
const collections = ['sessions', 'presentations', ...(FORMAT === 'docs' ? ['gazeRecords'] : [])];
const sizes = await Promise.all(collections.map(sizeOf));
const exports = await runExports(read);
printReport(`mongo-${FORMAT}`, uploads, sizes.reduce((a, b) => a + b, 0), exports);
await client.close();
