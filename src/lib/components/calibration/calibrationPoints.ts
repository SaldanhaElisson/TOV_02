import type { Point } from '$lib/stores/GazeStore.svelte';

// Re-export Point so callers don't need a second import.
export type { Point as CalibrationPoint };

/**
 * 9 calibration positions as percentages of the viewport (x, y in 0–100).
 * Ordered left-to-right, top-to-bottom to create a natural visual flow.
 */
export const CALIBRATION_POINTS: Point[] = [
	{ x: 5,  y: 5  }, { x: 50, y: 5  }, { x: 95, y: 5  },
	{ x: 5,  y: 50 }, { x: 50, y: 50 }, { x: 95, y: 50 },
	{ x: 5,  y: 95 }, { x: 50, y: 95 }, { x: 95, y: 95 },
];

export const CLICKS_PER_POINT = 9;
export const TOTAL_POINTS     = CALIBRATION_POINTS.length;
