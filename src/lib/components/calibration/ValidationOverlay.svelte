<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Swal, { type SweetAlertResult } from "sweetalert2";
  import { gazeStore } from "$lib/stores/GazeStore.svelte";
  import {
    VALIDATION_POINTS, SETTLE_MS, TOTAL_MS, RECORD_MS,
    PRECISION_THRESHOLD, COUNTDOWN_START,
  } from "./validation/validationConfig";
  import { dotState, type DotState } from "./validation/validationGeometry";
  import { computePrecision, isPrecisionSufficient, type GazeSample } from "./validation/validationPrecision";

  let { onRetry, onProceed }: { onRetry: () => void; onProceed: () => void } = $props();

  type Phase = "countdown" | "tracking" | "done";
  let phase        = $state<Phase>("countdown");
  let countdown    = $state(COUNTDOWN_START);
  let dotX         = $state(0);
  let dotY         = $state(0);
  let isDwelling   = $state(false);
  let currentPtIdx = $state(0);
  let progress     = $state(0);

  const pointSamples: GazeSample[][] = VALIDATION_POINTS.map(() => []);

  let animationId: number | null = null;
  let startTime: number | null   = null;
  let lastRecorded               = 0;

  function applyDotState(state: DotState, elapsed: number): void {
    dotX         = state.x;
    dotY         = state.y;
    isDwelling   = state.dwelling;
    currentPtIdx = state.pointIdx;
    progress     = Math.min(elapsed / TOTAL_MS, 1);
  }

  function tryRecordSample(state: DotState, now: number): void {
    if (!state.dwelling) return;
    if (state.dwellElapsed < SETTLE_MS) return;
    if (now - lastRecorded < RECORD_MS) return;
    const gaze = gazeStore.latestGaze;
    if (gaze.x === 0 && gaze.y === 0) return;
    pointSamples[state.pointIdx].push({ gx: gaze.x, gy: gaze.y, tx: state.x, ty: state.y });
    lastRecorded = now;
  }

  function cancelAnimation(): void {
    if (animationId === null) return;
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  function buildSwalConfig(ok: boolean, precision: number) {
    return {
      title:              ok ? "Calibração OK ✓" : "Precisão insuficiente",
      html:               `Precisão atual: <strong>${precision}%</strong><br>Limiar: ${PRECISION_THRESHOLD}%`,
      icon:               ok ? "success" : "warning",
      confirmButtonText:  ok ? "Iniciar Experimento" : "Repetir Calibração",
      showDenyButton:     ok,
      denyButtonText:     "Recalibrar",
      allowOutsideClick:  false,
      background:         "#1e293b",
      color:              "#f1f5f9",
      confirmButtonColor: ok ? "#6366f1" : "#f59e0b",
      denyButtonColor:    "#64748b",
    } as const;
  }

  function handleSwalResult(result: SweetAlertResult, ok: boolean): void {
    if (result.isDenied) { onRetry(); return; }
    if (ok) { onProceed(); return; }
    onRetry();
  }

  function showResult(precision: number): void {
    const ok = isPrecisionSufficient(precision);
    Swal.fire(buildSwalConfig(ok, precision)).then(r => handleSwalResult(r, ok));
  }

  function finishTracking(): void {
    cancelAnimation();
    phase = "done";
    showResult(computePrecision(pointSamples));
  }

  function animate(now: number): void {
    if (startTime === null) startTime = now;
    const elapsed = now - startTime;
    const state   = dotState(elapsed);
    applyDotState(state, elapsed);
    tryRecordSample(state, now);
    if (elapsed >= TOTAL_MS) { finishTracking(); return; }
    animationId = requestAnimationFrame(animate);
  }

  function startCountdown(): void {
    let count = COUNTDOWN_START;
    const id = setInterval(() => {
      count--;
      countdown = count;
      if (count > 0) return;
      clearInterval(id);
      phase = "tracking";
      animationId = requestAnimationFrame(animate);
    }, 1000);
  }

  onMount(() => {
    gazeStore.resume();
    dotX = (VALIDATION_POINTS[0].x / 100) * window.innerWidth;
    dotY = (VALIDATION_POINTS[0].y / 100) * window.innerHeight;
    startCountdown();
  });

  onDestroy(cancelAnimation);
</script>

<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 select-none">

  {#if phase === "countdown"}
    <p class="mb-3 text-sm text-white/50">
      Agora olhe para cada ponto azul enquanto ele se move pela tela
    </p>
    <p class="text-9xl font-bold tabular-nums text-accent">{countdown}</p>
  {/if}

  {#if phase === "tracking"}
    <p class="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 text-xs text-white/40">
      {isDwelling ? "Fixe o olhar no ponto" : "Siga o ponto com os olhos"}
    </p>

    <p class="pointer-events-none absolute right-8 top-8 text-xs text-white/30">
      {currentPtIdx + 1} / {VALIDATION_POINTS.length}
    </p>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 h-1 w-48 overflow-hidden rounded-full bg-white/10">
      <div
        class="h-full rounded-full bg-accent transition-none"
        style="width: {progress * 100}%"
      ></div>
    </div>
  {/if}

  {#if phase !== "done"}
    <div
      class="pointer-events-none absolute"
      style="left: {dotX}px; top: {dotY}px; transform: translate(-50%, -50%)"
    >
      <span
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent transition-all duration-200
               {isDwelling ? 'h-12 w-12 opacity-60' : 'h-9 w-9 opacity-30'}"
      ></span>
      <span class="relative block h-5 w-5 rounded-full bg-accent shadow-md shadow-accent/50"></span>
    </div>
  {/if}

</div>
