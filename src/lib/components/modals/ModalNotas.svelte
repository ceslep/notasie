<script lang="ts">
  import { gradesApi } from '$lib/services/api'
  import TableNotas from '../grades/TableNotas.svelte'
  import { onMount } from 'svelte'

  let { estudiante, asignatura, periodo, onClose }: {
    estudiante: string; asignatura: string; periodo: string; onClose?: (t?: string) => void
  } = $props()

  let nd = $state<any[]>([])
  let ndf = $state<any[]>([])

  onMount(async () => {
    nd = await gradesApi.getNotasDetallado(estudiante, asignatura, periodo)
    ndf = [...nd]
    nd = nd.filter((n: any) => n.Nota !== null)
    setTimeout(() => { if (nd.length === 0) onClose?.('no hay notas') }, 1000)
  })
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden z-10">
    <div class="p-5 border-b border-white/5 rounded-t-3xl flex items-center justify-between">
      <h3 class="text-base font-bold text-white">{asignatura}</h3>
      <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
    </div>
    <div class="p-4 max-h-[75vh] overflow-y-auto">
      {#if nd.length > 0}
        <TableNotas notasDetallado={nd} notasDetalladoFull={ndf} />
      {:else}
        <div class="flex items-center justify-center min-h-[40vh]"><div class="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>
      {/if}
    </div>
    <div class="px-5 pb-5"><button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cerrar</button></div>
  </div>
</div>


