<script lang="ts">
  import type { Inasistencia } from '$lib/types'
  let { inasistenciasDetallado = [], total = 0 }: { inasistenciasDetallado: Inasistencia[]; total?: number } = $props()
</script>
{#if inasistenciasDetallado.length > 0}
  <div class="overflow-x-auto -mx-4 px-4">
    <p class="text-sm font-semibold text-emerald-700 mb-2">Total Inasistencias {total}</p>
    <table class="w-full text-xs">
      <thead><tr class="bg-white/5 border-b border-white/5">
        <th class="px-2 py-2 text-center font-semibold text-slate-400">#</th>
        <th class="px-2 py-2 text-center font-semibold text-slate-400">Fecha</th>
        <th class="px-2 py-2 text-center font-semibold text-slate-400">Hora</th>
        <th class="px-2 py-2 text-center font-semibold text-slate-400">Excusa</th>
        <th class="px-2 py-2 text-center font-semibold text-slate-400">Hrs</th>
      </tr></thead>
      <tbody>
        {#each inasistenciasDetallado as { fecha, hora_clase, excusa, horas }, i}
          <tr class="border-b border-white/5 active:bg-white/5">
            <td class="px-2 py-2 text-center">{i + 1}</td>
            <td class="px-2 py-2">{fecha}</td>
            <td class="px-2 py-2 text-center">{hora_clase || 'Sin registro'}</td>
            <td class="px-2 py-2 text-center">{excusa || 'No existe'}</td>
            <td class="px-2 py-2 text-center">{horas === 'r' ? 'Retiro' : horas}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="flex items-center justify-center min-h-[40vh]"><div class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>
{/if}

