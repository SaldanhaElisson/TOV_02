import type { Point } from '$lib/stores/GazeStore.svelte';
import { VALIDATION_POINTS, DWELL_MS, STEP_MS, TRANSITION_MS } from './validationConfig';

export type DotState = {
	x: number;
	y: number;
	pointIdx: number;
	dwelling: boolean;
	dwellElapsed: number;
};

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function easeInOut(t: number): number {
	return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function toPixels(point: Point): Point {
	return {
		x: (point.x / 100) * window.innerWidth,
		y: (point.y / 100) * window.innerHeight,
	};
}

function dwellState(pointIdx: number, dwellElapsed: number): DotState {
	const p = toPixels(VALIDATION_POINTS[pointIdx]);
	return { x: p.x, y: p.y, pointIdx, dwelling: true, dwellElapsed };
}

function transitionState(stepIdx: number, stepElap: number): DotState {
	const from = toPixels(VALIDATION_POINTS[stepIdx]);
	const to   = toPixels(VALIDATION_POINTS[stepIdx + 1]);
	const t    = easeInOut(stepElap / TRANSITION_MS);
	return {
		x: lerp(from.x, to.x, t),
		y: lerp(from.y, to.y, t),
		pointIdx: stepIdx + 1,
		dwelling: false,
		dwellElapsed: 0,
	};
}

function stepState(elapsed: number): DotState {
	const afterFirst = elapsed - DWELL_MS;
	const stepIdx    = Math.min(Math.floor(afterFirst / STEP_MS), VALIDATION_POINTS.length - 2);
	const stepElap   = afterFirst - stepIdx * STEP_MS;
	if (stepElap < TRANSITION_MS) return transitionState(stepIdx, stepElap);
	return dwellState(stepIdx + 1, stepElap - TRANSITION_MS);
}

export function dotState(elapsed: number): DotState {
	if (elapsed < DWELL_MS) return dwellState(0, elapsed);
	return stepState(elapsed);
}
