import { describe, it, expect, vi, beforeEach } from 'vitest';
import { experimentStore } from './experimentStore.svelte';

// ============================================================
// jsdom does not implement URL.createObjectURL / revokeObjectURL.
// We replace them with deterministic stubs so tests stay pure.
// ============================================================

const createObjectURL = vi.fn((file: File) => `blob:mock/${file.name}`);
const revokeObjectURL = vi.fn();

vi.stubGlobal('URL', {
	...URL,
	createObjectURL,
	revokeObjectURL,
});



function makeImageFile(name = 'photo.jpg', type = 'image/jpeg'): File {
	return new File(['data'], name, { type });
}

function makeTextFile(name = 'notes.txt'): File {
	return new File(['data'], name, { type: 'text/plain' });
}



describe('experimentStore', () => {
	beforeEach(() => {
		experimentStore.clear();
		vi.clearAllMocks();
		// Restore stub after clearAllMocks resets call counts
		createObjectURL.mockImplementation((file: File) => `blob:mock/${file.name}`);
	});



	describe('Estado inicial', () => {
		it('stimuli começa vazio', () => {
			expect(experimentStore.stimuli).toHaveLength(0);
		});

		it('hasStimuli começa false', () => {
			expect(experimentStore.hasStimuli).toBe(false);
		});

		it('stimulusCount começa em 0', () => {
			expect(experimentStore.stimulusCount).toBe(0);
		});

		it('config.mode padrão é FIXED', () => {
			expect(experimentStore.config.mode).toBe('FIXED');
		});

		it('config.isRandom padrão é false', () => {
			expect(experimentStore.config.isRandom).toBe(false);
		});

		it('config.duration padrão é 5000ms', () => {
			expect(experimentStore.config.duration).toBe(5000);
		});

	});



	describe('addStimuli()', () => {
		it('adiciona um arquivo de imagem ao array de stimuli', () => {
			experimentStore.addStimuli([makeImageFile('img1.jpg')]);
			expect(experimentStore.stimuli).toHaveLength(1);
		});

		it('cada estímulo contém id, url e name', () => {
			experimentStore.addStimuli([makeImageFile('img1.jpg')]);
			const stimulus = experimentStore.stimuli[0];
			expect(stimulus.id).toBeTypeOf('string');
			expect(stimulus.url).toBe('blob:mock/img1.jpg');
			expect(stimulus.name).toBe('img1.jpg');
		});

		it('preserva o nome original do arquivo em stimulus.name', () => {
			experimentStore.addStimuli([makeImageFile('stimulus_01.png', 'image/png')]);
			expect(experimentStore.stimuli[0].name).toBe('stimulus_01.png');
		});

		it('ignora arquivos não-imagem (guard clause)', () => {
			experimentStore.addStimuli([makeTextFile(), makeImageFile('ok.jpg')]);
			expect(experimentStore.stimuli).toHaveLength(1);
			expect(experimentStore.stimuli[0].name).toBe('ok.jpg');
		});

		it('não adiciona nada quando todos os arquivos são inválidos', () => {
			experimentStore.addStimuli([makeTextFile(), makeTextFile('data.csv')]);
			expect(experimentStore.stimuli).toHaveLength(0);
		});

		it('acumula múltiplas chamadas sem perder stimuli anteriores', () => {
			experimentStore.addStimuli([makeImageFile('a.jpg')]);
			experimentStore.addStimuli([makeImageFile('b.png')]);
			expect(experimentStore.stimuli).toHaveLength(2);
		});

		it('chama URL.createObjectURL para cada arquivo de imagem válido', () => {
			experimentStore.addStimuli([makeImageFile('x.jpg'), makeImageFile('y.jpg')]);
			expect(createObjectURL).toHaveBeenCalledTimes(2);
		});

		it('não chama URL.createObjectURL para arquivos inválidos', () => {
			experimentStore.addStimuli([makeTextFile()]);
			expect(createObjectURL).not.toHaveBeenCalled();
		});

		it('gera ids únicos para cada estímulo', () => {
			experimentStore.addStimuli([makeImageFile('a.jpg'), makeImageFile('b.jpg')]);
			const [s1, s2] = experimentStore.stimuli;
			expect(s1.id).not.toBe(s2.id);
		});

		it('atualiza hasStimuli para true após adicionar', () => {
			experimentStore.addStimuli([makeImageFile()]);
			expect(experimentStore.hasStimuli).toBe(true);
		});

		it('atualiza stimulusCount corretamente', () => {
			experimentStore.addStimuli([makeImageFile(), makeImageFile('b.jpg')]);
			expect(experimentStore.stimulusCount).toBe(2);
		});
	});


	describe('removeStimulus()', () => {
		it('remove o estímulo pelo id', () => {
			experimentStore.addStimuli([makeImageFile('keep.jpg'), makeImageFile('remove.jpg')]);
			const idToRemove = experimentStore.stimuli[1].id;
			experimentStore.removeStimulus(idToRemove);
			expect(experimentStore.stimuli).toHaveLength(1);
			expect(experimentStore.stimuli[0].name).toBe('keep.jpg');
		});

		it('chama URL.revokeObjectURL com a url do estímulo removido', () => {
			experimentStore.addStimuli([makeImageFile('target.jpg')]);
			const { id, url } = experimentStore.stimuli[0];
			experimentStore.removeStimulus(id);
			expect(revokeObjectURL).toHaveBeenCalledWith(url);
		});

		it('é um no-op quando o id não existe', () => {
			experimentStore.addStimuli([makeImageFile()]);
			experimentStore.removeStimulus('non-existent-id');
			expect(experimentStore.stimuli).toHaveLength(1);
			expect(revokeObjectURL).not.toHaveBeenCalled();
		});

		it('não revoga a url de outros estímulos', () => {
			experimentStore.addStimuli([makeImageFile('a.jpg'), makeImageFile('b.jpg')]);
			const idToRemove = experimentStore.stimuli[0].id;
			experimentStore.removeStimulus(idToRemove);
			expect(revokeObjectURL).toHaveBeenCalledOnce();
		});
	});



	describe('updateConfig()', () => {
		it('atualiza apenas os campos fornecidos (merge parcial)', () => {
			experimentStore.updateConfig({ mode: 'MANUAL' });
			expect(experimentStore.config.mode).toBe('MANUAL');
			expect(experimentStore.config.isRandom).toBe(false);
		});

		it('atualiza isRandom', () => {
			experimentStore.updateConfig({ isRandom: true });
			expect(experimentStore.config.isRandom).toBe(true);
		});

		it('atualiza duration', () => {
			experimentStore.updateConfig({ duration: 8000 });
			expect(experimentStore.config.duration).toBe(8000);
		});

it('múltiplas chamadas acumulam corretamente', () => {
			experimentStore.updateConfig({ mode: 'MANUAL', duration: 3000 });
			experimentStore.updateConfig({ isRandom: true });
			expect(experimentStore.config.mode).toBe('MANUAL');
			expect(experimentStore.config.duration).toBe(3000);
			expect(experimentStore.config.isRandom).toBe(true);
		});
	});



	describe('clear()', () => {
		it('esvazia o array de stimuli', () => {
			experimentStore.addStimuli([makeImageFile(), makeImageFile('b.jpg')]);
			experimentStore.clear();
			expect(experimentStore.stimuli).toHaveLength(0);
		});

		it('chama URL.revokeObjectURL para cada estímulo', () => {
			experimentStore.addStimuli([makeImageFile('a.jpg'), makeImageFile('b.jpg')]);
			experimentStore.clear();
			expect(revokeObjectURL).toHaveBeenCalledTimes(2);
		});

		it('revoga as urls corretas', () => {
			experimentStore.addStimuli([makeImageFile('a.jpg')]);
			const url = experimentStore.stimuli[0].url;
			experimentStore.clear();
			expect(revokeObjectURL).toHaveBeenCalledWith(url);
		});

		it('é seguro chamar quando o array já está vazio', () => {
			experimentStore.clear();
			expect(revokeObjectURL).not.toHaveBeenCalled();
		});

		it('atualiza hasStimuli para false após clear', () => {
			experimentStore.addStimuli([makeImageFile()]);
			experimentStore.clear();
			expect(experimentStore.hasStimuli).toBe(false);
		});

		it('atualiza stimulusCount para 0 após clear', () => {
			experimentStore.addStimuli([makeImageFile(), makeImageFile('b.jpg')]);
			experimentStore.clear();
			expect(experimentStore.stimulusCount).toBe(0);
		});
	});
});
