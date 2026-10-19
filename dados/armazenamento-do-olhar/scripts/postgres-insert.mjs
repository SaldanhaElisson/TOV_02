// Multi-row INSERTs, the same kind of statement Prisma's createMany sends.
function placeholders(rowCount, columnCount) {
  return Array.from({ length: rowCount }, (_, row) => {
    const cells = Array.from({ length: columnCount }, (_, col) => `$${row * columnCount + col + 1}`);
    return `(${cells.join(',')})`;
  }).join(',');
}

const PRESENTATION_COLUMNS = 'session_id, image_name, width, height, screen_x, screen_y';

function presentationValues(sessionId, p) {
  return [sessionId, p.imageName, p.width, p.height, p.screenX, p.screenY];
}

export async function insertRows(client, sessionId, presentations) {
  for (const p of presentations) {
    const { rows } = await client.query(
      `INSERT INTO presentation (${PRESENTATION_COLUMNS}) VALUES ${placeholders(1, 6)} RETURNING id`,
      presentationValues(sessionId, p));
    const values = p.points.flatMap((pt) => [rows[0].id, pt.timestamp, pt.x, pt.y, pt.elapsedTime]);
    await client.query(
      `INSERT INTO gaze_record (presentation_id, "timestamp", x, y, elapsed_time) VALUES ${placeholders(p.points.length, 5)}`,
      values);
  }
}

export async function insertArray(client, sessionId, presentations) {
  const values = presentations.flatMap((p) => [...presentationValues(sessionId, p), JSON.stringify(p.points)]);
  await client.query(
    `INSERT INTO presentation (${PRESENTATION_COLUMNS}, points) VALUES ${placeholders(presentations.length, 7)}`,
    values);
}
