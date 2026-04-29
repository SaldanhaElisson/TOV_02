import { experimentStore, type Stimulus } from './experimentStore.svelte';


export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'complete';


let currentIndex       = $state(-1);
let isComplete         = $state(false);
let startTime          = $state<number | null>(null);
let needsRecalibration = $state(false);
let isPaused           = $state(false);
let order              = $state<number[]>([]);

let timerId: ReturnType<typeof setTimeout> | null = null;


const currentStimulus = $derived<Stimulus | null>(
	currentIndex < 0 ? null : (experimentStore.stimuli[order[currentIndex]] ?? null),
);

const isRunning = $derived(
	currentIndex >= 0 && !isComplete && !isPaused && !needsRecalibration,
);


function shuffled(indices: number[]): number[] {
	const arr = [...indices];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

function buildOrder(): number[] {
	const indices = experimentStore.stimuli.map((_, i) => i);
	if (!experimentStore.config.isRandom) return indices;
	return shuffled(indices);
}


function clearTimer(): void {
	if (timerId === null) return;
	clearTimeout(timerId);
	timerId = null;
}

function scheduleAdvance(): void {
	clearTimer();
	if (experimentStore.config.mode !== 'FIXED') return;
	timerId = setTimeout(() => next(), experimentStore.config.duration);
}

function checkRecalibration(completedCount: number): void {
	const interval = experimentStore.config.recalibrationInterval;
	if (interval <= 0) return;
	if (completedCount % interval !== 0) return;
	needsRecalibration = true;
}


function start(): void {
	if (currentIndex >= 0) return;
	if (!experimentStore.hasStimuli) return;
	order = buildOrder();
	startTime = Date.now();
	currentIndex = 0;
	scheduleAdvance();
}

function next(): void {
	if (isComplete) return;
	if (needsRecalibration) return;
	if (currentIndex < 0) return;
	clearTimer();
	const completedCount = currentIndex + 1;
	if (currentIndex >= order.length - 1) {
		isComplete = true;
		return;
	}
	currentIndex += 1;
	checkRecalibration(completedCount);
	if (needsRecalibration) return;
	scheduleAdvance();
}

function pause(): void {
	if (!isRunning) return;
	clearTimer();
	isPaused = true;
}

function resume(): void {
	if (!isPaused) return;
	isPaused = false;
	scheduleAdvance();
}

function acknowledgeRecalibration(): void {
	if (!needsRecalibration) return;
	needsRecalibration = false;
	scheduleAdvance();
}

function stop(): void {
	clearTimer();
	currentIndex       = -1;
	isComplete         = false;
	startTime          = null;
	needsRecalibration = false;
	isPaused           = false;
	order              = [];
}


export const executionStore = {
	get currentIndex()       { return currentIndex; },
	get isComplete()         { return isComplete; },
	get startTime()          { return startTime; },
	get needsRecalibration() { return needsRecalibration; },
	get isPaused()           { return isPaused; },
	get isRunning()          { return isRunning; },
	get currentStimulus()    { return currentStimulus; },
	start,
	next,
	pause,
	resume,
	acknowledgeRecalibration,
	stop,
};
