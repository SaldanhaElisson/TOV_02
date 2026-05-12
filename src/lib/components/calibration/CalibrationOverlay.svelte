<script lang="ts">
  import { onDestroy } from "svelte";
  import { gazeStore } from "$lib/stores/GazeStore.svelte";
  import {
    CALIBRATION_POINTS,
    CLICKS_PER_POINT,
    TOTAL_POINTS,
    SETTLE_MS,
  } from "./calibrationPoints.js";
  import CalibrationPoint from "./CalibrationPoint.svelte";
  import ValidationOverlay from "./ValidationOverlay.svelte";

  let {
    onComplete,
    preserveData = false,
  }: { onComplete: () => void; preserveData?: boolean } = $props();

  type Phase = "calibrating" | "validating";
  let phase = $state<Phase>("calibrating");

  let currentPointIndex = $state(0);
  let clickCounts       = $state<number[]>(new Array(TOTAL_POINTS).fill(0));
  let settled           = $state(false);
  let order             = $state<number[]>([]);

  let settleTimer: ReturnType<typeof setTimeout> | null = null;

  const totalClicks = $derived(clickCounts.reduce((s, n) => s + n, 0));
  const maxClicks   = $derived(TOTAL_POINTS * CLICKS_PER_POINT);

  function shuffled(arr: number[]): number[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function scheduleSettle(): void {
    settled = false;
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { settled = true; }, SETTLE_MS);
  }

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
    scheduleSettle();
  }

  function handlePointClick(index: number): void {
    if (index !== currentPointIndex) return;
    if (!settled) return;
    const point = CALIBRATION_POINTS[order[index]];
    const pixelX = toPixel(point.x, window.innerWidth);
    const pixelY = toPixel(point.y, window.innerHeight);

    gazeStore.recordClick(pixelX, pixelY);
    clickCounts[index]++;

    if (clickCounts[index] < CLICKS_PER_POINT) return;
    advancePoint();
  }

  function startCalibration(forceClear: boolean = false): void {
    if (forceClear || !preserveData) gazeStore.clearData();
    gazeStore.setPredictionPoints(true);
    const indices = shuffled([...Array(TOTAL_POINTS).keys()]);
    const centerIdx = CALIBRATION_POINTS.findIndex(p => p.x === 50 && p.y === 50);
    order = [...indices.filter(i => i !== centerIdx), centerIdx];
    currentPointIndex = 0;
    clickCounts = new Array(TOTAL_POINTS).fill(0);
    phase = "calibrating";
    scheduleSettle();
  }

  function resetCalibration(): void {
    gazeStore.resume();
    startCalibration(true);
  }

  onDestroy(() => {
    if (settleTimer) clearTimeout(settleTimer);
  });

  startCalibration();
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
        Olhe fixamente para o ponto e clique nele
        <span class="text-accent">{CLICKS_PER_POINT} vezes</span>
      </p>
    </header>

    {#each CALIBRATION_POINTS as _point, i (i)}
      <CalibrationPoint
        point={CALIBRATION_POINTS[order[i]]}
        clickCount={clickCounts[i]}
        isActive={i === currentPointIndex}
        isComplete={i < currentPointIndex}
        isSettled={settled}
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
