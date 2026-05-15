import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Point } from '$lib/stores/GazeStore.svelte';

const mocks = vi.hoisted(() => ({
	latestGaze: { x: 100, y: 200 } as Point,
	isRunning:  true,
	startTime:  0 as number | null,
}));

vi.mock('$lib/stores/GazeStore.svelte', () => ({
	gazeStore: {
		get latestGaze() { return mocks.latestGaze; },
	},
}));

vi.mock('$lib/stores/executionStore.svelte', () => ({
	executionStore: {
		get isRunning() { return mocks.isRunning; },
		get startTime() { return mocks.startTime; },
	},
}));

import { resultsStore } from '$lib/stores/resultsStore.svelte';
import { dataCollector } from './DataCollector.svelte';

describe('dataCollector', () => {
	let recordGazeEntrySpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		mocks.latestGaze = { x: 100, y: 200 };
		mocks.isRunning  = true;
		mocks.startTime  = 0;
		resultsStore.flush();
		recordGazeEntrySpy = vi.spyOn(resultsStore, 'recordGazeEntry');
		vi.useFakeTimers();
	});

	afterEach(() => {
		dataCollector.stop();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('start() / stop()', () => {
		it('start() começa a coletar pontos de gaze a cada ~33ms', () => {
			dataCollector.start();
			vi.advanceTimersByTime(33);
			expect(recordGazeEntrySpy).toHaveBeenCalledOnce();
		});

		it('acumula chamadas a cada tick do intervalo', () => {
			dataCollector.start();
			vi.advanceTimersByTime(99);
			expect(recordGazeEntrySpy).toHaveBeenCalledTimes(3);
		});

		it('stop() cancela a coleta — nenhum novo ponto após parar', () => {
			dataCollector.start();
			dataCollector.stop();
			vi.advanceTimersByTime(99);
			expect(recordGazeEntrySpy).not.toHaveBeenCalled();
		});

		it('start() é no-op se já está em execução (idempotente)', () => {
			dataCollector.start();
			dataCollector.start();
			vi.advanceTimersByTime(33);
			expect(recordGazeEntrySpy).toHaveBeenCalledOnce();
		});

		it('stop() é seguro chamar sem start() prévio', () => {
			expect(() => dataCollector.stop()).not.toThrow();
		});
	});

	describe('Coleta condicional', () => {
		it('não coleta quando o experimento está pausado (isRunning = false)', () => {
			mocks.isRunning = false;
			dataCollector.start();
			vi.advanceTimersByTime(33);
			expect(recordGazeEntrySpy).not.toHaveBeenCalled();
		});

		it('não coleta quando startTime é null (execução não iniciada)', () => {
			mocks.startTime = null;
			dataCollector.start();
			vi.advanceTimersByTime(33);
			expect(recordGazeEntrySpy).not.toHaveBeenCalled();
		});

		it('retoma a coleta quando isRunning volta para true', () => {
			mocks.isRunning = false;
			dataCollector.start();
			vi.advanceTimersByTime(33);
			expect(recordGazeEntrySpy).not.toHaveBeenCalled();

			mocks.isRunning = true;
			vi.advanceTimersByTime(33);
			expect(recordGazeEntrySpy).toHaveBeenCalledOnce();
		});
	});

	describe('Dados gerados', () => {
		it('passa o ponto de gaze correto para recordGazeEntry', () => {
			mocks.latestGaze = { x: 512, y: 384 };
			dataCollector.start();
			vi.advanceTimersByTime(33);
			expect(recordGazeEntrySpy).toHaveBeenCalledWith({ x: 512, y: 384 }, expect.any(Number));
		});

		it('calcula elapsedTime como Date.now() − startTime', () => {
			vi.setSystemTime(5000);
			mocks.startTime = 5000;
			dataCollector.start();
			vi.advanceTimersByTime(33);
			expect(recordGazeEntrySpy).toHaveBeenCalledWith(expect.any(Object), 33);
		});

		it('o registro produzido contém as 7 colunas do CSV', () => {
			vi.setSystemTime(5000);
			mocks.startTime  = 5000;
			mocks.latestGaze = { x: 841, y: 569 };

			resultsStore.setImageBounds({
				name:    'stimulus_01.jpg',
				width:   1280,
				height:  720,
				screenX: 320,
				screenY: 180,
			});

			dataCollector.start();
			vi.advanceTimersByTime(33);

			const row = resultsStore.rows[0];

			expect(row.timestamp).toBeTypeOf('number');
			expect(row.imageName).toBe('stimulus_01.jpg');
			expect(row.imageWidth).toBe(1280);
			expect(row.imageHeight).toBe(720);
			expect(row.imageScreenX).toBe(320);
			expect(row.imageScreenY).toBe(180);

			expect(row.gazeData).toHaveLength(1);
			expect(row.gazeData[0]).toMatchObject({
				x: 841,
				y: 569,
				elapsedTime: expect.any(Number),
			});
		});
	});
});
