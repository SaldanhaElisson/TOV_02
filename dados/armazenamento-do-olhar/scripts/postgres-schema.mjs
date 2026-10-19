// "rows": one row per gaze entry. "array": one row per presentation, gaze entries in a jsonb array.
const PRESENTATION = `id serial PRIMARY KEY, session_id int NOT NULL REFERENCES session(id),
  image_name text NOT NULL, width int, height int, screen_x double precision, screen_y double precision`;

export const SCHEMA = {
  rows: `
    CREATE TABLE session (id int PRIMARY KEY);
    CREATE TABLE presentation (${PRESENTATION});
    CREATE INDEX ON presentation (session_id);
    CREATE TABLE gaze_record (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      presentation_id int NOT NULL REFERENCES presentation(id), "timestamp" bigint NOT NULL,
      x double precision NOT NULL, y double precision NOT NULL, elapsed_time double precision NOT NULL);
    CREATE INDEX ON gaze_record (presentation_id, "timestamp");`,
  array: `
    CREATE TABLE session (id int PRIMARY KEY);
    CREATE TABLE presentation (${PRESENTATION}, points jsonb NOT NULL);
    CREATE INDEX ON presentation (session_id);`,
};

const COLUMNS = `p.image_name AS "imageName", p.width, p.height, p.screen_x AS "screenX", p.screen_y AS "screenY"`;

export const READ_SQL = {
  rows: `SELECT g."timestamp", ${COLUMNS}, g.x, g.y, g.elapsed_time AS "elapsedTime"
         FROM presentation p JOIN gaze_record g ON g.presentation_id = p.id
         WHERE p.session_id = $1 ORDER BY p.id, g."timestamp"`,
  array: `SELECT ${COLUMNS}, p.points FROM presentation p WHERE p.session_id = $1 ORDER BY p.id`,
};

export const SIZE_SQL = `SELECT sum(pg_total_relation_size(c.oid))::bigint AS bytes
  FROM pg_class c WHERE c.relname IN ('session', 'presentation', 'gaze_record')`;
