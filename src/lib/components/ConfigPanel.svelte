<script lang="ts">
	import { Switch, ToggleGroup } from 'bits-ui';
	import { experimentStore, type ExperimentMode } from '$lib/stores/experimentStore.svelte';

	const isRandom        = $derived(experimentStore.config.isRandom);
	const mode            = $derived(experimentStore.config.mode);
	const duration        = $derived(experimentStore.config.duration);
	const recalibration   = $derived(experimentStore.config.recalibrationInterval);
	const useKalmanFilter = $derived(experimentStore.config.useKalmanFilter);

	function setMode(v: string | undefined) {
		if (!v) return;
		experimentStore.updateConfig({ mode: v as ExperimentMode });
	}

function setDuration(e: Event) {
		const seconds = +(e.currentTarget as HTMLInputElement).value;
		experimentStore.updateConfig({ duration: seconds * 1000 });
	}

	function setRecalibration(e: Event) {
		const n = +(e.currentTarget as HTMLInputElement).value;
		experimentStore.updateConfig({ recalibrationInterval: n });
	}
</script>

<div class="space-y-6 rounded-xl border border-border bg-raised p-6">
	<h2 class="text-sm font-semibold uppercase tracking-widest text-muted">Configurações</h2>

	<label class="flex items-center justify-between gap-4">
		<span class="text-sm text-text">
			Filtro de Kalman
			<span class="block text-xs text-muted/60">Suaviza predições — ativar para Percurso/Lissajous</span>
		</span>
		<Switch.Root
			checked={useKalmanFilter}
			onCheckedChange={(v) => experimentStore.updateConfig({ useKalmanFilter: v })}
			class="relative h-6 w-11 rounded-full bg-border transition-colors data-[state=checked]:bg-accent"
		>
			<Switch.Thumb
				class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow
				       transition-transform data-[state=checked]:translate-x-[22px]"
			/>
		</Switch.Root>
	</label>

	<label class="flex items-center justify-between gap-4">
		<span class="text-sm text-text">Ordem aleatória</span>
		<Switch.Root
			checked={isRandom}
			onCheckedChange={(v) => experimentStore.updateConfig({ isRandom: v })}
			class="relative h-6 w-11 rounded-full bg-border transition-colors data-[state=checked]:bg-accent"
		>
			<Switch.Thumb
				class="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow
				       transition-transform data-[state=checked]:translate-x-[22px]"
			/>
		</Switch.Root>
	</label>

	<div class="space-y-2">
		<p class="text-sm text-muted">Modo de apresentação</p>
		<ToggleGroup.Root
			type="single"
			value={mode}
			onValueChange={setMode}
			class="flex gap-2"
		>
			<ToggleGroup.Item
				value="FIXED"
				class="flex-1 rounded-lg border border-border py-2 text-sm text-muted
				       transition-colors data-[state=on]:border-accent data-[state=on]:bg-accent/20
				       data-[state=on]:text-text hover:border-accent/50"
			>Fixo (tempo)</ToggleGroup.Item>
			<ToggleGroup.Item
				value="MANUAL"
				class="flex-1 rounded-lg border border-border py-2 text-sm text-muted
				       transition-colors data-[state=on]:border-accent data-[state=on]:bg-accent/20
				       data-[state=on]:text-text hover:border-accent/50"
			>Manual (espaço)</ToggleGroup.Item>
		</ToggleGroup.Root>
	</div>

	{#if mode === 'FIXED'}
	<label class="block space-y-1">
		<span class="text-sm text-muted">Duração por imagem (s)</span>
		<input
			type="number" min="0.5" step="0.5"
			value={duration / 1000}
			oninput={setDuration}
			class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text
			       focus:border-accent focus:outline-none"
		/>
	</label>
	{/if}

<label class="block space-y-1">
		<span class="text-sm text-muted">
			Recalibrar a cada N imagens
			<span class="text-muted/60">(0 = nunca)</span>
		</span>
		<input
			type="number" min="0" step="1"
			value={recalibration}
			oninput={setRecalibration}
			class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text
			       focus:border-accent focus:outline-none"
		/>
	</label>
</div>
