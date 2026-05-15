import { exportToCsv, type ExportRow, type GazeEntry } from '$lib/services/CsvService';
import { triggerCsvDownload } from '$lib/services/DownloadService';
import type { Point } from '$lib/stores/GazeStore.svelte';

export type { ExportRow, GazeEntry };

export interface ImageBounds {
	name: string;
	width: number;
	height: number;
	screenX: number;
	screenY: number;
}

let rows = $state<ExportRow[]>([]);

function buildEntry(point: Point, elapsedTime: number): GazeEntry {
	return { x: point.x, y: point.y, timestamp: Date.now(), elapsedTime };
}

function lastRow(): ExportRow | undefined {
	return rows.at(-1);
}

function buildFileName(): string {
	return `tov_result_${Date.now()}.csv`;
}

function hasValidGeometry(bounds: ImageBounds): boolean {
	return bounds.width > 0 && bounds.height > 0;
}

function setImageBounds(bounds: ImageBounds): void {
	if (!hasValidGeometry(bounds)) return;
	rows.push({
		timestamp:    Date.now(),
		imageName:    bounds.name,
		imageWidth:   bounds.width,
		imageHeight:  bounds.height,
		imageScreenX: bounds.screenX,
		imageScreenY: bounds.screenY,
		gazeData:     [],
	});
}

function isOnScreen(point: Point): boolean {
	return point.x >= 0 && point.y >= 0
		&& point.x <= window.innerWidth
		&& point.y <= window.innerHeight;
}

function resetCurrentRowTimestamp(): void {
	const row = lastRow();
	if (!row) return;
	row.timestamp = Date.now();
}

function recordGazeEntry(point: Point): void {
	const row = lastRow();
	if (!row) return;
	if (!isOnScreen(point)) return;
	const elapsedTime = Date.now() - row.timestamp;
	row.gazeData.push(buildEntry(point, elapsedTime));
}

function addRecord(row: ExportRow): void {
	rows.push(row);
}

function generateFinalCsv(): string {
	return exportToCsv(rows);
}

function exportAndDownload(): void {
	if (rows.length === 0) return;
	const csv = generateFinalCsv();
	triggerCsvDownload(csv, buildFileName());
	flush();
}

function flush(): ExportRow[] {
	const snapshot = [...rows];
	rows = [];
	return snapshot;
}

export const resultsStore = {
	get rows()      { return rows; },
	setImageBounds,
	resetCurrentRowTimestamp,
	recordGazeEntry,
	addRecord,
	generateFinalCsv,
	exportAndDownload,
	flush,
};
