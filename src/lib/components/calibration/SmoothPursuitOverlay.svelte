<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { gazeStore } from "$lib/stores/GazeStore.svelte";
  import ValidationOverlay from "./ValidationOverlay.svelte";

  let {
    onComplete,
    preserveData = false,
  }: { onComplete: () => void; preserveData?: boolean } = $props();

  // Lissajous: x(t) = 50 + 40·sin(3t)   y(t) = 50 + 40·sin(2t)
  // 3:2 ratio visits all screen quadrants uniformly.
  const LIS_A   = 3;
  const LIS_B   = 2;
  const LIS_AMP = 40; // percent — keeps dot in [10 %, 90 %]

  const RECORD_MS            = 40;     // intervalo de amostragem durante fases lentas/dwell
  const COUNTDOWN_START      = 3;
  const TOTAL_MS             = 90_000; // duração do parâmetro Lissajous (tempo de parede será maior pelos dwells)
  // Ao chegar perto dos turning-points a bolinha congela por DWELL_HOLD_MS.
  // O olho estabiliza sobre o alvo antes de coletar amostras → sem erro de lag.
  const DWELL_HOLD_MS        = 3_000; // 3 s parado nos turning-points
  const SETTLE_MS_DWELL      = 1_000; // ms a ignorar no início do dwell (olho estabilizando)

  // Aciona o dwell quando a velocidade cai abaixo de 20 % do máximo (turning-point).
  const SPEED_DWELL_FRACTION  = 0.20;

  type Phase = "countdown" | "tracking" | "validating";
  let phase       = $state<Phase>("countdown");
  let countdown   = $state(COUNTDOWN_START);
  let dotX        = $state(0);
  let dotY        = $state(0);
  let progress    = $state(0);
  let isRecording = $state(false);
  let inDwell     = $state(false);

  let animationId: number | null    = null;
  let startTime: number | null      = null;
  let currentPauseStart: number | null = null; // início do dwell atual
  let totalPauseMs  = 0;      // soma de todos os dwells concluídos
  let lastRecorded  = 0;
  let prevSpeed     = Infinity; // velocidade do frame anterior (detecção de entrada no dwell)
  let dwellThreshold = 0;       // px/ms — calculado em onMount

  // Tempo Lissajous efetivo: tempo real menos todo o tempo gasto em dwells.
  function getEffectiveElapsed(now: number): number {
    if (startTime === null) return 0;
    const raw          = now - startTime;
    const currentPause = currentPauseStart === null ? 0 : now - currentPauseStart;
    return raw - totalPauseMs - currentPause;
  }

  function dotPosition(elapsed: number): { x: number; y: number } {
    const t = (Math.min(elapsed, TOTAL_MS) / TOTAL_MS) * 4 * Math.PI;
    return {
      x: ((50 + LIS_AMP * Math.sin(LIS_A * t)) / 100) * window.innerWidth,
      y: ((50 + LIS_AMP * Math.sin(LIS_B * t)) / 100) * window.innerHeight,
    };
  }

  // Velocidade combinada instantânea em px/ms via derivada da equação de Lissajous.
  function currentSpeed(elapsed: number): number {
    const t     = (elapsed / TOTAL_MS) * 4 * Math.PI;
    const scale = 4 * Math.PI / TOTAL_MS;
    const vx    = (LIS_AMP / 100) * window.innerWidth  * LIS_A * Math.cos(LIS_A * t) * scale;
    const vy    = (LIS_AMP / 100) * window.innerHeight * LIS_B * Math.cos(LIS_B * t) * scale;
    return Math.sqrt(vx * vx + vy * vy);
  }

  function computeThresholds(): void {
    const scale    = 4 * Math.PI / TOTAL_MS;
    const vxMax    = (LIS_AMP / 100) * window.innerWidth  * LIS_A * scale;
    const vyMax    = (LIS_AMP / 100) * window.innerHeight * LIS_B * scale;
    const maxSpeed = Math.sqrt(vxMax * vxMax + vyMax * vyMax);
    dwellThreshold = maxSpeed * SPEED_DWELL_FRACTION;
  }

  // Extrai lógica de conclusão do dwell para manter `animate` em 1 nível de indentação.
  function handleDwellCompletion(now: number): void {
    if (currentPauseStart === null) return;
    if (now - currentPauseStart < DWELL_HOLD_MS) return;
    totalPauseMs     += DWELL_HOLD_MS;
    currentPauseStart = null;
    inDwell           = false;
  }

  function cancelAnimation(): void {
    if (animationId === null) return;
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  function animate(now: number): void {
    if (startTime === null) startTime = now;

    const effEl = getEffectiveElapsed(now);
    const speed = currentSpeed(effEl);

    // Detecta entrada no dwell: velocidade cruzou abaixo do limiar pelo lado de cima.
    // O prevSpeed garante que o dwell só dispara UMA vez por turning-point.
    if (!inDwell && speed <= dwellThreshold && prevSpeed > dwellThreshold) {
      inDwell           = true;
      currentPauseStart = now;
    }
    prevSpeed = speed;

    if (inDwell) handleDwellCompletion(now);

    // Atualização de posição: congelada durante dwell, avançando nos demais momentos.
    const effElNow = getEffectiveElapsed(now);
    const pos      = dotPosition(effElNow);
    dotX     = pos.x;
    dotY     = pos.y;
    progress = Math.min(effElNow / TOTAL_MS, 1);

    // Grava apenas durante dwell, após SETTLE_MS_DWELL (olho estabilizado no turning-point).
    // Movimento não gera amostras: eye-lag cria pares (gaze, target) sistematicamente errados.
    const dwellProgress = currentPauseStart !== null ? now - currentPauseStart : 0;
    const dwellSettled  = inDwell && dwellProgress >= SETTLE_MS_DWELL;
    isRecording = inDwell;
    if (dwellSettled && now - lastRecorded >= RECORD_MS) {
      gazeStore.recordMove(dotX, dotY);
      lastRecorded = now;
    }

    if (!inDwell && effElNow >= TOTAL_MS) {
      finishTracking();
      return;
    }

    animationId = requestAnimationFrame(animate);
  }

  function finishTracking(): void {
    cancelAnimation();
    gazeStore.pause();
    phase = "validating";
  }

  function startTracking(forceClear: boolean = false): void {
    gazeStore.resume(); // garante que WebGazer está ativo (no-op se já estiver)
    if (forceClear || !preserveData) gazeStore.clearData();
    gazeStore.setPredictionPoints(true);
    startTime         = null;
    lastRecorded      = 0;
    totalPauseMs      = 0;
    currentPauseStart = null;
    inDwell           = false;
    prevSpeed         = Infinity;
    phase             = "tracking";
    animationId       = requestAnimationFrame(animate);
  }

  function handleRetry(): void {
    gazeStore.resume();
    startTracking(true);
  }

  onMount(() => {
    computeThresholds();
    dotX = (50 / 100) * window.innerWidth;
    dotY = (50 / 100) * window.innerHeight;

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
      {#if inDwell}
        Fixe o olhar no ponto
      {:else}
        Siga o ponto com os olhos
      {/if}
    </p>

    <div
      class="absolute bottom-8 left-1/2 -translate-x-1/2 h-1 w-48 overflow-hidden rounded-full bg-white/10"
    >
      <div
        class="h-full rounded-full bg-accent transition-none"
        style="width: {progress * 100}%"
      ></div>
    </div>

    <!-- Dot: anel expande + pulsa durante dwell (bolinha parada coletando amostra) -->
    <div
      class="pointer-events-none absolute"
      style="left: {dotX}px; top: {dotY}px; transform: translate(-50%, -50%)"
    >
      <span
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent transition-all duration-150"
        class:h-16={inDwell}
        class:w-16={inDwell}
        class:h-12={isRecording && !inDwell}
        class:w-12={isRecording && !inDwell}
        class:h-9={!isRecording}
        class:w-9={!isRecording}
        class:animate-pulse={inDwell}
        style="opacity: {inDwell ? 0.85 : isRecording ? 0.55 : 0.25}"
      ></span>
      <span
        class="relative block h-5 w-5 rounded-full bg-accent transition-all duration-150"
        style="box-shadow: {inDwell
          ? '0 0 22px 9px color-mix(in oklab, var(--color-accent) 75%, transparent)'
          : isRecording
            ? '0 0 14px 5px color-mix(in oklab, var(--color-accent) 50%, transparent)'
            : '0 2px 6px 0 color-mix(in oklab, var(--color-accent) 35%, transparent)'}"
      ></span>
    </div>
  {/if}
</div>

{#if phase === "validating"}
  <ValidationOverlay onRetry={handleRetry} onProceed={onComplete} />
{/if}
