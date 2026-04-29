export interface GazeEntry {
	x: number;
	y: number;
	timestamp: number;
	elapsedTime: number;
}

export interface ExportRow {
	timestamp: number;
	imageName: string;
	imageWidth: number;
	imageHeight: number;
	imageScreenX: number;
	imageScreenY: number;
	gazeData: GazeEntry[];
}

const CSV_HEADER = 'timestamp,ImageName,ImageWidth,ImageHeight,ImageScreenX,ImageScreenY,GazeData_JSON';

function escapeJsonField(json: string): string {
	const withDoubledQuotes = json.replaceAll('"', '""');
	return `"${withDoubledQuotes}"`;
}

function formatGazeData(entries: GazeEntry[]): string {
	const json = JSON.stringify(entries);
	return escapeJsonField(json);
}

function formatRow(row: ExportRow): string {
	const gazeColumn = formatGazeData(row.gazeData);
	return [
		row.timestamp,
		row.imageName,
		row.imageWidth,
		row.imageHeight,
		row.imageScreenX,
		row.imageScreenY,
		gazeColumn,
	].join(',');
}

export function exportToCsv(data: ExportRow[]): string {
	if (data.length === 0) return CSV_HEADER;

	const rows = data.map(formatRow).join('\n');
	return `${CSV_HEADER}\n${rows}`;
}
