<script lang="ts">
  import { onMount } from 'svelte'
  let { positivo = false, blinking = false, onclick }: { blinking?: boolean; positivo?: boolean; onclick?: () => void } = $props()
  let mount = $state(false)
  onMount(() => { mount = true })
</script>
{#if mount}
  <button class="w-full rounded-2xl p-3.5 text-left transition-all duration-300 active:scale-[0.98] {positivo ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/20' : 'bg-gradient-to-r from-red-500/20 to-rose-500/10 border border-red-500/20'}" onclick={onclick}>
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl {positivo ? 'bg-emerald-500/20' : 'bg-red-500/20'} flex items-center justify-center flex-shrink-0">
        {#if positivo}
          <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        {:else}
          <svg class="w-5 h-5 text-red-400 {blinking ? 'animate-pulse' : ''}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        {/if}
      </div>
      <div class="flex-1">
        <span class="text-xs font-bold {positivo ? 'text-emerald-300' : 'text-red-300'}">Informe de Convivencia</span>
        {#if positivo}
          <div class="flex items-center gap-1 mt-0.5">
            <span class="text-[10px] text-emerald-400">Felicitaciones</span>
            <img class="w-4 h-4" src="./medalla.png" alt="Medalla" />
          </div>
        {:else}
          <span class="text-[10px] text-red-400/70 block">{blinking ? 'Tienes reportes pendientes' : 'Sin novedades'}</span>
        {/if}
      </div>
      <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    </div>
  </button>
{/if}
