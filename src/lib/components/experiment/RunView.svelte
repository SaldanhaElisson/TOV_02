<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import StimulusDisplay from "./StimulusDisplay.svelte";
  import CalibrationOverlay from "$lib/components/calibration/CalibrationOverlay.svelte";

  import { executionStore } from "$lib/stores/executionStore.svelte";
  import { resultsStore } from "$lib/stores/resultsStore.svelte";
  import { experimentStore } from "$lib/stores/experimentStore.svelte";
  import { dataCollector } from "$lib/services/DataCollector.svelte";

  let { onComplete }: { onComplete: () => void } = $props();

  onMount(() => {
    executionStore.start();
    dataCollector.start();
  });

  onDestroy(() => {
    dataCollector.stop();
  });

  function handleRecalibrationComplete(): void {
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
