// Deterministic fake sessions: what a participant uploads at the end of the experiment.
import { STIMULI, POINTS } from './config.mjs';

const FIRST_TIMESTAMP = 1774639661938;
const SAMPLE_INTERVAL_MS = 33;

export function seededRandom(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePoints(rand, start, firstTimestamp) {
  return Array.from({ length: POINTS }, (_, i) => {
    const timestamp = firstTimestamp + (i + 1) * SAMPLE_INTERVAL_MS;
    return {
      x: Math.round(rand() * 192000) / 100,
      y: Math.round(rand() * 108000) / 100,
      timestamp,
      elapsedTime: Math.round((timestamp - start) * 10) / 10,
    };
  });
}

// One session = STIMULI presentations x POINTS gaze entries.
export function makeSession(sessionId) {
  const rand = seededRandom(sessionId);
  const start = FIRST_TIMESTAMP + sessionId * 1_000_000;
  return Array.from({ length: STIMULI }, (_, s) => ({
    imageName: `stimulus_${String(s + 1).padStart(2, '0')}.jpg`,
    width: 1280,
    height: 720,
    screenX: 320.5,
    screenY: 180,
    points: makePoints(rand, start, start + s * POINTS * SAMPLE_INTERVAL_MS),
  }));
}
