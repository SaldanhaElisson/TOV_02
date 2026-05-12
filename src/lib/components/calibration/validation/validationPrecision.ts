import { PRECISION_THRESHOLD } from './validationConfig';

export type GazeSample = {
	gx: number;
	gy: number;
	tx: number;
	ty: number;
};

function sampleDistance(sample: GazeSample): number {
	return Math.sqrt((sample.gx - sample.tx) ** 2 + (sample.gy - sample.ty) ** 2);
}

function scoreFromDistance(dist: number, maxDist: number): number {
	if (dist >= maxDist) return 0;
	return 100 - (dist / maxDist) * 100;
}

function sampleScore(sample: GazeSample): number {
	return scoreFromDistance(sampleDistance(sample), window.innerHeight / 2);
}

export function computePrecision(allSamples: GazeSample[][]): number {
	const samples = allSamples.flat();
	if (samples.length === 0) return 0;
	const total = samples.reduce((sum, s) => sum + sampleScore(s), 0);
	const precision = Math.round(total / samples.length);
	console.log(`[TOV] Validation — ${samples.length} samples | precision: ${precision}%`);
	return precision;
}

export function isPrecisionSufficient(precision: number): boolean {
	return precision >= PRECISION_THRESHOLD;
}
