<script lang="ts">
  import TablePuestos from '../grades/TablePuestos.svelte'
  import type { Puesto } from '$lib/types'

  let { estudiante, periodo, nombres, puestosIe = [], puestosGrupo = [], onClose }: {
    estudiante: string; periodo: string; nombres: string; puestosIe?: Puesto[]; puestosGrupo?: Puesto[]; onClose?: (t?: string) => void
  } = $props()

  let activeTab = $state('ie')
  let pgrupo = $derived(puestosGrupo.findIndex((p) => p.nombres === nombres) + 1)
  let pie = $derived(puestosIe.findIndex((p) => p.nombres === nombres) + 1)
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10">
  <div class="bg-gradient-to-r from-amber-500/20 to-red-500/20 px-5 py-3 rounded-t-3xl flex items-center justify-between">
    <h3 class="text-base font-bold text-white">Puestos</h3>
    <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
  </div>
  <div class="p-4 max-h-[75vh] overflow-y-auto">
    <div class="flex gap-2 mb-3">
      <button class="flex-1 rounded-2xl py-2 text-xs font-semibold transition-all {activeTab === 'ie' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600'}" onclick={() => activeTab = 'ie'}>Institucion</button>
      <button class="flex-1 rounded-2xl py-2 text-xs font-semibold transition-all {activeTab === 'grupo' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600'}" onclick={() => activeTab = 'grupo'}>Grupo</button>
    </div>
    {#if activeTab === 'ie'}
      <p class="text-sm font-bold text-emerald-700 mb-2">Puesto IE: {pie}</p>
      <TablePuestos estudiante={nombres} data={puestosIe} />
    {:else}
      <p class="text-sm font-bold text-emerald-700 mb-2">Puesto Grupo: {pgrupo}</p>
      <TablePuestos estudiante={nombres} data={puestosGrupo} />
    {/if}
  </div>
  <div class="px-5 pb-5"><button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cerrar</button></div>
</div></div>


