import { gazeStore } from '$lib/stores/GazeStore.svelte';
import { executionStore } from '$lib/stores/executionStore.svelte';
import { resultsStore } from '$lib/stores/resultsStore.svelte';

const INTERVAL_MS = 33;

let timerId: ReturnType<typeof setInterval> | null = null;

function collectSample(): void {
	if (!executionStore.isRunning) return;
	resultsStore.recordGazeEntry(gazeStore.latestGaze);
}

function start(): void {
	if (timerId !== null) return;
	timerId = setInterval(collectSample, INTERVAL_MS);
}

function stop(): void {
	if (timerId === null) return;
	clearInterval(timerId);
	timerId = null;
}

export const dataCollector = { start, stop };
