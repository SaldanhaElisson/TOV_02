import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const MOCK_URL = 'blob:mock/tov_results.csv';

const createObjectURL = vi.fn(() => MOCK_URL);
const revokeObjectURL = vi.fn();
vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

import { triggerCsvDownload } from './DownloadService';

describe('triggerCsvDownload', () => {
	let anchor: HTMLAnchorElement;

	beforeEach(() => {
		vi.clearAllMocks();
		createObjectURL.mockReturnValue(MOCK_URL);

		anchor = document.createElement('a');
		vi.spyOn(anchor, 'click').mockImplementation(() => {});

		vi.spyOn(document, 'createElement').mockReturnValue(anchor as HTMLElement);
		vi.spyOn(document.body, 'appendChild').mockReturnValue(anchor as Node);
		vi.spyOn(document.body, 'removeChild').mockReturnValue(anchor as Node);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Blob', () => {
		it('cria um Blob com o type MIME text/csv;charset=utf-8;', () => {
			triggerCsvDownload('col1,col2\n1,2', 'export.csv');

			const passed = createObjectURL.mock.calls[0][0] as Blob;
			expect(passed.type).toBe('text/csv;charset=utf-8;');
		});

		it('inclui o conteúdo CSV no Blob', async () => {
			const csv = 'timestamp,ImageName\n1000,img.jpg';
			triggerCsvDownload(csv, 'export.csv');

			const passed = createObjectURL.mock.calls[0][0] as Blob;
			expect(await passed.text()).toBe(csv);
		});

		it('passa o Blob para URL.createObjectURL', () => {
			triggerCsvDownload('data', 'file.csv');
			expect(createObjectURL).toHaveBeenCalledOnce();
			expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
		});
	});

	describe('Configuração do anchor', () => {
		it('define anchor.href com a URL do objeto gerado', () => {
			triggerCsvDownload('data', 'file.csv');
			expect(anchor.href).toBe(MOCK_URL);
		});

		it('define anchor.download com o fileName recebido', () => {
			triggerCsvDownload('data', 'resultados_tov.csv');
			expect(anchor.download).toBe('resultados_tov.csv');
		});

		it('cria o elemento com a tag "a"', () => {
			triggerCsvDownload('data', 'file.csv');
			expect(vi.mocked(document.createElement)).toHaveBeenCalledWith('a');
		});
	});

	describe('Ciclo de vida no DOM', () => {
		it('adiciona o anchor ao document.body antes do click', () => {
			const appendSpy = vi.mocked(document.body.appendChild);
			triggerCsvDownload('data', 'file.csv');
			expect(appendSpy).toHaveBeenCalledWith(anchor);
		});

		it('dispara anchor.click() para iniciar o download', () => {
			triggerCsvDownload('data', 'file.csv');
			expect(vi.mocked(anchor.click)).toHaveBeenCalledOnce();
		});

		it('remove o anchor do document.body após o click', () => {
			const removeSpy = vi.mocked(document.body.removeChild);
			triggerCsvDownload('data', 'file.csv');
			expect(removeSpy).toHaveBeenCalledWith(anchor);
		});

		it('append ocorre antes de click e remove ocorre depois', () => {
			const order: string[] = [];
			vi.mocked(document.body.appendChild).mockImplementation(() => {
				order.push('append');
				return anchor;
			});
			vi.mocked(anchor.click).mockImplementation(() => { order.push('click'); });
			vi.mocked(document.body.removeChild).mockImplementation(() => {
				order.push('remove');
				return anchor;
			});

			triggerCsvDownload('data', 'file.csv');
			expect(order).toEqual(['append', 'click', 'remove']);
		});
	});

	describe('Cleanup (sem memory leak)', () => {
		it('chama URL.revokeObjectURL com a URL criada', () => {
			triggerCsvDownload('data', 'file.csv');
			expect(revokeObjectURL).toHaveBeenCalledWith(MOCK_URL);
		});

		it('revoga a URL após o click (não antes)', () => {
			const callOrder: string[] = [];
			vi.mocked(anchor.click).mockImplementation(() => { callOrder.push('click'); });
			revokeObjectURL.mockImplementation(() => { callOrder.push('revoke'); });

			triggerCsvDownload('data', 'file.csv');
			expect(callOrder).toEqual(['click', 'revoke']);
		});
	});
});
