import { describe, it, expect } from 'vitest';
import {
	calculateEuclideanDistance,
	calculateMeanError,
	toScreenPoint,
	calculatePrecision,
} from './precision';

describe('calculateEuclideanDistance', () => {
	it('returns 0 for identical points', () => {
		expect(calculateEuclideanDistance({ x: 10, y: 20 }, { x: 10, y: 20 })).toBe(0);
	});

	it('returns the correct distance for a 3-4-5 right triangle', () => {
		expect(calculateEuclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
	});

	it('is symmetric (order of arguments does not matter)', () => {
		const p1 = { x: 100, y: 200 };
		const p2 = { x: 150, y: 250 };
		expect(calculateEuclideanDistance(p1, p2)).toBe(calculateEuclideanDistance(p2, p1));
	});

	it('handles float coordinates', () => {
		const dist = calculateEuclideanDistance({ x: 0, y: 0 }, { x: 1.5, y: 2 });
		expect(dist).toBeCloseTo(2.5, 5);
	});
});

describe('calculateMeanError', () => {
	const target = { x: 100, y: 100 };

	it('returns 0 for an empty sample set (guard clause)', () => {
		expect(calculateMeanError([], target)).toBe(0);
	});

	it('returns 0 when all samples coincide with the target', () => {
		const samples = [target, target, target];
		expect(calculateMeanError(samples, target)).toBe(0);
	});

	it('returns the single distance for a one-sample set', () => {
		const sample = { x: 103, y: 104 };
		const expected = calculateEuclideanDistance(sample, target);
		expect(calculateMeanError([sample], target)).toBe(expected);
	});

	it('returns the mean of multiple distances', () => {
		// Distance from (100,100) to (104,103) = 5; to (96,97) = 5
		const samples = [{ x: 104, y: 103 }, { x: 96, y: 97 }];
		expect(calculateMeanError(samples, target)).toBe(5);
	});

	it('does not mutate the input array', () => {
		const samples = [{ x: 200, y: 200 }];
		calculateMeanError(samples, target);
		expect(samples).toHaveLength(1);
	});
});

describe('toScreenPoint', () => {
	it('converts 50% 50% to the centre of the viewport', () => {
		const result = toScreenPoint({ x: 50, y: 50 }, 1920, 1080);
		expect(result).toEqual({ x: 960, y: 540 });
	});

	it('converts 0% 0% to the top-left corner', () => {
		expect(toScreenPoint({ x: 0, y: 0 }, 1920, 1080)).toEqual({ x: 0, y: 0 });
	});

	it('converts 100% 100% to the bottom-right corner', () => {
		expect(toScreenPoint({ x: 100, y: 100 }, 1920, 1080)).toEqual({ x: 1920, y: 1080 });
	});

	it('handles non-square viewports', () => {
		const result = toScreenPoint({ x: 10, y: 20 }, 800, 600);
		expect(result).toEqual({ x: 80, y: 120 });
	});
});

// ============================================================
// calculatePrecision — WebGazer-compatible 0-100% score
// Window: 1920×1080 → center (960, 540), maxDistance = 540
// ============================================================

describe('calculatePrecision', () => {
	const W = 1920;
	const H = 1080;
	// center = (960, 540), maxDistance = 540

	it('retorna 0 para arrays vazios (guard clause)', () => {
		expect(calculatePrecision([], [], W, H)).toBe(0);
	});

	it('retorna 100 quando todas as amostras estão exatamente no centro', () => {
		const xs = [960, 960, 960];
		const ys = [540, 540, 540];
		expect(calculatePrecision(xs, ys, W, H)).toBe(100);
	});

	it('retorna 0 quando a amostra está exatamente na borda do raio de aceitação', () => {
		// distance = 540 = maxDistance → precision = 0
		const xs = [960];
		const ys = [540 + 540]; // y = 1080, distance = 540
		expect(calculatePrecision(xs, ys, W, H)).toBe(0);
	});

	it('retorna 0 quando a amostra está além do raio de aceitação', () => {
		const xs = [960];
		const ys = [540 + 600]; // distance > 540
		expect(calculatePrecision(xs, ys, W, H)).toBe(0);
	});

	it('retorna ~50 quando a amostra está a metade do raio (distância = 270)', () => {
		// Sample at (960, 540+270) → distance = 270 → precision = 100 - (270/540)*100 = 50
		const xs = [960];
		const ys = [810];
		expect(calculatePrecision(xs, ys, W, H)).toBe(50);
	});

	it('retorna a média arredondada de múltiplas amostras', () => {
		// Sample 1: distance 0   → precision 100
		// Sample 2: distance 270 → precision 50
		// Average = 75
		const xs = [960, 960];
		const ys = [540, 810];
		expect(calculatePrecision(xs, ys, W, H)).toBe(75);
	});

	it('arredonda o resultado para inteiro', () => {
		// 3 samples: 100, 50, 0 → avg = 50.0 (exact, no rounding needed)
		// Use 5 samples to get a float average
		// precisions: 100, 100, 100, 100, 50 → avg = 90
		const xs = [960, 960, 960, 960, 960];
		const ys = [540, 540, 540, 540, 810];
		expect(calculatePrecision(xs, ys, W, H)).toBe(90);
	});

	it('não muta os arrays de entrada', () => {
		const xs = [960, 960];
		const ys = [540, 540];
		calculatePrecision(xs, ys, W, H);
		expect(xs).toHaveLength(2);
		expect(ys).toHaveLength(2);
	});

	it('funciona com viewport não-quadrado (landscape)', () => {
		// 800×600: center (400, 300), maxDistance = 300
		// Sample at center → 100
		expect(calculatePrecision([400], [300], 800, 600)).toBe(100);
	});
});
