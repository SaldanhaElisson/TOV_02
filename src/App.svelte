<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import SetupView from "$lib/components/setup/SetupView.svelte";
  import CalibrationOverlay from "$lib/components/calibration/CalibrationOverlay.svelte";
  import RunView from "$lib/components/experiment/RunView.svelte";
  import { gazeStore } from "$lib/stores/GazeStore.svelte";
  import { experimentStore } from "$lib/stores/experimentStore.svelte";

  type Stage = "setup" | "calibration" | "experiment";

  let stage = $state<Stage>("setup");

  onMount(() => gazeStore.start());
  onDestroy(() => gazeStore.stop());

  $effect(() => {
    gazeStore.setVideoPreview(stage === "setup");
    if (stage !== "calibration") gazeStore.setPredictionPoints(false);
  });

  $effect(() => {
    gazeStore.setKalmanFilter(experimentStore.config.useKalmanFilter);
  });

  function handleExperimentComplete(): void {
    stage = "setup";
  }
</script>

{#if stage === "setup"}
  <SetupView onProceed={() => (stage = "calibration")} />
{/if}

{#if stage === "calibration"}
  <CalibrationOverlay onComplete={() => (stage = "experiment")} />
{/if}

{#if stage === "experiment"}
  <RunView onComplete={handleExperimentComplete} />
{/if}
