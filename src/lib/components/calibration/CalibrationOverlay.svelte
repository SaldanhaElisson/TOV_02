<script lang="ts">
  import { gazeStore } from "$lib/stores/GazeStore.svelte";
  import {
    CALIBRATION_POINTS,
    CLICKS_PER_POINT,
    TOTAL_POINTS,
  } from "./calibrationPoints.js";
  import CalibrationPoint from "./CalibrationPoint.svelte";
  import ValidationOverlay from "./ValidationOverlay.svelte";

  let { onComplete }: { onComplete: () => void } = $props();

  type Phase = "calibrating" | "validating";
  let phase = $state<Phase>("calibrating");

  let currentPointIndex = $state(0);
  let clickCounts = $state<number[]>(new Array(TOTAL_POINTS).fill(0));

  // Clear stale regression data and enable gaze dot on first render.
  startCalibration();

  const totalClicks = $derived(clickCounts.reduce((s, n) => s + n, 0));
  const maxClicks = $derived(TOTAL_POINTS * CLICKS_PER_POINT);

  function toPixel(percent: number, dimension: number): number {
    return (percent / 100) * dimension;
  }

  function advancePoint(): void {
    if (currentPointIndex >= TOTAL_POINTS - 1) {
      gazeStore.pause();
      phase = "validating";
      return;
    }
    currentPointIndex += 1;
  }

  function handlePointClick(index: number): void {
    if (index !== currentPointIndex) return;

    const point = CALIBRATION_POINTS[index];
    const pixelX = toPixel(point.x, window.innerWidth);
    const pixelY = toPixel(point.y, window.innerHeight);

    gazeStore.recordClick(pixelX, pixelY);
    clickCounts[index]++;

    if (clickCounts[index] < CLICKS_PER_POINT) return;
    advancePoint();
  }

  function startCalibration(): void {
    gazeStore.clearData();
    gazeStore.setPredictionPoints(true);
    currentPointIndex = 0;
    clickCounts = new Array(TOTAL_POINTS).fill(0);
    phase = "calibrating";
  }

  function resetCalibration(): void {
    gazeStore.resume();
    startCalibration();
  }
</script>

{#if phase === "calibrating"}
  <div class="fixed inset-0 z-50 cursor-crosshair bg-black/95 select-none">
    <header
      class="absolute inset-x-0 top-6 flex flex-col items-center gap-1 text-center"
    >
      <p class="text-xs font-medium uppercase tracking-widest text-white/40">
        Calibração
      </p>
      <p class="text-sm text-white/70">
        Clique em cada ponto <span class="text-accent">9 vezes</span> até ele desaparecer
      </p>
    </header>

    {#each CALIBRATION_POINTS as point, i (i)}
      <CalibrationPoint
        {point}
        clickCount={clickCounts[i]}
        isActive={i === currentPointIndex}
        isComplete={i < currentPointIndex}
        onClick={() => handlePointClick(i)}
      />
    {/each}

    <footer
      class="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3"
    >
      <div class="h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div
          class="h-full rounded-full bg-accent transition-all duration-300"
          style="width: {(totalClicks / maxClicks) * 100}%"
        ></div>
      </div>
      <span class="text-xs text-white/40"
        >{totalClicks} / {maxClicks} cliques</span
      >
    </footer>
  </div>
{/if}

{#if phase === "validating"}
  <ValidationOverlay onRetry={resetCalibration} onProceed={onComplete} />
{/if}
