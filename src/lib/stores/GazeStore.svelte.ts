declare const webgazer: WebGazer;

interface WebGazer {
	begin(): Promise<WebGazer>;
	end(): void;
	pause(): void;
	resume(): Promise<WebGazer>;
	setRegression(name: string): WebGazer;
	applyKalmanFilter(enabled: boolean): WebGazer;
	setGazeListener(fn: (data: GazePrediction | null, elapsedTime: number) => void): WebGazer;
	showVideoPreview(show: boolean): WebGazer;
	showPredictionPoints(show: boolean): WebGazer;
	recordScreenPosition(x: number, y: number, eventType?: string): void;
	getStoredPoints(): [Array<number | undefined>, Array<number | undefined>];
	clearData(): WebGazer;
	removeMouseEventListeners(): WebGazer;
	params: {
		faceMeshSolutionPath: string;
		saveDataAcrossSessions: boolean;
	};
}

interface GazePrediction {
	x: number;
	y: number;
}

export type Point = { x: number; y: number };

export type GazeReading = Point & {
	timestamp: number;
	elapsedTime: number;
};

type GazeStatus = 'idle' | 'active' | 'paused';

const NULL_GAZE: Point = { x: 0, y: 0 };

let status        = $state<GazeStatus>('idle');
let latestGaze    = $state<Point>(NULL_GAZE);
let isCameraReady = $state(false);

const isActive = $derived(status === 'active');

function handleGazeData(data: GazePrediction | null): void {
	if (!data) return;
	if (status !== 'active') return;
	latestGaze = { x: data.x, y: data.y };
}

async function beginTracking(): Promise<void> {
	try {
		webgazer.params.saveDataAcrossSessions = false;

		await webgazer
			.setRegression('ridge')
			.applyKalmanFilter(false)
			.setGazeListener(handleGazeData)
			.showVideoPreview(true)
			.showPredictionPoints(false)
			.begin();

		webgazer.removeMouseEventListeners();

		status = 'active';
		isCameraReady = true;
	} catch (err) {
		console.error('WebGazer: hardware error', err);
	}
}

function releaseResources(): void {
	webgazer.end();
	isCameraReady = false;
	status = 'idle';
	latestGaze = NULL_GAZE;
}

async function start(): Promise<void> {
	if (status !== 'idle') return;
	await beginTracking();
}

function pause(): void {
	if (status !== 'active') return;
	webgazer.pause();
	status = 'paused';
}

async function resume(): Promise<void> {
	if (status !== 'paused') return;
	await webgazer.resume();
	status = 'active';
}

function stop(): void {
	if (status === 'idle') return;
	releaseResources();
}

function recordClick(x: number, y: number): void {
	if (status === 'idle') return;
	webgazer.recordScreenPosition(x, y, 'click');
}

function recordMove(x: number, y: number): void {
	if (status === 'idle') return;
	webgazer.recordScreenPosition(x, y, 'click');
}

function getStoredPoints(): [number[], number[]] {
	if (status === 'idle') return [[], []];
	const raw = webgazer.getStoredPoints();
	console.log('[TOV] Raw stored points from WebGazer:', raw);
	const [rawX, rawY] = raw;
	const validX: number[] = [];
	const validY: number[] = [];
	for (let i = 0; i < rawX.length; i++) {
		if (rawX[i] === undefined || rawY[i] === undefined) continue;
		validX.push(rawX[i] as number);
		validY.push(rawY[i] as number);
	}
	console.log('[TOV] Valid stored points:', validX.length);
	return [validX, validY];
}

function clearData(): void {
	if (status === 'idle') return;
	webgazer.clearData();
}

function setVideoPreview(show: boolean): void {
	if (status === 'idle') return;
	webgazer.showVideoPreview(show);
}

function setPredictionPoints(show: boolean): void {
	if (status === 'idle') return;
	webgazer.showPredictionPoints(show);
}

function setKalmanFilter(enabled: boolean): void {
	if (status === 'idle') return;
	webgazer.applyKalmanFilter(enabled);
}

export const gazeStore = {
	get isActive()      { return isActive; },
	get latestGaze()    { return latestGaze; },
	get isCameraReady() { return isCameraReady; },
	start,
	pause,
	resume,
	stop,
	clearData,
	recordClick,
	recordMove,
	getStoredPoints,
	setVideoPreview,
	setPredictionPoints,
	setKalmanFilter,
};
