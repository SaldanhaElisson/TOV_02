<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Swal from "sweetalert2";
  import { gazeStore } from "$lib/stores/GazeStore.svelte";
  import { calculatePrecision } from "$lib/math/precision";

  let {
    onRetry,
    onProceed,
  }: {
    onRetry: () => void;
    onProceed: () => void;
  } = $props();

  const VALIDATION_MS = 5000;
  const PRECISION_THRESHOLD = 50;

  let secondsLeft = $state(VALIDATION_MS / 1000);

  const collectedX: number[] = [];
  const collectedY: number[] = [];

  let collectId: ReturnType<typeof setInterval>;
  let timeoutId: ReturnType<typeof setTimeout>;
  let tickId: ReturnType<typeof setInterval>;

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Prefers the WebGazer internal buffer; falls back to manual collection. */
  function selectSamples(
    storedX: number[],
    storedY: number[]
  ): [number[], number[]] {
    if (storedX.length > 0) return [storedX, storedY];
    return [collectedX, collectedY];
  }

  function viewportIsValid(): boolean {
    return window.innerWidth > 0 && window.innerHeight > 0;
  }

  function logDiagnostics(samplesX: number[], precision: number): void {
    console.log(
      `[TOV] Validation — stored: ${samplesX.length} samples | precision: ${precision}%`,
      `| viewport: ${window.innerWidth}×${window.innerHeight}`
    );
    if (precision > 0) return;
    console.warn(
      "[TOV] Precision = 0. collectedX.length =",
      collectedX.length,
      "| webgazer =",
      (window as unknown as Record<string, unknown>).webgazer
    );
  }

  function collectSample(): void {
    const { x, y } = gazeStore.latestGaze;
    if (x === 0 && y === 0) return;
    collectedX.push(x);
    collectedY.push(y);
  }

  function showResult(precision: number): void {
    const isPrecise = precision >= PRECISION_THRESHOLD;
    Swal.fire({
      title: isPrecise ? "Calibração OK ✓" : "Precisão insuficiente",
      html: `Precisão atual: <strong>${precision}%</strong><br>Limiar: ${PRECISION_THRESHOLD}%`,
      icon: isPrecise ? "success" : "warning",
      confirmButtonText: isPrecise ? "Iniciar Experimento" : "Repetir Calibração",
      showDenyButton: isPrecise,
      denyButtonText: "Recalibrar",
      allowOutsideClick: false,
      background: "#1e293b",
      color: "#f1f5f9",
      confirmButtonColor: isPrecise ? "#6366f1" : "#f59e0b",
      denyButtonColor: "#64748b",
    }).then((result) => {
      if (result.isDenied) {
        onRetry();
        return;
      }
      if (isPrecise) {
        onProceed();
        return;
      }
      onRetry();
    });
  }

  function computePrecision(storedX: number[], storedY: number[]): number {
    if (!viewportIsValid()) {
      console.error("[TOV] Invalid viewport — cannot compute precision");
      return 0;
    }
    const [useX, useY] = selectSamples(storedX, storedY);
    const p = calculatePrecision(
      useX,
      useY,
      window.innerWidth,
      window.innerHeight
    );
    logDiagnostics(useX, p);
    return p;
  }

  async function finishValidation(): Promise<void> {
    clearInterval(collectId);

    await delay(100);

    const [storedX, storedY] = gazeStore.getStoredPoints();
    const precision = computePrecision(storedX, storedY);

    if (precision > 0) {
      showResult(precision);
      return;
    }

    console.warn("[TOV] Precision still 0 — retrying after 200ms…");
    await delay(200);

    const [retryX, retryY] = gazeStore.getStoredPoints();
    showResult(computePrecision(retryX, retryY));
  }

  onMount(() => {
    gazeStore.resume();
    collectId = setInterval(collectSample, 50); // manual samples
    timeoutId = setTimeout(() => {
      finishValidation();
    }, VALIDATION_MS);
    tickId = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(collectId);
    clearTimeout(timeoutId);
    clearInterval(tickId);
  });
</script>

<div
  class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 select-none"
>
  <p class="mb-10 text-sm text-white/50">
    Olhe fixamente para o ponto central — <span class="text-accent"
      >{secondsLeft}s</span
    >
  </p>

  <div class="relative flex items-center justify-center">
    <span
      class="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-accent opacity-30"
    ></span>
    <span class="relative inline-flex h-6 w-6 rounded-full bg-accent"></span>
  </div>

  <div class="mt-10 h-1 w-40 overflow-hidden rounded-full bg-white/10">
    <div
      class="h-full rounded-full bg-accent transition-all duration-1000"
      style="width: {((VALIDATION_MS / 1000 - secondsLeft) /
        (VALIDATION_MS / 1000)) *
        100}%"
    ></div>
  </div>
</div>
