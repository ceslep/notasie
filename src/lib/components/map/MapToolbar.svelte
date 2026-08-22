<script lang="ts">
  let { onEyeChange, onLinesChange, onReset }: {
    onEyeChange?: (v: boolean) => void; onLinesChange?: (v: boolean) => void; onReset?: () => void
  } = $props()
  let eye = $state(true)
  let lines = $state(true)
</script>
<div class="flex flex-col gap-1 bg-white rounded-xl shadow-lg p-1">
  <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors" onclick={() => onReset?.()} title="Reset">
    <svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" class="w-4 h-4" stroke="currentColor"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
  </button>
  <button class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors {eye ? 'bg-slate-100' : 'opacity-50'}" onclick={() => { eye = !eye; onEyeChange?.(eye) }}>
    <svg fill="none" stroke-width={eye ? 2 : 1} viewBox="0 0 24 24" class="w-4 h-4" stroke="currentColor">
      {#if eye}<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
      {:else}<path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18"></path>{/if}
    </svg>
  </button>
  <button class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors {lines ? 'bg-slate-100' : 'opacity-50'}" onclick={() => { lines = !lines; onLinesChange?.(lines) }}>
    <svg fill="none" stroke-width={lines ? 2 : 1} viewBox="0 0 24 24" class="w-4 h-4" stroke="currentColor"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
  </button>
</div>
