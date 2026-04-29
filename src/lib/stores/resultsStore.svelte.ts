import { exportToCsv, type ExportRow, type GazeEntry } from '$lib/services/CsvService';
import { triggerCsvDownload } from '$lib/services/DownloadService';
import type { Point } from '$lib/stores/GazeStore.svelte';

// ============================================================
// Types
// ============================================================

export type { ExportRow, GazeEntry };

export interface ImageBounds {
	name: string;
	width: number;
	height: number;
	screenX: number;
	screenY: number;
}

// ============================================================
// State
// ============================================================

let rows = $state<ExportRow[]>([]);

// ============================================================
// Private helpers
// ============================================================

function buildEntry(point: Point, elapsedTime: number): GazeEntry {
	return { x: point.x, y: point.y, timestamp: Date.now(), elapsedTime };
}

function lastRow(): ExportRow | undefined {
	return rows.at(-1);
}

function buildFileName(): string {
	return `tov_result_${Date.now()}.csv`;
}

// ============================================================
// Public API — incremental capture (used by StimulusDisplay + DataCollector)
// ============================================================

/**
 * Starts a new data row for the given image.
 * Called every time a new stimulus is displayed and bounds are captured.
 */
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

/**
 * Appends a gaze entry to the current image's row.
 * No-op if no image is active.
 */
function recordGazeEntry(point: Point, elapsedTime: number): void {
	const row = lastRow();
	if (!row) return;
	row.gazeData.push(buildEntry(point, elapsedTime));
}

// ============================================================
// Public API — batch / export (used by ExperimentRunView)
// ============================================================

/**
 * Adds a complete, pre-built ExportRow to the store.
 */
function addRecord(row: ExportRow): void {
	rows.push(row);
}

/**
 * Converts all accumulated rows to a CSV string via CsvService.
 * Pure read — does not mutate state.
 */
function generateFinalCsv(): string {
	return exportToCsv(rows);
}

/**
 * Orchestrates export: guard → CSV → download → flush.
 * No-op if there are no rows to export.
 */
function exportAndDownload(): void {
	if (rows.length === 0) return;
	const csv = generateFinalCsv();
	triggerCsvDownload(csv, buildFileName());
	flush(); // eslint-disable-line @typescript-eslint/no-use-before-define
}

/**
 * Returns all accumulated rows and resets the store.
 */
function flush(): ExportRow[] {
	const snapshot = [...rows];
	rows = [];
	return snapshot;
}

// ============================================================
// Export
// ============================================================

export const resultsStore = {
	get rows()      { return rows; },
	setImageBounds,
	recordGazeEntry,
	addRecord,
	generateFinalCsv,
	exportAndDownload,
	flush,
};
