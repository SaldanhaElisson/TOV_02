// Benchmark size. SESSIONS and CONCURRENCY can be overridden by environment variables.
export const SESSIONS = Number(process.env.SESSIONS ?? 1000);
export const STIMULI = 20; // images per session
export const POINTS = 300; // 10 s per image at ~30 Hz (DataCollector samples every 33 ms)
export const CONCURRENCY = Number(process.env.CONCURRENCY ?? 10); // participants uploading at once
export const READ_SAMPLES = 100; // sessions exported to CSV after the writes
export const TOTAL_POINTS = SESSIONS * STIMULI * POINTS;
