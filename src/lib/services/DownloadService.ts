// ============================================================
// DownloadService
// Single Responsibility: encapsula toda a lógica de download
// de arquivos CSV via Blob + anchor temporário.
// ============================================================

/**
 * Converte uma string CSV em um Blob, injeta um <a> temporário
 * no DOM, dispara o download e limpa todos os recursos criados.
 *
 * Calisthenics:
 *  - Zero blocos aninhados (sequência plana).
 *  - 1 nível de indentação (corpo da função).
 *  - Sem `any` — anchor tipado como HTMLAnchorElement.
 */
export function triggerCsvDownload(csvString: string, fileName: string): void {
	const blob   = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
	const url    = URL.createObjectURL(blob);
	const anchor = document.createElement('a') as HTMLAnchorElement;

	anchor.href     = url;
	anchor.download = fileName;

	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);

	URL.revokeObjectURL(url);
}
