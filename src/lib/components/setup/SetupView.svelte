<script lang="ts">
  import { ArrowRight, ImageIcon, ChevronDown } from "lucide-svelte";
  import { experimentStore } from "$lib/stores/experimentStore.svelte";
  import UploadZone from "$lib/components/UploadZone.svelte";
  import ConfigPanel from "$lib/components/ConfigPanel.svelte";
  import StimulusCard from "$lib/components/StimulusCard.svelte";
  import CalibrationGuide from "$lib/components/setup/CalibrationGuide.svelte";

  let { onProceed }: { onProceed: () => void } = $props();

  const canProceed = $derived(experimentStore.hasStimuli);
</script>

<div class="bg-surface text-text">

  <!-- ── Tela 1: Configuração ─────────────────────────────────────────────── -->
  <div>
    <div class="mx-auto max-w-4xl space-y-6 px-6 py-8">

      <header class="space-y-1">
        <h1 class="text-2xl font-bold tracking-tight">TOV — Eye Tracking</h1>
        <p class="text-sm text-muted">
          Carregue os estímulos e configure o experimento antes de iniciar.
        </p>
      </header>

      <UploadZone onFiles={(files) => experimentStore.addStimuli(files)} />

      {#if experimentStore.stimulusCount > 0}
        <section class="space-y-3">
          <div class="flex items-center gap-2 text-sm text-muted">
            <ImageIcon size={14} />
            <span>{experimentStore.stimulusCount} imagem(ns) carregada(s)</span>
          </div>
          <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {#each experimentStore.stimuli as stimulus (stimulus.id)}
              <StimulusCard
                {stimulus}
                onRemove={() => experimentStore.removeStimulus(stimulus.id)}
              />
            {/each}
          </div>
        </section>
      {/if}

      <ConfigPanel />

      <footer class="flex items-center justify-between">
        <a
          href="#guide"
          class="flex items-center gap-1.5 text-xs text-muted/60 transition-colors hover:text-muted"
        >
          <ChevronDown size={14} />
          Sobre calibração
        </a>

        <button
          onclick={onProceed}
          disabled={!canProceed}
          class="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold
                 text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40
                 hover:opacity-90"
        >
          Iniciar Calibração
          <ArrowRight size={16} />
        </button>
      </footer>

    </div>
  </div>

  <!-- ── Tela 2: Guia de calibração ──────────────────────────────────────── -->
  <div id="guide" class="mx-auto max-w-4xl px-6 py-8">
    <CalibrationGuide />
  </div>

</div>
