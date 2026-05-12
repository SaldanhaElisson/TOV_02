import type { Point } from '$lib/stores/GazeStore.svelte';
import { CALIBRATION_POINTS, TOTAL_POINTS } from '../calibrationPoints';

export function toPixels(point: Point): Point {
	return {
		x: (point.x / 100) * window.innerWidth,
		y: (point.y / 100) * window.innerHeight,
	};
}

function randomIndexUpTo(max: number): number {
	return Math.floor(Math.random() * max);
}

function swapAt(arr: number[], i: number, j: number): void {
	[arr[i], arr[j]] = [arr[j], arr[i]];
}

function shuffled(indices: number[]): number[] {
	const result = [...indices];
	for (let i = result.length - 1; i > 0; i--) {
		swapAt(result, i, randomIndexUpTo(i + 1));
	}
	return result;
}

function isCenterPoint(index: number): boolean {
	const p = CALIBRATION_POINTS[index];
	return p.x === 50 && p.y === 50;
}

export function buildCalibrationOrder(): number[] {
	const allIndices  = [...Array(TOTAL_POINTS).keys()];
	const randomOrder = shuffled(allIndices);
	const nonCenter   = randomOrder.filter(i => !isCenterPoint(i));
	const centerIndex = allIndices.find(isCenterPoint) ?? TOTAL_POINTS - 1;
	return [...nonCenter, centerIndex];
}
