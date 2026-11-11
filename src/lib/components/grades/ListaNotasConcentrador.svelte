<script lang="ts">
  import type { AreaAsignatura } from '$lib/types'
  import { calcularAreasConcentrador, cargarAreasNivel } from '$lib/utils/areas'

  let { notas = [], nivel = '' }: { notas?: any[]; nivel?: string } = $props()

  type Fila = { etiqueta: string; valoraciones: (number | null)[]; final: number }

  const PERIODOS = ['UNO', 'DOS', 'TRES', 'CUATRO']

  let vista = $state<'areas' | 'asignaturas'>('areas')
  let areas = $state<AreaAsignatura[]>([])
  let cargandoAreas = $state(true)
  let errorAreas = $state(false)

  $effect(() => {
    const nivelActual = nivel
    if (!nivelActual) {
      areas = []
      cargandoAreas = false
      return
    }

    let cancelado = false
    cargandoAreas = true
    errorAreas = false

    cargarAreasNivel(nivelActual)
      .then((datos) => {
        if (!cancelado) areas = datos
      })
      .catch(() => {
        if (cancelado) return
        areas = []
        errorAreas = true
        vista = 'asignaturas'
      })
      .finally(() => {
        if (!cancelado) cargandoAreas = false
      })

    return () => {
      cancelado = true
    }
  })

  let dataAsignaturas: Fila[] = $derived.by(() => {
    const asignaturas = new Set(notas.map((n) => n.asignatura))
    const result: Fila[] = []
    asignaturas.forEach((asig) => {
      const porPeriodo = new Map<number, number>()
      for (const nota of notas) {
        if (nota.asignatura !== asig) continue
        const indice = PERIODOS.indexOf(String(nota.periodo ?? '').toUpperCase())
        if (indice < 0) continue
        const valor = Number.parseFloat(String(nota.valoracion ?? ''))
        if (Number.isFinite(valor)) porPeriodo.set(indice, valor)
      }
      const valoraciones = PERIODOS.map((_, indice) => porPeriodo.get(indice) ?? null)
      const disponibles = PERIODOS.map((_, indice) => porPeriodo.get(indice)).filter(
        (valor): valor is number => valor !== undefined,
      )
      const final =
        disponibles.length > 0
          ? disponibles.reduce((a, b) => a + b, 0) / disponibles.length
          : 0
      result.push({ etiqueta: String(asig), valoraciones, final })
    })
    return result
  })

  let dataAreas: Fila[] = $derived(
    calcularAreasConcentrador(notas, areas).map((fila) => ({
      etiqueta: fila.area,
      valoraciones: fila.valoraciones,
      final: fila.final,
    })),
  )

  let filas: Fila[] = $derived(vista === 'areas' ? dataAreas : dataAsignaturas)

  const valoresDisponibles = (fila: Fila) =>
    fila.valoraciones.filter((valor): valor is number => valor !== null)

  const tendenciaFila = (fila: Fila) => {
    const valores = valoresDisponibles(fila)
    if (valores.length < 2) return { arrow: '→', color: 'text-yellow-400' }
    const inicio = valores[0]
    const fin = valores[valores.length - 1]
    if (fin > inicio) return { arrow: '↗', color: 'text-green-400' }
    if (fin < inicio) return { arrow: '↘', color: 'text-red-400' }
    return { arrow: '→', color: 'text-yellow-400' }
  }

  let overallTrend = $derived.by(() => {
    const valores = filas.map(valoresDisponibles).filter((lista) => lista.length > 0)
    if (valores.length === 0) return { arrow: '→', color: 'text-yellow-400' }
    const inicio = valores.reduce((suma, lista) => suma + lista[0], 0) / valores.length
    const fin =
      valores.reduce((suma, lista) => suma + lista[lista.length - 1], 0) / valores.length
    if (fin > inicio) return { arrow: '↗', color: 'text-green-400' }
    if (fin < inicio) return { arrow: '↘', color: 'text-red-400' }
    return { arrow: '→', color: 'text-yellow-400' }
  })

</script>

<div class="mb-3 flex items-center justify-between gap-3">
  <p class="text-[10px] text-slate-500">
    {vista === 'areas' ? 'Notas agrupadas por área' : 'Notas por asignatura'}
  </p>
  <div class="inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5" role="group" aria-label="Agrupar resumen">
    <button
      type="button"
      aria-pressed={vista === 'areas'}
      onclick={() => (vista = 'areas')}
      class="px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all {vista === 'areas' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
    >
      Áreas
    </button>
    <button
      type="button"
      aria-pressed={vista === 'asignaturas'}
      onclick={() => (vista = 'asignaturas')}
      class="px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all {vista === 'asignaturas' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
    >
      Asignaturas
    </button>
  </div>
</div>

{#if errorAreas}
  <p class="mb-2 text-[10px] text-amber-400">No se pudieron cargar las áreas; se muestran las asignaturas.</p>
{/if}

<div class="relative">
  {#if vista === 'areas' && cargandoAreas}
    <div class="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-900/40 backdrop-blur-sm">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
        <span class="text-xs text-slate-300">Cargando áreas...</span>
      </div>
    </div>
  {/if}

  <div class="overflow-x-auto -mx-4 px-4">
    <table class="w-full text-xs">
      <thead>
        <tr class="bg-white/5 border-b border-white/5">
          <th class="px-2 py-2 text-left font-semibold text-slate-400">{vista === 'areas' ? 'Área' : 'Asig'}</th>
          <th class="px-2 py-2 text-center font-semibold text-slate-400">P1</th>
          <th class="px-2 py-2 text-center font-semibold text-slate-400">P2</th>
          <th class="px-2 py-2 text-center font-semibold text-slate-400">P3</th>
          <th class="px-2 py-2 text-center font-semibold text-slate-400">P4</th>
          <th class="px-2 py-2 text-center font-semibold text-slate-400">Fin</th>
          <th class="px-2 py-2 text-center font-semibold text-slate-400">Tendencia</th>
        </tr>
      </thead>
      <tbody>
        {#each filas as fila}
          <tr class="border-b border-white/5 active:bg-white/5">
            <td class="px-2 py-2 text-left font-medium {fila.etiqueta === 'SIN ÁREA' ? 'text-amber-300' : 'text-slate-200'}">{fila.etiqueta}</td>
            {#each fila.valoraciones as valoracion}
              {#if valoracion === null}
                <td class="px-2 py-2 text-center font-semibold text-slate-500">—</td>
              {:else}
                <td class="px-2 py-2 text-center font-semibold {valoracion < 3 ? 'text-red-400' : 'text-white'}">{valoracion.toFixed(1)}</td>
              {/if}
            {/each}
            <td class="px-2 py-2 text-center font-bold text-emerald-400">{fila.final.toFixed(1)}</td>
            <td class="px-2 py-2 text-center font-bold text-lg {tendenciaFila(fila).color}">
              {tendenciaFila(fila).arrow}
            </td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr class="bg-white/5 border-t border-white/10">
          <td class="px-2 py-2 text-center font-bold text-slate-300" colspan="6">Promedio General</td>
          <td class="px-2 py-2 text-center font-bold text-lg {overallTrend.color}">
            {overallTrend.arrow}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>
