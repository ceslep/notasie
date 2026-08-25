<script lang="ts">
  import TablePuestos from '../grades/TablePuestos.svelte'
  import { puestosApi } from '$lib/services/api'
  import { onMount } from 'svelte'

  let { estudiante, periodo, nombres, asignacion = '1', onClose }: {
    estudiante: string; periodo: string; nombres: string; asignacion?: string; onClose?: (t?: string) => void
  } = $props()

  let activeTab = $state('ie')
  let puestosIe = $state<any[]>([])
  let puestosGrupo = $state<any[]>([])
  let loading = $state(true)

  let pgrupo = $derived(puestosGrupo.findIndex((p: any) => p.nombres === nombres) + 1)
  let pie = $derived(puestosIe.findIndex((p: any) => p.nombres === nombres) + 1)

  onMount(async () => {
    try {
      const year = new Date().getFullYear().toString()
      const [ie, grupo] = await Promise.all([
        puestosApi.getIE(asignacion, year, periodo),
        puestosApi.getGrupo(estudiante, year, periodo, asignacion),
      ])
      puestosIe = ie || []
      puestosGrupo = grupo || []
    } catch {}
    loading = false
  })
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" role="button" tabindex="-1" onclick={() => onClose?.()} onkeydown={(e) => e.key === 'Escape' && onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10">
    <div class="bg-gradient-to-r from-amber-500/20 to-red-500/20 px-5 py-3 rounded-t-3xl flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-BwtahaCLSoUOyWdITnlPCNiwzCLUdL.png" alt="" class="w-6 h-6 object-contain" />
        <h3 class="text-base font-bold text-white">Puestos</h3>
      </div>
      <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
    </div>
    <div class="p-4 max-h-[75vh] overflow-y-auto">
      {#if loading}
        <div class="flex items-center justify-center min-h-[30vh]">
          <div class="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
        </div>
      {:else}
        <div class="flex gap-2 mb-3">
          <button class="flex-1 rounded-2xl py-2 text-xs font-semibold transition-all {activeTab === 'ie' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'glass text-slate-400 hover:text-white'}" onclick={() => activeTab = 'ie'}>Institucion</button>
          <button class="flex-1 rounded-2xl py-2 text-xs font-semibold transition-all {activeTab === 'grupo' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'glass text-slate-400 hover:text-white'}" onclick={() => activeTab = 'grupo'}>Grupo</button>
        </div>
        {#if activeTab === 'ie'}
          <p class="text-xs text-slate-400 mb-2">Tu puesto: <span class="font-bold text-amber-400">{pie > 0 ? pie : '-'}</span> de {puestosIe.length}</p>
          <TablePuestos estudiante={nombres} data={puestosIe} />
        {:else}
          <p class="text-xs text-slate-400 mb-2">Tu puesto: <span class="font-bold text-amber-400">{pgrupo > 0 ? pgrupo : '-'}</span> de {puestosGrupo.length}</p>
          <TablePuestos estudiante={nombres} data={puestosGrupo} />
        {/if}
      {/if}
    </div>
    <div class="px-5 pb-5"><button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cerrar</button></div>
  </div>
</div>
