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
