<script lang="ts">
	import type { CalibrationPoint } from './calibrationPoints.js';
	import { CLICKS_PER_POINT } from './calibrationPoints.js';

	let { point, clickCount, isActive, isComplete, onClick }: {
		point: CalibrationPoint;
		clickCount: number;
		isActive: boolean;
		isComplete: boolean;
		onClick: () => void;
	} = $props();

	const RADIUS       = 20;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	const dashOffset   = $derived(CIRCUMFERENCE * (1 - clickCount / CLICKS_PER_POINT));
	const opacity      = $derived(isComplete ? 0 : isActive ? 1 : 0.25);
</script>

<button
	style="left: {point.x}%; top: {point.y}%; opacity: {opacity};"
	class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-0
	       transition-opacity duration-500 disabled:pointer-events-none"
	onclick={onClick}
	disabled={!isActive}
	aria-label="Ponto de calibração"
>
	<svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
		<circle cx="28" cy="28" r={RADIUS} class="fill-none stroke-white/20" stroke-width="4" />
		<circle
			cx="28" cy="28" r={RADIUS}
			class="fill-none stroke-accent transition-all duration-100"
			stroke-width="4"
			stroke-linecap="round"
			stroke-dasharray={CIRCUMFERENCE}
			stroke-dashoffset={dashOffset}
			transform="rotate(-90 28 28)"
		/>
		<circle cx="28" cy="28" r="7"
			class="{isActive ? 'fill-white' : 'fill-white/50'}" />
	</svg>
</button>
