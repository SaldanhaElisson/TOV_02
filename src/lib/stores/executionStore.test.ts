import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executionStore } from './executionStore.svelte';
import { experimentStore } from './experimentStore.svelte';

const createObjectURL = vi.fn((f: File) => `blob:mock/${f.name}`);
vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });

function makeFile(name: string): File {
	return new File(['data'], name, { type: 'image/jpeg' });
}

function loadStimuli(names: string[]): void {
	experimentStore.addStimuli(names.map(makeFile));
}

describe('executionStore', () => {
	beforeEach(() => {
		executionStore.stop();
		experimentStore.clear();
		vi.clearAllMocks();
		createObjectURL.mockImplementation((f: File) => `blob:mock/${f.name}`);
		experimentStore.updateConfig({ mode: 'MANUAL', duration: 5000, recalibrationInterval: 0, isRandom: false });
	});

	describe('Estado inicial', () => {
		it('currentIndex começa em -1 (não iniciado)', () => {
			expect(executionStore.currentIndex).toBe(-1);
		});

		it('isComplete começa false', () => {
			expect(executionStore.isComplete).toBe(false);
		});

		it('currentStimulus começa null', () => {
			expect(executionStore.currentStimulus).toBeNull();
		});

		it('needsRecalibration começa false', () => {
			expect(executionStore.needsRecalibration).toBe(false);
		});

		it('isRunning começa false', () => {
			expect(executionStore.isRunning).toBe(false);
		});
	});

	describe('start()', () => {
		it('define currentIndex como 0', () => {
			loadStimuli(['a.jpg', 'b.jpg']);
			executionStore.start();
			expect(executionStore.currentIndex).toBe(0);
		});

		it('define startTime com um timestamp', () => {
			loadStimuli(['a.jpg']);
			executionStore.start();
			expect(executionStore.startTime).toBeTypeOf('number');
		});

		it('define isRunning como true', () => {
			loadStimuli(['a.jpg']);
			executionStore.start();
			expect(executionStore.isRunning).toBe(true);
		});

		it('currentStimulus aponta para o primeiro estímulo', () => {
			loadStimuli(['first.jpg', 'second.jpg']);
			executionStore.start();
			expect(executionStore.currentStimulus?.name).toBe('first.jpg');
		});

		it('é no-op sem estímulos carregados', () => {
			executionStore.start();
			expect(executionStore.currentIndex).toBe(-1);
		});

		it('é no-op quando já está em execução', () => {
			loadStimuli(['a.jpg', 'b.jpg']);
			executionStore.start();
			executionStore.start();
			expect(executionStore.currentIndex).toBe(0);
		});
	});

	describe('next() — modo MANUAL', () => {
		beforeEach(() => loadStimuli(['a.jpg', 'b.jpg', 'c.jpg']));

		it('avança currentIndex de 0 para 1', () => {
			executionStore.start();
			executionStore.next();
			expect(executionStore.currentIndex).toBe(1);
		});

		it('currentStimulus muda após next()', () => {
			executionStore.start();
			executionStore.next();
			expect(executionStore.currentStimulus?.name).toBe('b.jpg');
		});

		it('define isComplete na última transição', () => {
			executionStore.start();
			executionStore.next();
			executionStore.next();
			executionStore.next();
			expect(executionStore.isComplete).toBe(true);
		});

		it('não avança além do último estímulo', () => {
			executionStore.start();
			executionStore.next();
			executionStore.next();
			executionStore.next();
			const indexOnComplete = executionStore.currentIndex;
			executionStore.next();
			expect(executionStore.currentIndex).toBe(indexOnComplete);
		});

		it('é no-op antes de start()', () => {
			executionStore.next();
			expect(executionStore.currentIndex).toBe(-1);
		});
	});

	describe('Modo FIXED — avanço automático por timer', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			experimentStore.updateConfig({ mode: 'FIXED', duration: 1000, recalibrationInterval: 0 });
			loadStimuli(['a.jpg', 'b.jpg', 'c.jpg']);
		});

		afterEach(() => vi.useRealTimers());

		it('avança automaticamente após duration ms', () => {
			executionStore.start();
			vi.advanceTimersByTime(1000);
			expect(executionStore.currentIndex).toBe(1);
		});

		it('avança novamente no segundo tick', () => {
			executionStore.start();
			vi.advanceTimersByTime(2000);
			expect(executionStore.currentIndex).toBe(2);
		});

		it('define isComplete após o último tick', () => {
			executionStore.start();
			vi.advanceTimersByTime(3000);
			expect(executionStore.isComplete).toBe(true);
		});

		it('NÃO avança no modo MANUAL (sem timer)', () => {
			experimentStore.updateConfig({ mode: 'MANUAL' });
			executionStore.start();
			vi.advanceTimersByTime(10000);
			expect(executionStore.currentIndex).toBe(0);
		});

		it('timer é cancelado ao chamar stop()', () => {
			executionStore.start();
			executionStore.stop();
			vi.advanceTimersByTime(1000);
			expect(executionStore.currentIndex).toBe(-1);
		});
	});

	describe('pause() e resume()', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			experimentStore.updateConfig({ mode: 'FIXED', duration: 2000, recalibrationInterval: 0 });
			loadStimuli(['a.jpg', 'b.jpg', 'c.jpg']);
		});

		afterEach(() => vi.useRealTimers());

		it('define isPaused como true', () => {
			executionStore.start();
			executionStore.pause();
			expect(executionStore.isPaused).toBe(true);
		});

		it('interrompe o avanço automático enquanto pausado', () => {
			executionStore.start();
			executionStore.pause();
			vi.advanceTimersByTime(5000);
			expect(executionStore.currentIndex).toBe(0);
		});

		it('retoma o avanço após resume()', () => {
			executionStore.start();
			executionStore.pause();
			executionStore.resume();
			vi.advanceTimersByTime(2000);
			expect(executionStore.currentIndex).toBe(1);
		});

		it('resume() é no-op quando não está pausado', () => {
			loadStimuli(['extra.jpg']);
			executionStore.start();
			executionStore.resume();
			expect(executionStore.isPaused).toBe(false);
		});
	});

	describe('Recalibração periódica (recalibrationInterval)', () => {
		it('define needsRecalibration ao atingir o intervalo', () => {
			experimentStore.updateConfig({ recalibrationInterval: 2 });
			loadStimuli(['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg']);
			executionStore.start();
			executionStore.next();
			executionStore.next();
			expect(executionStore.needsRecalibration).toBe(true);
		});

		it('não dispara quando recalibrationInterval é 0', () => {
			experimentStore.updateConfig({ recalibrationInterval: 0 });
			loadStimuli(['a.jpg', 'b.jpg', 'c.jpg']);
			executionStore.start();
			executionStore.next();
			executionStore.next();
			expect(executionStore.needsRecalibration).toBe(false);
		});

		it('next() é no-op quando needsRecalibration está ativo', () => {
			experimentStore.updateConfig({ recalibrationInterval: 1 });
			loadStimuli(['a.jpg', 'b.jpg', 'c.jpg']);
			executionStore.start();
			executionStore.next();
			const frozenIndex = executionStore.currentIndex;
			executionStore.next();
			expect(executionStore.currentIndex).toBe(frozenIndex);
		});

		it('acknowledgeRecalibration() limpa o flag', () => {
			experimentStore.updateConfig({ recalibrationInterval: 1 });
			loadStimuli(['a.jpg', 'b.jpg', 'c.jpg']);
			executionStore.start();
			executionStore.next();
			executionStore.acknowledgeRecalibration();
			expect(executionStore.needsRecalibration).toBe(false);
		});

		it('retoma o avanço após acknowledgeRecalibration() no modo FIXED', () => {
			vi.useFakeTimers();
			experimentStore.updateConfig({ mode: 'FIXED', duration: 500, recalibrationInterval: 1 });
			loadStimuli(['a.jpg', 'b.jpg', 'c.jpg']);
			executionStore.start();
			vi.advanceTimersByTime(500);
			expect(executionStore.needsRecalibration).toBe(true);
			executionStore.acknowledgeRecalibration();
			vi.advanceTimersByTime(500);
			expect(executionStore.currentIndex).toBe(2);
			vi.useRealTimers();
		});
	});

	describe('isRandom — embaralhamento da ordem', () => {
		it('visita todos os estímulos mesmo embaralhado', () => {
			experimentStore.updateConfig({ isRandom: true });
			loadStimuli(['a.jpg', 'b.jpg', 'c.jpg']);
			executionStore.start();
			const names = new Set<string>();
			names.add(executionStore.currentStimulus!.name);
			executionStore.next();
			names.add(executionStore.currentStimulus!.name);
			executionStore.next();
			names.add(executionStore.currentStimulus!.name);
			expect(names.size).toBe(3);
		});
	});
});
