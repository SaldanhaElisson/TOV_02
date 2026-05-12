<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { gazeStore } from "$lib/stores/GazeStore.svelte";
  import ValidationOverlay from "./ValidationOverlay.svelte";

  let {
    onComplete,
    preserveData = false,
  }: { onComplete: () => void; preserveData?: boolean } = $props();

  // ── Phase 1: Percurso ─────────────────────────────────────────────────────
  const PATH: Array<[number, number]> = [
    [10, 10], [50, 10], [90, 10],
    [90, 50], [90, 90], [50, 90],
    [10, 90], [10, 50], [10, 10],
    [30, 30], [70, 30], [70, 70],
    [30, 70], [50, 50],
  ];

  const SEGMENT_MS  = 600;   // salto rápido (olho sacade, não persegue)
  const DWELL_MS    = 4_000; // 4 s parado em cada waypoint
  const SETTLE_MS   = 1_000; // ms a ignorar no início de cada dwell
  const STEP_MS     = SEGMENT_MS + DWELL_MS;
  const P_TOTAL_MS  = DWELL_MS + (PATH.length - 1) * STEP_MS;

  // ── Phase 2: Lissajous ────────────────────────────────────────────────────
  const LIS_A      = 3;
  const LIS_B      = 2;
  const LIS_AMP    = 40;
  const L_TOTAL_MS = 45_000; // 45 s — mais lento que antes

  // Aciona dwell no Lissajous quando velocidade < 20 % do máximo.
  const SPEED_DWELL_FRACTION  = 0.20;
  const LIS_DWELL_HOLD_MS     = 3_000; // 3 s congelado nos turning-points
  const LIS_SETTLE_MS         = 1_000; // ms de assentamento dentro do dwell Lissajous

  // ── Shared ────────────────────────────────────────────────────────────────
  const RECORD_MS       = 40;
  const COUNTDOWN_START = 3;
  const TOTAL_MS        = P_TOTAL_MS + L_TOTAL_MS; // parâmetro base (sem contar dwells Lissajous extras)

  type Phase = "countdown" | "tracking" | "validating";
  let phase       = $state<Phase>("countdown");
  let countdown   = $state(COUNTDOWN_START);
  let dotX        = $state(0);
  let dotY        = $state(0);
  let isDwelling  = $state(true);
  let isLissajous = $state(false);
  let progress    = $state(0);

  // ── Percurso state ────────────────────────────────────────────────────────
  let dwellStartedAt: number | null = null;
  let prevIsDwelling                = false;

  // ── Lissajous state ───────────────────────────────────────────────────────
  let lisStartTime: number | null       = null; // início da fase Lissajous
  let lisPauseStart: number | null      = null;
  let lisTotalPauseMs                   = 0;
  let lisInDwell                        = false;
  let lisPrevSpeed                      = Infinity;
  let lisDwellThreshold                 = 0;

  let animationId: number | null = null;
  let startTime: number | null   = null;
  let lastRecorded                = 0;

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

  function percursoPosition(elapsed: number): { x: number; y: number; dwelling: boolean } {
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

  function computeLisThresholds(): void {
    const scale    = 2 * Math.PI / L_TOTAL_MS;
    const vxMax    = (LIS_AMP / 100) * window.innerWidth  * LIS_A * scale;
    const vyMax    = (LIS_AMP / 100) * window.innerHeight * LIS_B * scale;
    const maxSpeed = Math.sqrt(vxMax * vxMax + vyMax * vyMax);
    lisDwellThreshold = maxSpeed * SPEED_DWELL_FRACTION;
  }

  function getLisEffectiveElapsed(now: number): number {
    if (lisStartTime === null) return 0;
    const raw   = now - lisStartTime;
    const pause = lisPauseStart === null ? 0 : now - lisPauseStart;
    return raw - lisTotalPauseMs - pause;
  }

  function lissajousPosition(effEl: number): { x: number; y: number } {
    const t = (effEl / L_TOTAL_MS) * 2 * Math.PI;
    return {
      x: ((50 + LIS_AMP * Math.sin(LIS_A * t)) / 100) * window.innerWidth,
      y: ((50 + LIS_AMP * Math.sin(LIS_B * t)) / 100) * window.innerHeight,
    };
  }

  function lissajousSpeed(effEl: number): number {
    const t     = (effEl / L_TOTAL_MS) * 2 * Math.PI;
    const scale = 2 * Math.PI / L_TOTAL_MS;
    const vx    = (LIS_AMP / 100) * window.innerWidth  * LIS_A * Math.cos(LIS_A * t) * scale;
    const vy    = (LIS_AMP / 100) * window.innerHeight * LIS_B * Math.cos(LIS_B * t) * scale;
    return Math.sqrt(vx * vx + vy * vy);
  }

  function handleLisDwellCompletion(now: number): void {
    if (lisPauseStart === null) return;
    if (now - lisPauseStart < LIS_DWELL_HOLD_MS) return;
    lisTotalPauseMs += LIS_DWELL_HOLD_MS;
    lisPauseStart    = null;
    lisInDwell       = false;
  }

  function trackPercursoDwell(now: number, dwelling: boolean): void {
    if (!prevIsDwelling && dwelling) dwellStartedAt = now;
    if (!dwelling) dwellStartedAt = null;
    prevIsDwelling = dwelling;
  }

  function cancelAnimation(): void {
    if (animationId === null) return;
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  function animatePercurso(now: number, elapsed: number): void {
    const pos   = percursoPosition(elapsed);
    dotX        = pos.x;
    dotY        = pos.y;
    isDwelling  = pos.dwelling;
    isLissajous = false;

    trackPercursoDwell(now, pos.dwelling);

    const dwellProgress = dwellStartedAt !== null ? now - dwellStartedAt : 0;
    const dwellSettled  = isDwelling && dwellProgress >= SETTLE_MS;
    if (dwellSettled && now - lastRecorded >= RECORD_MS) {
      gazeStore.recordMove(dotX, dotY);
      lastRecorded = now;
    }
  }

  function animateLissajous(now: number): void {
    if (lisStartTime === null) lisStartTime = now;

    const effEl = getLisEffectiveElapsed(now);
    const speed = lissajousSpeed(effEl);

    if (!lisInDwell && speed <= lisDwellThreshold && lisPrevSpeed > lisDwellThreshold) {
      lisInDwell    = true;
      lisPauseStart = now;
    }
    lisPrevSpeed = speed;

    if (lisInDwell) handleLisDwellCompletion(now);

    const effElNow = getLisEffectiveElapsed(now);
    const pos      = lissajousPosition(effElNow);
    dotX        = pos.x;
    dotY        = pos.y;
    isLissajous = true;
    isDwelling  = lisInDwell;

    const dwellProgress = lisPauseStart !== null ? now - lisPauseStart : 0;
    const dwellSettled  = lisInDwell && dwellProgress >= LIS_SETTLE_MS;
    if (dwellSettled && now - lastRecorded >= RECORD_MS) {
      gazeStore.recordMove(dotX, dotY);
      lastRecorded = now;
    }
  }

  function animate(now: number): void {
    if (startTime === null) startTime = now;
    const elapsed = now - startTime;

    progress = Math.min(elapsed / TOTAL_MS, 1);

    if (elapsed < P_TOTAL_MS) {
      animatePercurso(now, elapsed);
    } else {
      animateLissajous(now);
    }

    const lisEffEl = getLisEffectiveElapsed(now);
    const lisDone  = elapsed >= P_TOTAL_MS && !lisInDwell && lisEffEl >= L_TOTAL_MS;
    if (lisDone) {
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
    lisStartTime   = null;
    lisPauseStart  = null;
    lisTotalPauseMs = 0;
    lisInDwell     = false;
    lisPrevSpeed   = Infinity;
    isDwelling     = true;
    isLissajous    = false;
    phase          = "tracking";
    animationId    = requestAnimationFrame(animate);
  }

  function handleRetry(): void {
    gazeStore.resume();
    startTracking(true);
  }

  onMount(() => {
    computeLisThresholds();
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
      {#if isDwelling}
        Fixe o olhar no ponto
      {:else}
        Siga o ponto com os olhos
      {/if}
    </p>

    <p class="pointer-events-none absolute right-8 top-8 text-xs text-white/30">
      {isLissajous ? "Fase 2 — Lissajous" : "Fase 1 — Percurso"}
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
