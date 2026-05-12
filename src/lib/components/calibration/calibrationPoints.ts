import type { Point } from '$lib/stores/GazeStore.svelte';

// Re-export Point so callers don't need a second import.
export type { Point as CalibrationPoint };

/**
 * 13 calibration positions as percentages of the viewport (x, y in 0–100).
 * Outer ring at 10%/90% avoids extreme gaze angles where face-mesh variance
 * is highest. Inner ring at 30%/70% fills the mid-screen gap that the 9-point
 * grid leaves uncovered, improving ridge regression accuracy across the full
 * display area. Center (50,50) is always presented last — see CalibrationOverlay.
 */
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
/** Milliseconds to block clicks after a new point becomes active.
 *  Allows the eye to physically settle on the target before registering data. */
export const SETTLE_MS = 700;
