import { describe, it, expect } from 'vitest';
import { exportToCsv, type ExportRow, type GazeEntry } from './CsvService';


const GAZE_ENTRY: GazeEntry = {
	x: 841.27,
	y: 569.41,
	timestamp: 1774639661938,
	elapsedTime: 31947.9,
};

const SINGLE_ROW: ExportRow = {
	timestamp: 1774639661938,
	imageName: 'stimulus_01.jpg',
	imageWidth: 1280,
	imageHeight: 720,
	imageScreenX: 320.5,
	imageScreenY: 180.0,
	gazeData: [GAZE_ENTRY],
};


describe('CsvService — exportToCsv', () => {
	describe('Cabeçalho (Header)', () => {
		it('gera exatamente as 7 colunas definidas no DATA_DICTIONARY', () => {
			const csv = exportToCsv([]);
			expect(csv).toBe(
				'timestamp,ImageName,ImageWidth,ImageHeight,ImageScreenX,ImageScreenY,GazeData_JSON',
			);
		});

		it('retorna somente o cabeçalho quando o array está vazio', () => {
			const csv = exportToCsv([]);
			const lines = csv.split('\n');
			expect(lines).toHaveLength(1);
		});
	});

	describe('Estrutura de linhas', () => {
		it('gera exatamente header + 1 linha para um único ExportRow', () => {
			const csv = exportToCsv([SINGLE_ROW]);
			const lines = csv.split('\n');
			expect(lines).toHaveLength(2);
		});

		it('gera header + N linhas para N ExportRows', () => {
			const csv = exportToCsv([SINGLE_ROW, SINGLE_ROW, SINGLE_ROW]);
			const lines = csv.split('\n');
			expect(lines).toHaveLength(4);
		});

		it('a primeira linha é sempre o cabeçalho', () => {
			const csv = exportToCsv([SINGLE_ROW]);
			const header = csv.split('\n')[0];
			expect(header).toBe(
				'timestamp,ImageName,ImageWidth,ImageHeight,ImageScreenX,ImageScreenY,GazeData_JSON',
			);
		});
	});

	describe('Valores das colunas', () => {
		it('preserva o timestamp como número na primeira coluna', () => {
			const csv = exportToCsv([SINGLE_ROW]);
			const dataLine = csv.split('\n')[1];
			expect(dataLine.startsWith('1774639661938,')).toBe(true);
		});

		it('preserva o imageName na segunda coluna', () => {
			const csv = exportToCsv([SINGLE_ROW]);
			const dataLine = csv.split('\n')[1];
			const columns = dataLine.split(',');
			expect(columns[1]).toBe('stimulus_01.jpg');
		});

		it('preserva as dimensões e posição da imagem (colunas 3–6)', () => {
			const csv = exportToCsv([SINGLE_ROW]);
			const dataLine = csv.split('\n')[1];
			const columns = dataLine.split(',');
			expect(Number(columns[2])).toBe(1280);
			expect(Number(columns[3])).toBe(720);
			expect(Number(columns[4])).toBe(320.5);
			expect(Number(columns[5])).toBe(180);
		});
	});

	describe('Escape CSV do campo GazeData_JSON (regra crítica)', () => {
		it('envolve o JSON em aspas duplas externas', () => {
			const csv = exportToCsv([SINGLE_ROW]);
			const dataLine = csv.split('\n')[1];
			expect(dataLine).toMatch(/,"(\[.*\])"$/);
		});

		it('duplica as aspas internas do JSON (""x"": em vez de "x":)', () => {
			const csv = exportToCsv([SINGLE_ROW]);
			expect(csv).toContain('""x""');
			expect(csv).toContain('""y""');
			expect(csv).toContain('""timestamp""');
			expect(csv).toContain('""elapsedTime""');
		});

		it('produz a linha exata do exemplo do DATA_DICTIONARY', () => {
			const row: ExportRow = {
				timestamp: 1774639661938,
				imageName: 'img.jpg',
				imageWidth: 800,
				imageHeight: 600,
				imageScreenX: 0,
				imageScreenY: 0,
				gazeData: [
					{ x: 841.27, y: 569.41, timestamp: 1774639661938, elapsedTime: 31947.8 },
				],
			};
			const csv = exportToCsv([row]);
			const dataLine = csv.split('\n')[1];

			const expected =
				'1774639661938,img.jpg,800,600,0,0,"[{""x"":841.27,""y"":569.41,""timestamp"":1774639661938,""elapsedTime"":31947.8}]"';
			expect(dataLine).toBe(expected);
		});

		it('serializa múltiplos GazeEntry no mesmo campo JSON', () => {
			const row: ExportRow = {
				...SINGLE_ROW,
				gazeData: [
					{ x: 1, y: 2, timestamp: 100, elapsedTime: 10 },
					{ x: 3, y: 4, timestamp: 200, elapsedTime: 20 },
				],
			};
			const csv = exportToCsv([row]);
			expect(csv).toContain('""x"":1');
			expect(csv).toContain('""x"":3');
		});

		it('serializa gazeData vazio como array JSON vazio escapado', () => {
			const row: ExportRow = { ...SINGLE_ROW, gazeData: [] };
			const csv = exportToCsv([row]);
			expect(csv).toContain('"[]"');
		});
	});

	describe('Pureza do serviço', () => {
		it('não muta o array de entrada', () => {
			const data: ExportRow[] = [SINGLE_ROW];
			exportToCsv(data);
			expect(data).toHaveLength(1);
		});

		it('retorna uma string (não dispara download nem acessa o DOM)', () => {
			const result = exportToCsv([SINGLE_ROW]);
			expect(typeof result).toBe('string');
		});
	});
});
