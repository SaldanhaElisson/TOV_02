// WebGazer is loaded as a plain <script> tag (public/webgazer.js).
// It exposes window.webgazer as an IIFE global — no npm import needed.
declare const webgazer: WebGazer;

// ============================================================
// Types
// ============================================================

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
	/** Returns [xPast50, yPast50] — WebGazer's internal rolling buffer of last 50 predictions. */
	getStoredPoints(): [Array<number | undefined>, Array<number | undefined>];
	/** Wipes all stored regression training data. Call before each new calibration. */
	clearData(): WebGazer;
	/**
	 * Removes WebGazer's built-in mouse/click event listeners.
	 * Without this, cursor position contaminates the regression model —
	 * the dot drifts toward wherever the mouse is resting on screen.
	 */
	removeMouseEventListeners(): WebGazer;
	params: {
		faceMeshSolutionPath: string;
		/** When false, calibration data is NOT persisted to localStorage across page reloads. */
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

// ============================================================
// State
// ============================================================

const NULL_GAZE: Point = { x: 0, y: 0 };

let status        = $state<GazeStatus>('idle');
let latestGaze    = $state<Point>(NULL_GAZE);
let isCameraReady = $state(false);

const isActive = $derived(status === 'active');

// ============================================================
// Private helpers
// ============================================================

function handleGazeData(data: GazePrediction | null): void {
	if (!data) return;
	if (status !== 'active') return;
	latestGaze = { x: data.x, y: data.y };
}

async function beginTracking(): Promise<void> {
	try {
		// Prevent localStorage contamination from previous sessions.
		// Without this, old calibration data accumulates and corrupts the model.
		webgazer.params.saveDataAcrossSessions = false;

		await webgazer
			.setRegression('ridge')
			.applyKalmanFilter(true)
			.setGazeListener(handleGazeData)
			.showVideoPreview(true)
			.showPredictionPoints(false)
			.begin();

		// Remove built-in mouse listeners AFTER begin() — otherwise WebGazer
		// trains the regression on cursor position, pulling the dot toward
		// wherever the mouse is resting instead of where the user is looking.
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

// ============================================================
// Public API
// ============================================================

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

/**
 * Records a calibration click at the exact centre of the target point.
 * Passing 'click' as eventType instructs WebGazer's ridge regression to
 * weight this sample as a deliberate fixation, improving accuracy.
 */
function recordClick(x: number, y: number): void {
	if (status === 'idle') return;
	webgazer.recordScreenPosition(x, y, 'click');
}

/**
 * Returns the last 50 valid (x, y) gaze predictions from WebGazer's
 * internal rolling buffer. Sparse entries (undefined) are stripped so
 * both output arrays are always the same length.
 * Returns [[], []] when the camera is not active.
 */
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

/**
 * Wipes all WebGazer regression training data.
 * Must be called at the start of every calibration to prevent stale data
 * from previous sessions (or previous calibrations) from skewing the model.
 */
function clearData(): void {
	if (status === 'idle') return;
	webgazer.clearData();
}

/**
 * Show or hide the webcam preview overlay.
 * Called by App.svelte via $effect when the stage changes.
 * No-op when camera is not yet initialised.
 */
function setVideoPreview(show: boolean): void {
	if (status === 'idle') return;
	webgazer.showVideoPreview(show);
}

/**
 * Show or hide the red gaze-prediction dot.
 * Always called with false in production; exposed for debugging.
 */
function setPredictionPoints(show: boolean): void {
	if (status === 'idle') return;
	webgazer.showPredictionPoints(show);
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
	getStoredPoints,
	setVideoPreview,
	setPredictionPoints,
};
