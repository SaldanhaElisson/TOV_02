<script lang="ts">
	import type { Stimulus } from '$lib/stores/experimentStore.svelte';
	import { X } from 'lucide-svelte';

	let { stimulus, onRemove }: {
		stimulus: Stimulus;
		onRemove: () => void;
	} = $props();
</script>

<div class="group relative aspect-square overflow-hidden rounded-lg border border-border bg-raised">
	<img src={stimulus.url} alt={stimulus.name} class="h-full w-full object-cover" />

	<div class="absolute inset-0 flex items-start justify-end bg-black/40 p-1
	            opacity-0 transition-opacity group-hover:opacity-100">
		<button
			onclick={onRemove}
			class="rounded-full bg-danger p-1 text-white hover:bg-red-400"
			aria-label="Remover {stimulus.name}"
		>
			<X size={12} />
		</button>
	</div>

	<div class="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1">
		<p class="truncate text-xs text-text">{stimulus.name}</p>
	</div>
</div>
