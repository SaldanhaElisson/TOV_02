export interface Stimulus {
	id: string;
	url: string;
	name: string;
}

export type ExperimentMode = 'FIXED' | 'MANUAL';

export interface ExperimentConfig {
	isRandom: boolean;
	mode: ExperimentMode;
	duration: number;
	recalibrationInterval: number;
	useKalmanFilter: boolean;
}

const DEFAULT_CONFIG: ExperimentConfig = {
	isRandom: false,
	mode: 'FIXED',
	duration: 5000,
	recalibrationInterval: 0,
	useKalmanFilter: false,
};

let stimuli = $state<Stimulus[]>([]);
let config = $state<ExperimentConfig>({ ...DEFAULT_CONFIG });

const hasStimuli = $derived(stimuli.length > 0);
const stimulusCount = $derived(stimuli.length);

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

function addStimuli(files: File[]): void {
	const newStimuli = files.filter(isImageFile).map(fileToStimulus);
	stimuli = [...stimuli, ...newStimuli];
}

function removeStimulus(id: string): void {
	revokeAndFilter(id);
}

function updateConfig(partial: Partial<ExperimentConfig>): void {
	config = { ...config, ...partial };
}

function clear(): void {
	stimuli.forEach((s) => URL.revokeObjectURL(s.url));
	stimuli = [];
}

export const experimentStore = {
	get stimuli() { return stimuli; },
	get config()  { return config; },
	get hasStimuli()    { return hasStimuli; },
	get stimulusCount() { return stimulusCount; },
	addStimuli,
	removeStimulus,
	updateConfig,
	clear,
};
