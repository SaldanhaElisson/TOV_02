import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ExportRow } from '$lib/services/CsvService';

const exportToCsvMock = vi.hoisted(() => vi.fn((_rows: ExportRow[]) => 'header\nmock_row'));
const triggerCsvDownloadMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/services/CsvService', () => ({
	exportToCsv: exportToCsvMock,
}));

vi.mock('$lib/services/DownloadService', () => ({
	triggerCsvDownload: triggerCsvDownloadMock,
}));

import { resultsStore } from './resultsStore.svelte';

function makeRow(overrides: Partial<ExportRow> = {}): ExportRow {
	return {
		timestamp:    1000,
		imageName:    'test.jpg',
		imageWidth:   800,
		imageHeight:  600,
		imageScreenX: 10,
		imageScreenY: 20,
		gazeData:     [],
		...overrides,
	};
}

describe('resultsStore', () => {
	beforeEach(() => {
		resultsStore.flush();
		vi.clearAllMocks();
		exportToCsvMock.mockReturnValue('header\nmock_row');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('setImageBounds()', () => {
		it('cria um novo row quando a geometria é válida (width e height > 0)', () => {
			resultsStore.setImageBounds({ name: 'a.jpg', width: 800, height: 600, screenX: 0, screenY: 0 });
			expect(resultsStore.rows).toHaveLength(1);
		});

		it('cria um novo row mesmo quando screenX e screenY são 0 (imagem fullscreen)', () => {
			resultsStore.setImageBounds({ name: 'a.jpg', width: 1920, height: 1080, screenX: 0, screenY: 0 });
			expect(resultsStore.rows).toHaveLength(1);
		});

		it('é no-op (guard) quando width e height são zero — elemento não renderizado', () => {
			resultsStore.setImageBounds({ name: 'a.jpg', width: 0, height: 0, screenX: 0, screenY: 0 });
			expect(resultsStore.rows).toHaveLength(0);
		});

		it('preenche corretamente os campos da linha criada', () => {
			resultsStore.setImageBounds({ name: 'b.jpg', width: 1280, height: 720, screenX: 200, screenY: 100 });
			expect(resultsStore.rows[0]).toMatchObject({
				imageName: 'b.jpg', imageWidth: 1280, imageHeight: 720,
				imageScreenX: 200, imageScreenY: 100, gazeData: [],
			});
		});
	});

	describe('addRecord()', () => {
		it('insere um ExportRow no array de rows', () => {
			resultsStore.addRecord(makeRow());
			expect(resultsStore.rows).toHaveLength(1);
		});

		it('preserva todos os campos do ExportRow inserido', () => {
			const row = makeRow({ imageName: 'stimulus_01.jpg', imageWidth: 1280 });
			resultsStore.addRecord(row);
			expect(resultsStore.rows[0]).toMatchObject({
				imageName:  'stimulus_01.jpg',
				imageWidth: 1280,
			});
		});

		it('acumula múltiplos registros em ordem de inserção', () => {
			resultsStore.addRecord(makeRow({ imageName: 'a.jpg' }));
			resultsStore.addRecord(makeRow({ imageName: 'b.jpg' }));
			resultsStore.addRecord(makeRow({ imageName: 'c.jpg' }));
			expect(resultsStore.rows).toHaveLength(3);
			expect(resultsStore.rows[0].imageName).toBe('a.jpg');
			expect(resultsStore.rows[2].imageName).toBe('c.jpg');
		});

		it('rows é acessível como getter reativo', () => {
			expect(resultsStore.rows).toEqual([]);
			resultsStore.addRecord(makeRow());
			expect(resultsStore.rows).toHaveLength(1);
		});
	});

	describe('generateFinalCsv()', () => {
		it('chama exportToCsv com os rows acumulados', () => {
			const row = makeRow();
			resultsStore.addRecord(row);
			resultsStore.generateFinalCsv();
			expect(exportToCsvMock).toHaveBeenCalledOnce();
			expect(exportToCsvMock).toHaveBeenCalledWith([row]);
		});

		it('retorna a string formatada que o CsvService produziu', () => {
			exportToCsvMock.mockReturnValue('custom_csv_output');
			resultsStore.addRecord(makeRow());
			expect(resultsStore.generateFinalCsv()).toBe('custom_csv_output');
		});

		it('retorna somente o header quando rows está vazio', () => {
			exportToCsvMock.mockReturnValue('header_only');
			expect(resultsStore.generateFinalCsv()).toBe('header_only');
			expect(exportToCsvMock).toHaveBeenCalledWith([]);
		});

		it('não muta o estado interno ao ser chamado', () => {
			resultsStore.addRecord(makeRow());
			resultsStore.generateFinalCsv();
			expect(resultsStore.rows).toHaveLength(1);
		});
	});

	describe('exportAndDownload()', () => {
		it('é no-op (guard clause) quando não há dados', () => {
			resultsStore.exportAndDownload();
			expect(triggerCsvDownloadMock).not.toHaveBeenCalled();
		});

		it('chama triggerCsvDownload com a string CSV gerada', () => {
			exportToCsvMock.mockReturnValue('header\nrow1');
			resultsStore.addRecord(makeRow());
			resultsStore.exportAndDownload();
			expect(triggerCsvDownloadMock).toHaveBeenCalledOnce();
			expect(triggerCsvDownloadMock).toHaveBeenCalledWith(
				'header\nrow1',
				expect.stringMatching(/^tov_result_\d+\.csv$/),
			);
		});

		it('limpa o estado (flush) após disparar o download', () => {
			resultsStore.addRecord(makeRow());
			resultsStore.addRecord(makeRow());
			resultsStore.exportAndDownload();
			expect(resultsStore.rows).toHaveLength(0);
		});
	});
});
