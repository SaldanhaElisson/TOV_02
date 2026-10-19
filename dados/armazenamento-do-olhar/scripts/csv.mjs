// Same format as src/lib/services/CsvService.ts: one row per gaze entry (docs/DATA_DICTIONARY.md).
const HEADER = 'timestamp,ImageName,ImageWidth,ImageHeight,ImageScreenX,ImageScreenY,GazeData_JSON';

function formatRow(r) {
  const entry = { x: r.x, y: r.y, timestamp: r.timestamp, elapsedTime: r.elapsedTime };
  const gazeColumn = `"${JSON.stringify([entry]).replaceAll('"', '""')}"`;
  return [r.timestamp, r.imageName, r.width, r.height, r.screenX, r.screenY, gazeColumn].join(',');
}

export function toCsv(rows) {
  return `${HEADER}\n${rows.map(formatRow).join('\n')}`;
}
