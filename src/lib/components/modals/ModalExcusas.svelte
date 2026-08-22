<script lang="ts">
  import TableExcusas from '../grades/TableExcusas.svelte'
  import { gradesApi } from '$lib/services/api'
  import { onMount } from 'svelte'
  import Swal from 'sweetalert2'

  let { estudiante, periodo, total = 0, onClose }: {
    estudiante: string; periodo: string; total?: number; onClose?: (t?: string) => void
  } = $props()

  let exc = $state<any[]>([])

  onMount(async () => {
    try {
      const r = await gradesApi.getExcusas(estudiante, periodo)
      exc = r.excusas; total = r.total
    } catch { await Swal.fire({ icon: 'error', text: 'Sin conexion', toast: true }); onClose?.('') }
    setTimeout(() => { if (exc.length === 0) onClose?.('no hay excusas') }, 1000)
  })
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10">
    <div class="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-5 py-3 rounded-t-3xl flex items-center justify-between">
      <h3 class="text-base font-bold text-white">Excusas</h3>
      <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
    </div>
    <div class="p-4 max-h-[75vh] overflow-y-auto">
      {#if exc.length > 0}
        <TableExcusas {total} ExcusasDetallado={exc} />
      {:else}
        <div class="flex items-center justify-center min-h-[40vh]"><div class="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>
      {/if}
    </div>
    <div class="px-5 pb-5"><button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cerrar</button></div>
  </div>
</div>

