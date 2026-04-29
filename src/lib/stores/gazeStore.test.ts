import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// WebGazer global stub
// webgazer is loaded as an IIFE <script> tag — no npm module to mock.
// We stub the global with a vi.fn() mock before importing the store.
// ============================================================

type GazeCallback = (data: { x: number; y: number } | null) => void;

interface WebGazerMock {
	begin: ReturnType<typeof vi.fn>;
	end: ReturnType<typeof vi.fn>;
	pause: ReturnType<typeof vi.fn>;
	resume: ReturnType<typeof vi.fn>;
	setRegression: ReturnType<typeof vi.fn>;
	applyKalmanFilter: ReturnType<typeof vi.fn>;
	setGazeListener: ReturnType<typeof vi.fn>;
	showVideoPreview: ReturnType<typeof vi.fn>;
	showPredictionPoints: ReturnType<typeof vi.fn>;
	recordScreenPosition: ReturnType<typeof vi.fn>;
	getStoredPoints: ReturnType<typeof vi.fn>;
	clearData: ReturnType<typeof vi.fn>;
	removeMouseEventListeners: ReturnType<typeof vi.fn>;
	params: { saveDataAcrossSessions: boolean };
}

const wgMock: WebGazerMock = {
	begin:                vi.fn(),
	end:                  vi.fn(),
	pause:                vi.fn(),
	resume:               vi.fn(),
	setRegression:        vi.fn(),
	applyKalmanFilter:    vi.fn(),
	setGazeListener:      vi.fn(),
	showVideoPreview:     vi.fn(),
	showPredictionPoints: vi.fn(),
	recordScreenPosition: vi.fn(),
	getStoredPoints:      vi.fn(() => [[], []]),
	clearData:                  vi.fn(),
	removeMouseEventListeners:  vi.fn(),
	params:                     { saveDataAcrossSessions: true },
};

vi.stubGlobal('webgazer', wgMock);

// ============================================================
// Import store after stub is in place
// ============================================================

import { gazeStore } from './GazeStore.svelte';

// ============================================================
// Helpers
// ============================================================

function setupMockChaining(): void {
	wgMock.begin.mockResolvedValue(undefined);
	wgMock.resume.mockResolvedValue(undefined);
	wgMock.setRegression.mockReturnValue(wgMock);
	wgMock.applyKalmanFilter.mockReturnValue(wgMock);
	wgMock.setGazeListener.mockReturnValue(wgMock);
	wgMock.showVideoPreview.mockReturnValue(wgMock);
	wgMock.showPredictionPoints.mockReturnValue(wgMock);
}

function getCapturedGazeListener(): GazeCallback {
	const lastCall = wgMock.setGazeListener.mock.calls.at(-1) as [GazeCallback] | undefined;
	if (!lastCall) throw new Error('setGazeListener was not called — did you call gazeStore.start()?');
	return lastCall[0];
}

// ============================================================
// Suite
// ============================================================

describe('GazeStore', () => {
	beforeEach(() => {
		gazeStore.stop();
		vi.clearAllMocks();
		setupMockChaining();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.stubGlobal('webgazer', wgMock); // restore stub for next test
	});

	describe('Estado inicial', () => {
		it('isActive deve ser false', () => {
			expect(gazeStore.isActive).toBe(false);
		});

		it('latestGaze deve ser o ponto nulo { x: 0, y: 0 }', () => {
			expect(gazeStore.latestGaze).toEqual({ x: 0, y: 0 });
		});

		it('isCameraReady deve ser false', () => {
			expect(gazeStore.isCameraReady).toBe(false);
		});
	});

	describe('Ciclo de vida: start()', () => {
		it('invoca webgazer.begin()', async () => {
			await gazeStore.start();
			expect(wgMock.begin).toHaveBeenCalledOnce();
		});

		it('define isActive como true após start()', async () => {
			await gazeStore.start();
			expect(gazeStore.isActive).toBe(true);
		});

		it('define isCameraReady como true após start()', async () => {
			await gazeStore.start();
			expect(gazeStore.isCameraReady).toBe(true);
		});

		it('é um no-op quando já está ativo (idempotente)', async () => {
			await gazeStore.start();
			await gazeStore.start();
			expect(wgMock.begin).toHaveBeenCalledOnce();
		});

		it('registra o gaze listener no WebGazer', async () => {
			await gazeStore.start();
			expect(wgMock.setGazeListener).toHaveBeenCalledOnce();
			expect(wgMock.setGazeListener.mock.calls[0][0]).toBeTypeOf('function');
		});
	});

	describe('Reatividade de dados', () => {
		it('atualiza latestGaze quando o listener dispara com coordenadas válidas', async () => {
			await gazeStore.start();
			const listener = getCapturedGazeListener();
			listener({ x: 100, y: 200 });
			expect(gazeStore.latestGaze).toEqual({ x: 100, y: 200 });
		});

		it('preserva a estrutura Point com floats precisos', async () => {
			await gazeStore.start();
			const listener = getCapturedGazeListener();
			listener({ x: 42.75, y: 99.01 });
			expect(gazeStore.latestGaze.x).toBe(42.75);
			expect(gazeStore.latestGaze.y).toBe(99.01);
		});

		it('ignora dados nulos e preserva o latestGaze anterior', async () => {
			await gazeStore.start();
			const listener = getCapturedGazeListener();
			listener({ x: 10, y: 20 });
			listener(null);
			expect(gazeStore.latestGaze).toEqual({ x: 10, y: 20 });
		});

		it('acumula múltiplas atualizações sequenciais', async () => {
			await gazeStore.start();
			const listener = getCapturedGazeListener();
			listener({ x: 1, y: 1 });
			listener({ x: 2, y: 2 });
			listener({ x: 3, y: 3 });
			expect(gazeStore.latestGaze).toEqual({ x: 3, y: 3 });
		});
	});

	describe('Resiliência: estado pausado', () => {
		it('não atualiza latestGaze quando listener dispara enquanto pausado', async () => {
			await gazeStore.start();
			const listener = getCapturedGazeListener();
			listener({ x: 50, y: 75 });
			gazeStore.pause();
			listener({ x: 999, y: 888 });
			expect(gazeStore.latestGaze).toEqual({ x: 50, y: 75 });
		});

		it('define isActive como false ao pausar', async () => {
			await gazeStore.start();
			gazeStore.pause();
			expect(gazeStore.isActive).toBe(false);
		});

		it('invoca webgazer.pause() ao pausar', async () => {
			await gazeStore.start();
			gazeStore.pause();
			expect(wgMock.pause).toHaveBeenCalledOnce();
		});

		it('retorna ao estado ativo após resume()', async () => {
			await gazeStore.start();
			gazeStore.pause();
			await gazeStore.resume();
			expect(gazeStore.isActive).toBe(true);
		});

		it('resume() é um no-op quando está ativo (não pausado)', async () => {
			await gazeStore.start();
			await gazeStore.resume();
			expect(wgMock.resume).not.toHaveBeenCalled();
		});
	});

	describe('Cleanup: stop()', () => {
		it('invoca webgazer.end()', async () => {
			await gazeStore.start();
			gazeStore.stop();
			expect(wgMock.end).toHaveBeenCalledOnce();
		});

		it('reseta isActive para false', async () => {
			await gazeStore.start();
			gazeStore.stop();
			expect(gazeStore.isActive).toBe(false);
		});

		it('reseta isCameraReady para false', async () => {
			await gazeStore.start();
			gazeStore.stop();
			expect(gazeStore.isCameraReady).toBe(false);
		});

		it('reseta latestGaze para o ponto nulo, limpando a memória', async () => {
			await gazeStore.start();
			const listener = getCapturedGazeListener();
			listener({ x: 300, y: 400 });
			gazeStore.stop();
			expect(gazeStore.latestGaze).toEqual({ x: 0, y: 0 });
		});

		it('é um no-op quando já está idle (não invoca webgazer.end)', () => {
			gazeStore.stop();
			expect(wgMock.end).not.toHaveBeenCalled();
		});

		it('permite reinicialização completa após stop()', async () => {
			await gazeStore.start();
			gazeStore.stop();
			await gazeStore.start();
			expect(wgMock.begin).toHaveBeenCalledTimes(2);
			expect(gazeStore.isActive).toBe(true);
		});
	});
});
