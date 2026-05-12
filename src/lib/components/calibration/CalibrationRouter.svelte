<script lang="ts">
  import CalibrationOverlay from "./CalibrationOverlay.svelte";

  let {
    onComplete,
    preserveData = false,
  }: { onComplete: () => void; preserveData?: boolean } = $props();
</script>

<CalibrationOverlay {onComplete} {preserveData} />
