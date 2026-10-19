// Runs the uploads with N participants at once, then times CSV exports of random sessions.
import { SESSIONS, CONCURRENCY, READ_SAMPLES } from './config.mjs';
import { seededRandom } from './session.mjs';
import { toCsv } from './csv.mjs';

export async function runUploads(upload) {
  const latencies = [];
  let next = 1;
  const worker = async () => {
    while (next <= SESSIONS) {
      const sessionId = next++;
      const t0 = performance.now();
      await upload(sessionId);
      latencies.push(performance.now() - t0);
    }
  };
  const t0 = performance.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { totalMs: performance.now() - t0, latencies };
}

export async function runExports(read) {
  const latencies = [];
  let csvBytes = 0;
  for (let i = 0; i < READ_SAMPLES; i++) {
    const sessionId = 1 + Math.floor(seededRandom(9000 + i)() * SESSIONS);
    const t0 = performance.now();
    const csv = toCsv(await read(sessionId));
    latencies.push(performance.now() - t0);
    csvBytes = csv.length;
  }
  return { latencies, csvBytes };
}
