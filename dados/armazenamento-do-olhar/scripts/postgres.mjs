// PostgreSQL 18 benchmark. Usage: node scripts/postgres.mjs rows|array
import pg from 'pg';
import { CONCURRENCY } from './config.mjs';
import { makeSession } from './session.mjs';
import { runUploads, runExports } from './runner.mjs';
import { printReport } from './report.mjs';
import { SCHEMA, READ_SQL, SIZE_SQL } from './postgres-schema.mjs';
import { insertRows, insertArray } from './postgres-insert.mjs';

const FORMAT = process.argv[2];
const INSERT = { rows: insertRows, array: insertArray };
const pool = new pg.Pool({ connectionString: 'postgres://bench:bench@localhost:55432/bench', max: CONCURRENCY });

async function upload(sessionId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO session (id) VALUES ($1)', [sessionId]);
    await INSERT[FORMAT](client, sessionId, makeSession(sessionId));
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

async function read(sessionId) {
  const { rows } = await pool.query(READ_SQL[FORMAT], [sessionId]);
  if (FORMAT === 'rows') return rows.map((r) => ({ ...r, timestamp: Number(r.timestamp) }));
  return rows.flatMap(({ points, ...p }) => points.map((pt) => ({ ...p, ...pt })));
}

await pool.query('DROP TABLE IF EXISTS gaze_record, presentation, session CASCADE');
await pool.query(SCHEMA[FORMAT]);
const uploads = await runUploads(upload);
await pool.query('VACUUM ANALYZE');
const { rows: [size] } = await pool.query(SIZE_SQL);
const exports = await runExports(read);
printReport(`postgres-${FORMAT}`, uploads, Number(size.bytes), exports);
await pool.end();
