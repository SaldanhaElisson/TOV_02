// ============================================================
// Types
// ============================================================

export interface Stimulus {
	id: string;
	url: string;
	name: string;
}

export type ExperimentMode    = 'FIXED' | 'MANUAL';
export type CalibrationMode   = 'click';

export interface ExperimentConfig {
	isRandom: boolean;
	mode: ExperimentMode;
	/** Duration per stimulus in milliseconds (FIXED mode only). */
	duration: number;
	/** Recalibrate after every N stimuli. 0 = disabled. */
	recalibrationInterval: number;
	calibrationMode: CalibrationMode;
	/** Apply Kalman filter to gaze predictions. Smooths noise but adds lag. */
	useKalmanFilter: boolean;
}

// ============================================================
// Defaults
// ============================================================

const DEFAULT_CONFIG: ExperimentConfig = {
	isRandom: false,
	mode: 'FIXED',
	duration: 5000,
	recalibrationInterval: 0,
	calibrationMode: 'click',
	useKalmanFilter: false,
};

// ============================================================
// Reactive State (Svelte 5 Runes)
// ============================================================

let stimuli = $state<Stimulus[]>([]);
let config = $state<ExperimentConfig>({ ...DEFAULT_CONFIG });

const hasStimuli = $derived(stimuli.length > 0);
const stimulusCount = $derived(stimuli.length);

// ============================================================
// Private: Pure Helpers
// ============================================================

function isImageFile(file: File): boolean {
	return file.type.startsWith('image/');
}

function fileToStimulus(file: File): Stimulus {
	return {
		id: crypto.randomUUID(),
		url: URL.createObjectURL(file),
		name: file.name,
	};
}

function findStimulusById(id: string): Stimulus | undefined {
	return stimuli.find((s) => s.id === id);
}

function revokeAndFilter(id: string): void {
	const target = findStimulusById(id);
	if (!target) return;
	URL.revokeObjectURL(target.url);
	stimuli = stimuli.filter((s) => s.id !== id);
}

// ============================================================
// Public API
// ============================================================

/**
 * Adds image files as stimuli, creating Blob URLs for each.
 * Non-image files are silently ignored (guard clause via filter).
 */
function addStimuli(files: File[]): void {
	const newStimuli = files.filter(isImageFile).map(fileToStimulus);
	stimuli = [...stimuli, ...newStimuli];
}

/**
 * Removes a stimulus by id, revoking its Blob URL to free memory.
 * No-op if the id does not exist.
 */
function removeStimulus(id: string): void {
	revokeAndFilter(id);
}

/**
 * Merges partial config into the current experiment configuration.
 */
function updateConfig(partial: Partial<ExperimentConfig>): void {
	config = { ...config, ...partial };
}

/**
 * Revokes all Blob URLs and empties the stimuli array.
 * Must be called when the experiment ends to prevent memory leaks.
 */
function clear(): void {
	stimuli.forEach((s) => URL.revokeObjectURL(s.url));
	stimuli = [];
}

// ============================================================
// Exported Store Object
// ============================================================

export const experimentStore = {
	get stimuli() {
		return stimuli;
	},
	get config() {
		return config;
	},
	get hasStimuli() {
		return hasStimuli;
	},
	get stimulusCount() {
		return stimulusCount;
	},
	addStimuli,
	removeStimulus,
	updateConfig,
	clear,
};
