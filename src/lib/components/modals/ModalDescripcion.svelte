<script lang="ts">
  import Descripcion from '../ui/Descripcion.svelte'
  import { gradesApi } from '$lib/services/api'
  import { onMount } from 'svelte'

  let { estudiante, asignatura, valoracion, periodo, docente, onClose }: {
    estudiante: string; asignatura: string; valoracion: string; periodo: string; docente: string; onClose?: (t?: string) => void
  } = $props()

  let desc = $state<any[]>([])

  onMount(async () => {
    desc = await gradesApi.getDescripcion(estudiante, asignatura, valoracion, periodo, docente)
    setTimeout(() => { if (desc.length === 0) onClose?.('no hay Descripcion') }, 1000)
  })
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10">
    <div class="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-5 py-3 rounded-t-3xl flex items-center justify-between">
      <h3 class="text-base font-bold text-white">{asignatura}</h3>
      <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
    </div>
    <div class="p-4 max-h-[75vh] overflow-y-auto">
      <p class="text-sm text-slate-300 mb-3">Periodo: {periodo} - Valoracion: <span class="font-bold text-white">{parseFloat(valoracion).toFixed(1)}</span></p>
      {#if desc.length > 0}
        <Descripcion descripcionDetallado={desc} />
      {:else}
        <div class="flex items-center justify-center min-h-[40vh]"><div class="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>
      {/if}
    </div>
    <div class="px-5 pb-5"><button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cerrar</button></div>
  </div>
</div>

