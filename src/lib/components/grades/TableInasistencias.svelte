<script lang="ts">
  import type { Excusa, Inasistencia } from '$lib/types'
  import { excusasDeInasistencia, textoExcusa } from '$lib/utils/excusas'

  let { inasistenciasDetallado = [], total = 0, excusas = [] }: {
    inasistenciasDetallado: Inasistencia[]
    total?: number
    /** Excusas del estudiante; se cruzan con cada inasistencia por fecha y hora de salida. */
    excusas?: Excusa[]
  } = $props()
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
        {#each inasistenciasDetallado as inasistencia, i}
          {@const excusasCoincidentes = excusasDeInasistencia(excusas, inasistencia)}
          <tr class="border-b border-white/5 active:bg-white/5 align-top">
            <td class="px-2 py-2 text-center">{i + 1}</td>
            <td class="px-2 py-2">{inasistencia.fecha}</td>
            <td class="px-2 py-2 text-center">{inasistencia.hora_clase || 'Sin registro'}</td>
            <td class="px-2 py-2 text-left">
              {#if excusasCoincidentes.length > 0}
                <div class="flex flex-col gap-1">
                  {#each excusasCoincidentes as excusa, j}
                    <div class="flex items-start gap-1">
                      <span class="mt-[2px] inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[8px] font-bold text-emerald-300">✓</span>
                      <span class="text-emerald-300">
                        {textoExcusa(excusa)}
                        {#if excusa.hora_salida && !/todo el d[ií]a|varios d[ií]as/i.test(String(excusa.hora_salida))}
                          <span class="text-[10px] text-emerald-400/70">({excusa.hora_salida})</span>
                        {/if}
                        {#if excusasCoincidentes.length > 1}
                          <span class="text-[10px] text-emerald-400/70">[{j + 1}]</span>
                        {/if}
                      </span>
                    </div>
                  {/each}
                </div>
              {:else}
                <span class="text-slate-400">{inasistencia.excusa === 'No' || !inasistencia.excusa ? 'Sin excusa' : inasistencia.excusa}</span>
                {#if inasistencia.detalle}
                  <p class="mt-0.5 text-[10px] text-slate-500">{inasistencia.detalle}</p>
                {/if}
              {/if}
            </td>
            <td class="px-2 py-2 text-center">{inasistencia.horas === 'r' ? 'Retiro' : inasistencia.horas}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="flex items-center justify-center min-h-[40vh]"><div class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>
{/if}
