import type { Point } from '$lib/stores/GazeStore.svelte';

export const VALIDATION_POINTS: Point[] = [
	{ x: 15, y: 15 }, { x: 85, y: 15 },
	{ x: 50, y: 50 },
	{ x: 15, y: 85 }, { x: 85, y: 85 },
];

export const DWELL_MS            = 2500;
export const SETTLE_MS           = 800;
export const TRANSITION_MS       = 800;
export const STEP_MS             = TRANSITION_MS + DWELL_MS;
export const TOTAL_MS            = DWELL_MS + (VALIDATION_POINTS.length - 1) * STEP_MS;
export const RECORD_MS           = 50;
export const PRECISION_THRESHOLD = 65;
export const COUNTDOWN_START     = 3;
