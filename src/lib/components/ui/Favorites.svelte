<script lang="ts">
  import type { Nota } from '$lib/types'

  let { notas = [], estudiante = '', onClose }: {
    notas?: Nota[]; estudiante: string; onClose?: () => void
  } = $props()

  const STORAGE_KEY = 'notasie_favorites'

  let favorites = $state<string[]>(loadFavorites())

  function loadFavorites(): string[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY}_${estudiante}`)
      return data ? JSON.parse(data) : []
    } catch { return [] }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${estudiante}`, JSON.stringify(favorites))
    } catch {}
  }

  function toggle(asignatura: string) {
    const idx = favorites.indexOf(asignatura)
    if (idx >= 0) {
      favorites = favorites.filter(f => f !== asignatura)
    } else {
      favorites = [...favorites, asignatura]
    }
    saveFavorites()
  }

  function isFav(asignatura: string) {
    return favorites.includes(asignatura)
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={() => onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-300">
    <div class="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-5 py-3 rounded-t-3xl flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-QhvfavmoGfPmREwwvl4XtqTIORARDz.png" alt="" class="w-6 h-6 object-contain" />
        <h3 class="text-base font-bold text-white">Mis Favoritas</h3>
      </div>
      <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
    </div>

    <div class="p-4 max-h-[65vh] overflow-y-auto">
      <p class="text-xs text-slate-400 mb-3">Selecciona las materias que quieras ver primero</p>
      <div class="space-y-2">
        {#each notas as nota}
          <button
            class="w-full flex items-center gap-3 p-3 rounded-xl transition-all {isFav(nota.asignatura) ? 'bg-amber-500/15 border border-amber-500/30' : 'glass border border-white/5 hover:bg-white/5'}"
            onclick={() => toggle(nota.asignatura)}
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center {isFav(nota.asignatura) ? 'bg-amber-500/30' : 'bg-white/5'}">
              {#if isFav(nota.asignatura)}
                <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {:else}
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
              {/if}
            </div>
            <div class="flex-1 text-left min-w-0">
              <p class="text-sm font-semibold {isFav(nota.asignatura) ? 'text-amber-300' : 'text-white'} truncate">{nota.asignatura}</p>
              <p class="text-[10px] text-slate-500 truncate">{nota.docente}</p>
            </div>
            <span class="text-xs font-bold {parseFloat(nota.valoracion) >= 3.0 ? 'text-emerald-400' : 'text-red-400'}">{parseFloat(nota.valoracion || '0').toFixed(1)}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="px-5 pb-5">
      <button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>
        {favorites.length > 0 ? `${favorites.length} favorita${favorites.length > 1 ? 's' : ''} guardada${favorites.length > 1 ? 's' : ''}` : 'Cerrar'}
      </button>
    </div>
  </div>
</div>
