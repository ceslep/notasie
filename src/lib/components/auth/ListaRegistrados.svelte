<script lang="ts">
  let { listaRegistrados = [], onClose, onSelect }: {
    listaRegistrados: any[]; onClose?: () => void; onSelect?: (id: string, pass: string) => void
  } = $props()
  let textFilter = $state("")
  const Filtro = (data: any[], text: string): any[] => {
    if (text === "") return data
    return data.filter((d) => {
      const id = String(d.identificacion).toLowerCase()
      const nom = d.nombres?.toLowerCase() || ""
      return id.includes(text.toLowerCase()) || nom.includes(text.toLowerCase())
    })
  }
  $effect(() => { listaRegistrados = Filtro(listaRegistrados, textFilter) })
</script>
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
  <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={() => onClose?.()} role="button" tabindex="-1" onkeydown={(e) => e.key === "Escape" && onClose?.()}></div>
  <div class="relative w-full max-w-lg animate-scale-in">
    <div class="relative glass-strong rounded-3xl overflow-hidden border border-white/10">
      <div class="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 class="text-sm font-bold text-white">Estudiantes</h3>
        <button class="text-slate-400 hover:text-white transition-colors" onclick={() => onClose?.()}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-4 space-y-3">
        <input type="search" placeholder="Buscar por nombre o ID..." class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" bind:value={textFilter} />
        <div class="max-h-[55vh] overflow-y-auto space-y-1.5 pr-1">
          {#each listaRegistrados as { identificacion, pass, ...rest }}
            <button class="flex items-center gap-3 w-full p-3 rounded-xl glass hover:bg-white/10 active:bg-indigo-500/20 transition-all text-left" onclick={() => onSelect?.(identificacion, pass || identificacion)}>
              <img class="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10" src={rest.photoURL || "https://thumbs.dreamstime.com/b/icono-perfil-de-usuario-t%C3%ADpico-como-un-marcador-de-posici%C3%B3n-el-fondo-el-aislado-blancos-ni-sombrero-185145538.jpg"} alt="" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-white truncate">{rest.nombres || identificacion}</p>
                <p class="text-[10px] text-slate-400">{identificacion}</p>
              </div>
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          {/each}
        </div>
      </div>
      <div class="p-4 border-t border-white/5">
        <button class="w-full py-3 rounded-xl text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-all" onclick={() => onClose?.()}>Cerrar</button>
      </div>
    </div>
  </div>
</div>
