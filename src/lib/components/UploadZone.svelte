<script lang="ts">
	import { Upload } from 'lucide-svelte';

	let { onFiles }: { onFiles: (files: File[]) => void } = $props();
	let isDragging = $state(false);
	let inputEl: HTMLInputElement;

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		onFiles(Array.from(e.dataTransfer?.files ?? []));
	}

	function handleChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		onFiles(Array.from(input.files ?? []));
		input.value = '';
	}

	function activate() {
		inputEl.click();
	}
</script>

<div
	role="button"
	tabindex="0"
	class="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed
	       p-10 transition-colors
	       {isDragging ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/60'}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={activate}
	onkeydown={(e) => e.key === 'Enter' && activate()}
>
	<input
		bind:this={inputEl}
		type="file"
		multiple
		accept="image/*"
		class="hidden"
		onchange={handleChange}
	/>
	<Upload size={36} class="text-muted" />
	<p class="text-center text-sm text-muted">Arraste imagens aqui ou clique para selecionar</p>
	<p class="text-xs text-muted/60">JPG · PNG · GIF · WEBP</p>
</div>
