<script lang="ts">
  import Convivencia from '../ui/Convivencia.svelte'
  import ListaNotas from './ListaNotas.svelte'
  import ListaNotasConcentrador from './ListaNotasConcentrador.svelte'
  import ListaConvivencia from './ListaConvivencia.svelte'
  import Estadisticas from './Estadisticas.svelte'
  import Spn from '../ui/Spn.svelte'
  import ModalPuestos from '../modals/ModalPuestos.svelte'
  import ReportExporter from '../ui/ReportExporter.svelte'

  let { estudiante, nivel, numero, asignacion, nombres, notas = [], notasDetalladas = {}, showPeriodTabs = 'UNO', onTabChange, convivencia = [], refreshing = false, onRefresh }: {
    estudiante: string; nivel: string; numero: string; asignacion: string; nombres: string; notas?: any[]; notasDetalladas?: Record<string, any[]>; showPeriodTabs?: string; onTabChange?: (p: string) => void; convivencia?: any[]; refreshing?: boolean; onRefresh?: () => void
  } = $props()

  const tabs = [
    { id: 'UNO', label: 'P1' },
    { id: 'DOS', label: 'P2' },
    { id: 'TRES', label: 'P3' },
    { id: 'CUATRO', label: 'P4' },
    { id: 'FINAL', label: 'Final' },
    { id: 'Concentrador', label: 'Resumen' },
    { id: 'Convivencia', label: 'Convivencia' },
    { id: 'Estadisticas', label: 'Estadísticas' },
  ]

  let positivo = $derived(convivencia.some(c => c.tipoFalta === 'POSITIVO'))
  let blinking = $derived(convivencia.length > 0)
  let openPuestos = $state(false)

  let periodoValido = $derived(() => {
    const validos = ['UNO', 'DOS', 'TRES', 'CUATRO']
    return validos.includes(showPeriodTabs) ? showPeriodTabs : 'UNO'
  })

  let materiasEnRiesgo = $derived(notas.filter(n => parseFloat(n.valoracion) < 3.0).length)
  let totalInasistencias = $derived(notas.reduce((a, n) => a + (parseInt(n.cantidadInasistencias) || 0), 0))
</script>

<div class="max-w-2xl mx-auto px-4 pb-8">
  <div class="glass-strong rounded-2xl p-4 mb-4 animate-fade-in border border-white/5">
    <div class="flex items-center gap-3">
      <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-iZKfmUSHuQtDn1W2NBIwoLZ0epsnzZ.png" alt="" class="w-10 h-10 object-contain" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-white truncate">{nombres}</p>
        <p class="text-xs text-slate-400 truncate">{estudiante}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/20">{nivel}-{numero}</span>
        <button class="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-xs font-bold border border-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 transition-all flex items-center gap-1.5" onclick={() => openPuestos = true}>
          <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-BwtahaCLSoUOyWdITnlPCNiwzCLUdL.png" alt="" class="w-4 h-4 object-contain" />
          Puestos
        </button>
      </div>
    </div>
  </div>

  <div class="mb-4 animate-fade-in">
    <div class="overflow-x-auto -mx-4 px-4 pb-3 scrollbar-none">
      <div class="flex gap-2 min-w-max">
        {#if materiasEnRiesgo > 0}
          <div class="flex-shrink-0 px-3 py-2 rounded-xl glass border border-red-500/30 bg-red-500/10 flex items-center gap-2">
            <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-rYQA0MBt7kN6Ap9xch2dYMInv4FzEX.png" alt="" class="w-5 h-5 object-contain" />
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/80 text-white text-xs font-bold">{materiasEnRiesgo}</span>
            <span class="text-xs font-semibold text-red-300">materias en riesgo</span>
          </div>
        {/if}
        {#if totalInasistencias > 0}
          <div class="flex-shrink-0 px-3 py-2 rounded-xl glass border border-amber-500/30 bg-amber-500/10 flex items-center gap-2">
            <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-CK4odMSKWdmIj0ueBtNq9HOZR6Fbgv.png" alt="" class="w-5 h-5 object-contain" />
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/80 text-white text-xs font-bold">{totalInasistencias}</span>
            <span class="text-xs font-semibold text-amber-300">inasistencias</span>
          </div>
        {/if}
        {#if blinking && positivo}
          <div class="flex-shrink-0 px-3 py-2 rounded-xl glass border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2">
            <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-HiChF8iNxEQpjV9vKH44UoEduGznyr.png" alt="" class="w-5 h-5 object-contain" />
            <span class="text-xs font-semibold text-emerald-300">convivencia positiva</span>
          </div>
        {:else if blinking}
          <div class="flex-shrink-0 px-3 py-2 rounded-xl glass border border-slate-500/30 bg-slate-500/10 flex items-center gap-2">
            <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-rCHVjln5KLUOliL1uQIEtzhjuvyC3F.png" alt="" class="w-5 h-5 object-contain" />
            <span class="text-xs font-semibold text-slate-300">convivencia</span>
          </div>
        {/if}
        {#if materiasEnRiesgo === 0 && totalInasistencias === 0 && !blinking}
          <div class="flex-shrink-0 px-3 py-2 rounded-xl glass border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2">
            <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-HiChF8iNxEQpjV9vKH44UoEduGznyr.png" alt="" class="w-5 h-5 object-contain" />
            <span class="text-xs font-semibold text-emerald-300">todo en orden</span>
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if blinking}
    <div class="mb-4 animate-fade-in">
      <Convivencia {positivo} {blinking} />
    </div>
  {/if}

  <div class="mb-4 animate-fade-in">
    <ReportExporter {notas} {nombres} {estudiante} {nivel} {numero} periodo={showPeriodTabs} />
  </div>

  <div class="overflow-x-auto -mx-4 px-4 pb-3 scrollbar-none">
    <div class="flex gap-2 min-w-max">
      {#each tabs as tab}
        <button class="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all {showPeriodTabs === tab.id ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' : 'glass text-slate-400 hover:text-white hover:bg-white/10'}" onclick={() => onTabChange?.(tab.id)}>
          {tab.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="animate-fade-in">
    {#if showPeriodTabs === 'Convivencia'}
      <ListaConvivencia {estudiante} />
    {:else if showPeriodTabs === 'Estadisticas'}
      <Estadisticas {notas} {convivencia} {estudiante} {nivel} />
    {:else if showPeriodTabs === 'Concentrador'}
      {#if notas.length > 0}
        <ListaNotasConcentrador notas={notas.map(n => ({ asignatura: n.asignatura, periodo: n.periodo, valoracion: n.valoracion, desempeno: n.desempeno }))} />
      {:else}
        <Spn />
      {/if}
    {:else}
      {#if notas.length > 0}
        <ListaNotas {notas} {notasDetalladas} {estudiante} {asignacion} {nombres} periodo={showPeriodTabs} {nivel} />
      {:else}
        <Spn />
      {/if}
    {/if}
  </div>
</div>

{#if openPuestos}
  <ModalPuestos {estudiante} {nombres} {asignacion} periodo={periodoValido()} onClose={() => openPuestos = false} />
{/if}
