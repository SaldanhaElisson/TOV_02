import type { Point } from '$lib/stores/GazeStore.svelte';

export type { Point as CalibrationPoint };

export const CALIBRATION_POINTS: Point[] = [
	{ x: 10, y: 10 }, { x: 50, y: 10 }, { x: 90, y: 10 },
	{ x: 10, y: 50 },                    { x: 90, y: 50 },
	{ x: 10, y: 90 }, { x: 50, y: 90 }, { x: 90, y: 90 },
	{ x: 30, y: 30 }, { x: 70, y: 30 },
	{ x: 30, y: 70 }, { x: 70, y: 70 },
	{ x: 50, y: 50 },
];

export const CLICKS_PER_POINT = 7;
export const TOTAL_POINTS     = CALIBRATION_POINTS.length;
export const SETTLE_MS = 700;
