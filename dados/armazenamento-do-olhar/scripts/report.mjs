// Prints one JSON line per format; the lines are saved in resultados.jsonl.
import { TOTAL_POINTS } from './config.mjs';

const MB = 1024 * 1024;

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

export function printReport(format, uploads, sizeBytes, exports) {
  const seconds = uploads.totalMs / 1000;
  console.log(JSON.stringify({
    format,
    points: TOTAL_POINTS,
    writeTotalS: +seconds.toFixed(1),
    pointsPerS: Math.round(TOTAL_POINTS / seconds),
    uploadP50Ms: Math.round(percentile(uploads.latencies, 50)),
    uploadP95Ms: Math.round(percentile(uploads.latencies, 95)),
    diskMB: +(sizeBytes / MB).toFixed(0),
    bytesPerPoint: +(sizeBytes / TOTAL_POINTS).toFixed(1),
    csvP50Ms: Math.round(percentile(exports.latencies, 50)),
    csvP95Ms: Math.round(percentile(exports.latencies, 95)),
    csvSizeMB: +(exports.csvBytes / MB).toFixed(2),
  }));
}
