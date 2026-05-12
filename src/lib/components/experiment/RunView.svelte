<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import StimulusDisplay from "./StimulusDisplay.svelte";
  import CalibrationOverlay from "$lib/components/calibration/CalibrationOverlay.svelte";

  import { executionStore } from "$lib/stores/executionStore.svelte";
  import { resultsStore } from "$lib/stores/resultsStore.svelte";
  import { experimentStore } from "$lib/stores/experimentStore.svelte";
  import { dataCollector } from "$lib/services/DataCollector.svelte";
  import { gazeStore } from "$lib/stores/GazeStore.svelte";

  let { onComplete }: { onComplete: () => void } = $props();

  onMount(async () => {
    await gazeStore.resume();
    executionStore.start();
    dataCollector.start();
  });

  onDestroy(() => {
    dataCollector.stop();
  });

  async function handleRecalibrationComplete(): Promise<void> {
    await gazeStore.resume();
    resultsStore.resetCurrentRowTimestamp();
    executionStore.acknowledgeRecalibration();
  }

  $effect(() => {
    if (!executionStore.isComplete) return;
    untrack(() => {
      resultsStore.exportAndDownload();
      executionStore.stop();
      experimentStore.clear();
      onComplete();
    });
  });
</script>

<!-- StimulusDisplay stays mounted during recalibration so onload is not re-fired
     and the existing resultsStore row for the current stimulus is preserved. -->
<StimulusDisplay />

{#if executionStore.needsRecalibration}
  <CalibrationOverlay onComplete={handleRecalibrationComplete} />
{/if}
