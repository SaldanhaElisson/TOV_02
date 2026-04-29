import { experimentStore, type Stimulus } from './experimentStore.svelte';


export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'complete';


let currentIndex = $state(-1);
let isComplete = $state(false);
let startTime = $state<number | null>(null);
let isPaused = $state(false);
let order = $state<number[]>([]);

let timerId: ReturnType<typeof setTimeout> | null = null;


const currentStimulus = $derived<Stimulus | null>(
	currentIndex < 0 ? null : (experimentStore.stimuli[order[currentIndex]] ?? null),
);

const isRunning = $derived(
	currentIndex >= 0 && !isComplete && !isPaused,
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
	if (currentIndex < 0) return;
	clearTimer();
	if (currentIndex >= order.length - 1) {
		isComplete = true;
		return;
	}
	currentIndex += 1;
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

function stop(): void {
	clearTimer();
	currentIndex = -1;
	isComplete = false;
	startTime = null;
	isPaused = false;
	order = [];
}


export const executionStore = {
	get currentIndex() { return currentIndex; },
	get isComplete() { return isComplete; },
	get startTime() { return startTime; },
	get isPaused() { return isPaused; },
	get isRunning() { return isRunning; },
	get currentStimulus() { return currentStimulus; },
	start,
	next,
	pause,
	resume,
	stop,
};
