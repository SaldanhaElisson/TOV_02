import type { Point } from '$lib/stores/GazeStore.svelte';

// ============================================================
// Pure Functions — No DOM, no side-effects, fully testable.
// All functions: max 1 indentation level, no else.
// ============================================================

/**
 * Euclidean distance between two screen points (pixels).
 */
export function calculateEuclideanDistance(p1: Point, p2: Point): number {
	const dx = p1.x - p2.x;
	const dy = p1.y - p2.y;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Mean euclidean distance from a set of gaze samples to a fixed target.
 * Returns 0 for an empty sample set (guard clause, no else).
 */
export function calculateMeanError(samples: Point[], target: Point): number {
	if (samples.length === 0) return 0;
	const totalError = samples.reduce(
		(sum, sample) => sum + calculateEuclideanDistance(sample, target),
		0,
	);
	return totalError / samples.length;
}

/**
 * Converts a viewport-percentage Point to absolute screen pixels.
 * Keeps coordinate conversion as a pure function (no global window access).
 */
export function toScreenPoint(percent: Point, width: number, height: number): Point {
	return {
		x: (percent.x / 100) * width,
		y: (percent.y / 100) * height,
	};
}

// ============================================================
// WebGazer-compatible precision score (0–100 %)
// ============================================================

/**
 * Precision score for a single gaze sample.
 *
 * A sample that lands exactly on the centre scores 100%.
 * A sample at the edge of the acceptance radius (windowHeight/2) scores 0%.
 * Anything beyond the radius also scores 0%.
 */
function samplePrecision(
	x: number,
	y: number,
	centerX: number,
	centerY: number,
	maxDistance: number,
): number {
	const dist = calculateEuclideanDistance({ x, y }, { x: centerX, y: centerY });
	if (dist >= maxDistance) return 0;
	return 100 - (dist / maxDistance) * 100;
}

/**
 * Overall precision score for a validation session (0–100 %, rounded).
 *
 * Mirrors the algorithm used in WebGazer's own calibration examples:
 * feed the past-50 X/Y arrays from `webgazer.getStoredPoints()`, plus
 * the current viewport dimensions.
 *
 * Guard clause: returns 0 when the arrays are empty.
 */
export function calculatePrecision(
	samplesX: number[],
	samplesY: number[],
	windowWidth: number,
	windowHeight: number,
): number {
	if (samplesX.length === 0) return 0;

	const centerX     = windowWidth  / 2;
	const centerY     = windowHeight / 2;
	const maxDistance = windowHeight / 2;

	const total = samplesX.reduce(
		(sum, x, i) => sum + samplePrecision(x, samplesY[i], centerX, centerY, maxDistance),
		0,
	);

	return Math.round(total / samplesX.length);
}
