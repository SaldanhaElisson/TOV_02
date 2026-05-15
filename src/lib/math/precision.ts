import type { Point } from '$lib/stores/GazeStore.svelte';

export function calculateEuclideanDistance(p1: Point, p2: Point): number {
	const dx = p1.x - p2.x;
	const dy = p1.y - p2.y;
	return Math.sqrt(dx * dx + dy * dy);
}

export function calculateMeanError(samples: Point[], target: Point): number {
	if (samples.length === 0) return 0;
	const totalError = samples.reduce(
		(sum, sample) => sum + calculateEuclideanDistance(sample, target),
		0,
	);
	return totalError / samples.length;
}

export function toScreenPoint(percent: Point, width: number, height: number): Point {
	return {
		x: (percent.x / 100) * width,
		y: (percent.y / 100) * height,
	};
}

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
