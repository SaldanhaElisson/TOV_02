import { render, cleanup, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StimulusDisplay from './StimulusDisplay.svelte';


const mocks = vi.hoisted(() => ({
	stimulus: { id: '1', url: 'blob:mock/test.jpg', name: 'test.jpg' } as
		| { id: string; url: string; name: string }
		| null,
	mode: 'MANUAL' as 'FIXED' | 'MANUAL',
	next: vi.fn(),
	setImageBounds: vi.fn(),
}));



vi.mock('$lib/stores/executionStore.svelte', () => ({
	executionStore: {
		get currentStimulus() { return mocks.stimulus; },
		next: mocks.next,
	},
}));

vi.mock('$lib/stores/experimentStore.svelte', () => ({
	experimentStore: {
		get config() { return { mode: mocks.mode }; },
	},
}));

vi.mock('$lib/stores/resultsStore.svelte', () => ({
	resultsStore: { setImageBounds: mocks.setImageBounds },
}));



const MOCK_RECT: DOMRect = {
	width: 800, height: 600, left: 100, top: 50,
	right: 900, bottom: 650, x: 100, y: 50,
	toJSON: () => ({}),
};

const ZERO_RECT: DOMRect = {
	width: 0, height: 0, left: 0, top: 0,
	right: 0, bottom: 0, x: 0, y: 0,
	toJSON: () => ({}),
};

function mockImageElement(el: HTMLImageElement, rect: DOMRect = MOCK_RECT): void {
	vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect);
	// naturalWidth/naturalHeight equal element size → scale = 1, no letterbox offset
	Object.defineProperty(el, 'naturalWidth',  { value: rect.width,  configurable: true });
	Object.defineProperty(el, 'naturalHeight', { value: rect.height, configurable: true });
}

function mockBoundingRect(el: Element, rect: DOMRect = MOCK_RECT): void {
	mockImageElement(el as HTMLImageElement, rect);
}

// ============================================================
// rAF control — deterministic scheduling for layout-deferred assertions
// ============================================================

let rafQueue: FrameRequestCallback[] = [];

function flushRaf(): void {
	rafQueue.splice(0).forEach(cb => cb(performance.now()));
}


describe('StimulusDisplay', () => {
	beforeEach(() => {
		mocks.stimulus = { id: '1', url: 'blob:mock/test.jpg', name: 'test.jpg' };
		mocks.mode = 'MANUAL';
		vi.clearAllMocks();
		rafQueue = [];
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			rafQueue.push(cb);
			return 0;
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		cleanup();
	});

	// ----------------------------------------------------------
	// Renderização
	// ----------------------------------------------------------

	describe('Renderização', () => {
		it('renderiza a imagem com src e alt do estímulo atual', () => {
			const { getByRole } = render(StimulusDisplay);
			const img = getByRole('img') as HTMLImageElement;
			expect(img.src).toContain('blob:mock/test.jpg');
			expect(img.alt).toBe('test.jpg');
		});

		it('não renderiza a imagem quando currentStimulus é null', () => {
			mocks.stimulus = null;
			const { queryByRole } = render(StimulusDisplay);
			expect(queryByRole('img')).toBeNull();
		});
	});

	// ----------------------------------------------------------
	// Captura de bounds — timing correto (rAF, não onload direto)
	// ----------------------------------------------------------

	describe('Captura de bounds (onload → rAF → getBoundingClientRect)', () => {
		it('NÃO lê getBoundingClientRect no momento imediato do onload', async () => {
			const { getByRole } = render(StimulusDisplay);
			const img = getByRole('img');
			// Simula: no onload, o layout ainda não foi calculado → rect retorna (0, 0)
			mockBoundingRect(img, ZERO_RECT);

			await fireEvent.load(img);

			// Com código sem rAF: setImageBounds já teria sido chamado com (0, 0) ← FALHA
			// Com rAF: ainda não foi chamado (deferred) ← PASSA
			expect(mocks.setImageBounds).not.toHaveBeenCalled();
		});

		it('lê getBoundingClientRect após o rAF, quando o layout já está completo', async () => {
			const { getByRole } = render(StimulusDisplay);
			const img = getByRole('img');
			mockBoundingRect(img, ZERO_RECT); // onload: layout não pronto

			await fireEvent.load(img);
			expect(mocks.setImageBounds).not.toHaveBeenCalled();

			// Layout completa entre onload e rAF
			mockBoundingRect(img, MOCK_RECT);
			flushRaf();

			expect(mocks.setImageBounds).toHaveBeenCalledOnce();
			expect(mocks.setImageBounds).toHaveBeenCalledWith({
				name: 'test.jpg',
				width: 800,
				height: 600,
				screenX: 100,
				screenY: 50,
			});
		});

		it('chama resultsStore.setImageBounds após o carregamento da imagem', async () => {
			const { getByRole } = render(StimulusDisplay);
			const img = getByRole('img');
			mockBoundingRect(img);

			await fireEvent.load(img);
			flushRaf();

			expect(mocks.setImageBounds).toHaveBeenCalledOnce();
			expect(mocks.setImageBounds).toHaveBeenCalledWith({
				name: 'test.jpg',
				width: 800,
				height: 600,
				screenX: 100,
				screenY: 50,
			});
		});

		it('não chama setImageBounds se o estímulo for null no momento do onload', async () => {
			const { getByRole } = render(StimulusDisplay);
			const img = getByRole('img');
			mockBoundingRect(img);

			mocks.stimulus = null; // muda antes do evento
			await fireEvent.load(img);
			flushRaf();

			expect(mocks.setImageBounds).not.toHaveBeenCalled();
		});
	});

	// ----------------------------------------------------------
	// Teclado — Spacebar (modo MANUAL)
	// ----------------------------------------------------------

	describe('Tecla Espaço — modo MANUAL', () => {
		it('chama executionStore.next() ao pressionar Espaço', async () => {
			render(StimulusDisplay);
			await fireEvent.keyDown(window, { key: ' ' });
			expect(mocks.next).toHaveBeenCalledOnce();
		});

		it('NÃO chama next() no modo FIXED', async () => {
			mocks.mode = 'FIXED';
			render(StimulusDisplay);
			await fireEvent.keyDown(window, { key: ' ' });
			expect(mocks.next).not.toHaveBeenCalled();
		});

		it('NÃO chama next() para outra tecla (ex: Enter)', async () => {
			render(StimulusDisplay);
			await fireEvent.keyDown(window, { key: 'Enter' });
			expect(mocks.next).not.toHaveBeenCalled();
		});

		it('remove o listener ao desmontar o componente', async () => {
			const { unmount } = render(StimulusDisplay);
			unmount();
			await fireEvent.keyDown(window, { key: ' ' });
			expect(mocks.next).not.toHaveBeenCalled();
		});
	});
});
