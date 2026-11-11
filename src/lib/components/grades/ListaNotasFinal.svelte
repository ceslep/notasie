<script lang="ts">
  import type { AreaAsignatura, Nota } from '$lib/types'
  import { gradesApi } from '$lib/services/api'
  import { calcularAreasConcentrador, calcularAreasFinal, cargarAreasNivel } from '$lib/utils/areas'
  import ListaNotas from './ListaNotas.svelte'

  let { notas = [], notasDetalladas = {}, estudiante = '', periodo = '', nivel = '', asignacion = '', nombres = '', HED = '', numero = '' }: {
    notas?: Nota[]; notasDetalladas?: Record<string, any[]>; estudiante: string; periodo: string; nivel: string; asignacion?: string; nombres?: string; HED?: string; numero?: string
  } = $props()

  let vista = $state<'areas' | 'asignaturas'>('areas')
  let areas = $state<AreaAsignatura[]>([])
  let cargandoAreas = $state(true)
  let errorAreas = $state(false)
  let notasPeriodos = $state<any[]>([])
  let cargandoNotas = $state(false)

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

  $effect(() => {
    const alumno = estudiante
    if (!alumno) {
      notasPeriodos = []
      cargandoNotas = false
      return
    }

    let cancelado = false
    cargandoNotas = true

    Promise.all(
      ['UNO', 'DOS', 'TRES', 'CUATRO'].map((p) =>
        gradesApi.getNotas(p, alumno).catch(() => []),
      ),
    )
      .then((listas) => {
        if (!cancelado) notasPeriodos = listas.flat()
      })
      .finally(() => {
        if (!cancelado) cargandoNotas = false
      })

    return () => {
      cancelado = true
    }
  })

  let filas = $derived(
    notasPeriodos.length > 0
      ? calcularAreasConcentrador(notasPeriodos, areas)
      : calcularAreasFinal(notas, areas),
  )

  const finalColor = (valor: number) =>
    valor >= 4.5 ? 'text-emerald-400' : valor >= 3.5 ? 'text-sky-400' : valor >= 3 ? 'text-amber-400' : 'text-rose-400'
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between gap-3">
    <p class="text-[10px] text-slate-500">
      {vista === 'areas' ? 'Nota final agrupada por área' : 'Nota final por asignatura'}
    </p>
    <div class="inline-flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5" role="group" aria-label="Agrupar notas finales">
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
    <p class="text-[10px] text-amber-400">No se pudieron cargar las áreas; se muestran las asignaturas.</p>
  {/if}

  {#if vista === 'asignaturas'}
    <ListaNotas {notas} {notasDetalladas} {estudiante} {periodo} {nivel} {asignacion} {nombres} {HED} {numero} />
  {:else}
    <div class="relative">
      {#if cargandoAreas || cargandoNotas}
        <div class="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-900/40 backdrop-blur-sm">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
            <span class="text-xs text-slate-300">Cargando áreas...</span>
          </div>
        </div>
      {/if}

      <div class="glass rounded-2xl overflow-hidden border border-white/5">
        <table class="w-full text-xs">
          <thead>
            <tr class="bg-white/5 border-b border-white/5">
              <th class="px-3 py-2.5 text-left font-semibold text-slate-400">Área</th>
              <th class="px-3 py-2.5 text-center font-semibold text-slate-400">Final</th>
            </tr>
          </thead>
          <tbody>
            {#each filas as fila}
              <tr class="border-b border-white/5 active:bg-white/5">
                <td class="px-3 py-2.5 text-left font-medium {fila.area === 'SIN ÁREA' ? 'text-amber-300' : 'text-slate-200'}">{fila.area}</td>
                <td class="px-3 py-2.5 text-center font-bold text-sm {finalColor(fila.final)}">{fila.final.toFixed(1)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
