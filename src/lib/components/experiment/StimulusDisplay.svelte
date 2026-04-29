<script lang="ts">
  import { onMount } from "svelte";
  import { executionStore } from "$lib/stores/executionStore.svelte";
  import { experimentStore } from "$lib/stores/experimentStore.svelte";
  import { resultsStore } from "$lib/stores/resultsStore.svelte";

  let imageEl: HTMLImageElement;

  function contentBounds(img: HTMLImageElement) {
    const rect = img.getBoundingClientRect();
    const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    return { x: rect.left + (rect.width - w) / 2, y: rect.top + (rect.height - h) / 2, w, h };
  }

  function saveBounds(): void {
    const stimulus = executionStore.currentStimulus;
    if (!stimulus) return;
    const { x, y, w, h } = contentBounds(imageEl);
    resultsStore.setImageBounds({ name: stimulus.name, width: w, height: h, screenX: x, screenY: y });
  }

  function captureBounds(): void {
    if (!executionStore.currentStimulus) return;
    requestAnimationFrame(saveBounds);
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key !== " ") return;
    if (experimentStore.config.mode !== "MANUAL") return;
    e.preventDefault();
    executionStore.next();
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
</script>

<div class="fixed inset-0 flex items-center justify-center bg-black">
  {#if executionStore.currentStimulus}
    <img
      bind:this={imageEl}
      src={executionStore.currentStimulus.url}
      alt={executionStore.currentStimulus.name}
      class="w-[90vw] h-[90vh] object-contain"
      onload={captureBounds}
    />
  {/if}
</div>
