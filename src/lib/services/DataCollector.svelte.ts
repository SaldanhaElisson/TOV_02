import { gazeStore } from '$lib/stores/GazeStore.svelte';
import { executionStore } from '$lib/stores/executionStore.svelte';
import { resultsStore } from '$lib/stores/resultsStore.svelte';

// ============================================================
// Constants
// ============================================================

/** Sampling rate: ~30 fps. */
const INTERVAL_MS = 33;

// ============================================================
// State
// ============================================================

let timerId: ReturnType<typeof setInterval> | null = null;

// ============================================================
// Private
// ============================================================

/**
 * Called on every interval tick.
 * Guard 1: skip if the experiment is not actively running.
 * Guard 2: skip if startTime has not been set yet.
 */
function collectSample(): void {
	if (!executionStore.isRunning) return;
	const startTime = executionStore.startTime;
	if (startTime === null) return;

	const elapsedTime = Date.now() - startTime;
	resultsStore.recordGazeEntry(gazeStore.latestGaze, elapsedTime);
}

// ============================================================
// Public API
// ============================================================

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
