<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Swal from "sweetalert2";
  import { gazeStore } from "$lib/stores/GazeStore.svelte";

  let {
    onRetry,
    onProceed,
  }: { onRetry: () => void; onProceed: () => void } = $props();

  // 5 validation positions: 4 corners + centre
  const POINTS: Array<[number, number]> = [
    [15, 15], [85, 15],
    [50, 50],
    [15, 85], [85, 85],
  ];

  const DWELL_MS          = 2500; // ms at each point
  const SETTLE_MS         = 800;  // skip first 800 ms — Kalman filter needs time to converge
  const TRANSITION_MS     = 800;  // ms to slide between points
  const STEP_MS           = TRANSITION_MS + DWELL_MS;
  const TOTAL_MS          = DWELL_MS + (POINTS.length - 1) * STEP_MS; // ~13 s
  const RECORD_MS         = 50;
  const PRECISION_THRESHOLD = 65;
  const COUNTDOWN_START   = 3;

  type Phase = "countdown" | "tracking" | "done";
  let phase          = $state<Phase>("countdown");
  let countdown      = $state(COUNTDOWN_START);
  let dotX           = $state(0);
  let dotY           = $state(0);
  let isDwelling     = $state(false);
  let currentPtIdx   = $state(0);
  let progress       = $state(0);

  // gaze vs target samples collected per point
  const pointSamples: Array<Array<{ gx: number; gy: number; tx: number; ty: number }>> =
    POINTS.map(() => []);

  let animationId: number | null = null;
  let startTime: number | null   = null;
  let lastRecorded               = 0;

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function toPixels(pct: [number, number]): { x: number; y: number } {
    return {
      x: (pct[0] / 100) * window.innerWidth,
      y: (pct[1] / 100) * window.innerHeight,
    };
  }

  // Returns where the dot should be at `elapsed` ms, plus dwell metadata.
  function dotState(elapsed: number): {
    x: number; y: number;
    pointIdx: number;
    dwelling: boolean;
    dwellElapsed: number;
  } {
    // First point: pure dwell from t=0
    if (elapsed < DWELL_MS) {
      const p = toPixels(POINTS[0]);
      return { ...p, pointIdx: 0, dwelling: true, dwellElapsed: elapsed };
    }

    const afterFirst = elapsed - DWELL_MS;
    const stepIdx    = Math.min(Math.floor(afterFirst / STEP_MS), POINTS.length - 2);
    const stepElap   = afterFirst - stepIdx * STEP_MS;

    if (stepElap < TRANSITION_MS) {
      const from = toPixels(POINTS[stepIdx]);
      const to   = toPixels(POINTS[stepIdx + 1]);
      const t    = easeInOut(stepElap / TRANSITION_MS);
      return {
        x: lerp(from.x, to.x, t),
        y: lerp(from.y, to.y, t),
        pointIdx: stepIdx + 1,
        dwelling: false,
        dwellElapsed: 0,
      };
    }

    const p = toPixels(POINTS[stepIdx + 1]);
    return {
      ...p,
      pointIdx:    stepIdx + 1,
      dwelling:    true,
      dwellElapsed: stepElap - TRANSITION_MS,
    };
  }

  function computePrecision(): number {
    const maxDist = window.innerHeight / 2;
    let total = 0;
    let count = 0;

    for (const ptSamples of pointSamples) {
      for (const s of ptSamples) {
        const dist = Math.sqrt((s.gx - s.tx) ** 2 + (s.gy - s.ty) ** 2);
        const score = dist >= maxDist ? 0 : 100 - (dist / maxDist) * 100;
        total += score;
        count++;
      }
    }

    console.log(`[TOV] Validation — ${count} samples across ${POINTS.length} points | precision: ${count === 0 ? 0 : Math.round(total / count)}%`);
    return count === 0 ? 0 : Math.round(total / count);
  }

  function showResult(p: number): void {
    const ok = p >= PRECISION_THRESHOLD;
    Swal.fire({
      title: ok ? "Calibração OK ✓" : "Precisão insuficiente",
      html: `Precisão atual: <strong>${p}%</strong><br>Limiar: ${PRECISION_THRESHOLD}%`,
      icon: ok ? "success" : "warning",
      confirmButtonText: ok ? "Iniciar Experimento" : "Repetir Calibração",
      showDenyButton: ok,
      denyButtonText: "Recalibrar",
      allowOutsideClick: false,
      background: "#1e293b",
      color: "#f1f5f9",
      confirmButtonColor: ok ? "#6366f1" : "#f59e0b",
      denyButtonColor: "#64748b",
    }).then((r) => {
      if (r.isDenied) { onRetry(); return; }
      if (ok) { onProceed(); return; }
      onRetry();
    });
  }

  function cancelAnimation(): void {
    if (animationId === null) return;
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  function animate(now: number): void {
    if (startTime === null) startTime = now;
    const elapsed = now - startTime;

    const state  = dotState(elapsed);
    dotX         = state.x;
    dotY         = state.y;
    isDwelling   = state.dwelling;
    currentPtIdx = state.pointIdx;
    progress     = Math.min(elapsed / TOTAL_MS, 1);

    // Record gaze vs dot position only during settled dwell
    const settled = state.dwelling && state.dwellElapsed >= SETTLE_MS;
    if (settled && now - lastRecorded >= RECORD_MS) {
      const g = gazeStore.latestGaze;
      if (g.x > 0 || g.y > 0) {
        pointSamples[state.pointIdx].push({ gx: g.x, gy: g.y, tx: dotX, ty: dotY });
      }
      lastRecorded = now;
    }

    if (elapsed >= TOTAL_MS) {
      cancelAnimation();
      phase = "done";
      showResult(computePrecision());
      return;
    }

    animationId = requestAnimationFrame(animate);
  }

  onMount(() => {
    gazeStore.resume();

    const p = toPixels(POINTS[0]);
    dotX = p.x;
    dotY = p.y;

    let count = COUNTDOWN_START;
    const id = setInterval(() => {
      count--;
      countdown = count;
      if (count > 0) return;
      clearInterval(id);
      phase    = "tracking";
      animationId = requestAnimationFrame(animate);
    }, 1000);
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
      {currentPtIdx + 1} / {POINTS.length}
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
