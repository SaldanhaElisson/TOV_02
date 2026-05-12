<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { gazeStore } from "$lib/stores/GazeStore.svelte";
  import ValidationOverlay from "./ValidationOverlay.svelte";

  let {
    onComplete,
    preserveData = false,
  }: { onComplete: () => void; preserveData?: boolean } = $props();

  // Waypoints: outer ring → inner ring → centre.
  const PATH: Array<[number, number]> = [
    [10, 10], [50, 10], [90, 10],
    [90, 50], [90, 90], [50, 90],
    [10, 90], [10, 50], [10, 10],
    [30, 30], [70, 30], [70, 70],
    [30, 70], [50, 50],
  ];

  const SEGMENT_MS      = 600;   // salto rápido entre waypoints (olho sacade, não persegue)
  const DWELL_MS        = 4_000; // 4 s parado em cada waypoint
  const SETTLE_MS       = 1_000; // ms a ignorar no início de cada dwell (olho chegando)
  const STEP_MS         = SEGMENT_MS + DWELL_MS;
  const RECORD_MS       = 40;
  const COUNTDOWN_START = 3;
  const TOTAL_MS        = DWELL_MS + (PATH.length - 1) * STEP_MS; // 1 passagem

  type Phase = "countdown" | "tracking" | "validating";
  let phase      = $state<Phase>("countdown");
  let countdown  = $state(COUNTDOWN_START);
  let dotX       = $state(0);
  let dotY       = $state(0);
  let isDwelling = $state(true);
  let progress   = $state(0);

  let animationId: number | null = null;
  let startTime: number | null   = null;
  let lastRecorded                = 0;
  let dwellStartedAt: number | null = null; // wall-clock do início do dwell atual
  let prevIsDwelling                = false;

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function toPixels(point: [number, number]): { x: number; y: number } {
    return {
      x: (point[0] / 100) * window.innerWidth,
      y: (point[1] / 100) * window.innerHeight,
    };
  }

  function passPosition(elapsed: number): { x: number; y: number; dwelling: boolean } {
    const afterInitial = elapsed - DWELL_MS;
    if (afterInitial < 0) return { ...toPixels(PATH[0]), dwelling: true };

    const stepIdx     = Math.min(Math.floor(afterInitial / STEP_MS), PATH.length - 2);
    const stepElapsed = afterInitial - stepIdx * STEP_MS;

    if (stepElapsed >= SEGMENT_MS) {
      return { ...toPixels(PATH[stepIdx + 1]), dwelling: true };
    }

    const t        = easeInOut(stepElapsed / SEGMENT_MS);
    const [x1, y1] = PATH[stepIdx];
    const [x2, y2] = PATH[stepIdx + 1];
    return {
      x: (lerp(x1, x2, t) / 100) * window.innerWidth,
      y: (lerp(y1, y2, t) / 100) * window.innerHeight,
      dwelling: false,
    };
  }

  function dotPosition(elapsed: number): { x: number; y: number; dwelling: boolean } {
    return passPosition(Math.min(elapsed, TOTAL_MS));
  }

  // Detecta transição para dwell e atualiza o timestamp de início.
  function trackDwellStart(now: number, dwelling: boolean): void {
    if (!prevIsDwelling && dwelling) dwellStartedAt = now;
    if (!dwelling) dwellStartedAt = null;
    prevIsDwelling = dwelling;
  }

  function cancelAnimation(): void {
    if (animationId === null) return;
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  function animate(now: number): void {
    if (startTime === null) startTime = now;
    const elapsed = now - startTime;

    const pos  = dotPosition(elapsed);
    dotX       = pos.x;
    dotY       = pos.y;
    isDwelling = pos.dwelling;
    progress   = Math.min(elapsed / TOTAL_MS, 1);

    trackDwellStart(now, pos.dwelling);

    // Grava apenas durante dwell (olho sacade para o destino — movimento não é smooth pursuit).
    // SETTLE_MS garante que o olho estabilizou antes de coletar.
    const dwellProgress = dwellStartedAt !== null ? now - dwellStartedAt : 0;
    const dwellSettled  = isDwelling && dwellProgress >= SETTLE_MS;
    if (dwellSettled && now - lastRecorded >= RECORD_MS) {
      gazeStore.recordMove(dotX, dotY);
      lastRecorded = now;
    }

    if (elapsed >= TOTAL_MS) {
      cancelAnimation();
      gazeStore.pause();
      phase = "validating";
      return;
    }

    animationId = requestAnimationFrame(animate);
  }

  function startTracking(forceClear: boolean = false): void {
    gazeStore.resume(); // garante que WebGazer está ativo (no-op se já estiver)
    if (forceClear || !preserveData) gazeStore.clearData();
    gazeStore.setPredictionPoints(true);
    startTime      = null;
    lastRecorded   = 0;
    dwellStartedAt = null;
    prevIsDwelling = false;
    isDwelling     = true;
    phase          = "tracking";
    animationId    = requestAnimationFrame(animate);
  }

  function handleRetry(): void {
    gazeStore.resume();
    startTracking(true);
  }

  onMount(() => {
    const start = toPixels(PATH[0]);
    dotX = start.x;
    dotY = start.y;

    let count = COUNTDOWN_START;
    const id = setInterval(() => {
      count--;
      countdown = count;
      if (count > 0) return;
      clearInterval(id);
      startTracking();
    }, 1000);
  });

  onDestroy(cancelAnimation);
</script>

<div class="fixed inset-0 z-50 select-none bg-black/95">
  {#if phase === "countdown"}
    <div
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
    >
      <p class="mb-2 text-sm text-white/50">
        Siga o ponto com os olhos sem mover a cabeça
      </p>
      <p class="mb-6 text-xs text-white/35">
        Quando o ponto <span class="text-accent font-medium">brilhar e parar</span>, fixe o olhar nele
      </p>
      <p class="text-9xl font-bold tabular-nums text-accent">{countdown}</p>
    </div>

    <div
      class="pointer-events-none absolute"
      style="left: {dotX}px; top: {dotY}px; transform: translate(-50%, -50%)"
    >
      <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full border-2 border-accent opacity-50"></span>
      <span class="relative block h-5 w-5 rounded-full bg-accent opacity-70"></span>
    </div>
  {/if}

  {#if phase === "tracking"}
    <p
      class="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 text-xs text-white/40"
    >
      {isDwelling ? "Fixe o olhar no ponto" : "Siga o ponto com os olhos"}
    </p>

    <div
      class="absolute bottom-8 left-1/2 -translate-x-1/2 h-1 w-48 overflow-hidden rounded-full bg-white/10"
    >
      <div
        class="h-full rounded-full bg-accent transition-none"
        style="width: {progress * 100}%"
      ></div>
    </div>

    <div
      class="pointer-events-none absolute"
      style="left: {dotX}px; top: {dotY}px; transform: translate(-50%, -50%)"
    >
      <span
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent transition-all duration-200"
        class:h-16={isDwelling}
        class:w-16={isDwelling}
        class:h-9={!isDwelling}
        class:w-9={!isDwelling}
        class:animate-pulse={isDwelling}
        style="opacity: {isDwelling ? 0.75 : 0.25}"
      ></span>
      <span
        class="relative block h-5 w-5 rounded-full bg-accent transition-all duration-200"
        style="box-shadow: {isDwelling
          ? '0 0 20px 8px color-mix(in oklab, var(--color-accent) 70%, transparent)'
          : '0 2px 6px 0 color-mix(in oklab, var(--color-accent) 35%, transparent)'}"
      ></span>
    </div>
  {/if}
</div>

{#if phase === "validating"}
  <ValidationOverlay onRetry={handleRetry} onProceed={onComplete} />
{/if}
