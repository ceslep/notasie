<script lang="ts">
  import Convivencia from '../ui/Convivencia.svelte'
  import ListaNotas from './ListaNotas.svelte'
  import ListaNotasConcentrador from './ListaNotasConcentrador.svelte'
  import ListaConvivencia from './ListaConvivencia.svelte'
  import Spn from '../ui/Spn.svelte'

  let { estudiante, nivel, numero, asignacion, nombres, notas = [], showPeriodTabs = 'UNO', onTabChange, convivencia = [] }: {
    estudiante: string; nivel: string; numero: string; asignacion: string; nombres: string; notas?: any[]; showPeriodTabs?: string; onTabChange?: (p: string) => void; convivencia?: any[]
  } = $props()

  const tabs = [
    { id: 'UNO', label: 'P1' },
    { id: 'DOS', label: 'P2' },
    { id: 'TRES', label: 'P3' },
    { id: 'CUATRO', label: 'P4' },
    { id: 'FINAL', label: 'Final' },
    { id: 'Concentrador', label: 'Resumen' },
    { id: 'Convivencia', label: 'Convivencia' },
  ]

  let positivo = $derived(convivencia.some(c => c.tipoFalta === 'POSITIVO'))
  let blinking = $derived(convivencia.length > 0)
</script>

<div class="max-w-2xl mx-auto px-4 pb-8">
  <div class="glass-strong rounded-2xl p-4 mb-4 animate-fade-in border border-white/5">
    <div class="flex items-center gap-3">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-white truncate">{nombres}</p>
        <p class="text-xs text-slate-400 truncate">{estudiante}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/20">{nivel}-{numero}</span>
      </div>
    </div>
  </div>

  {#if blinking}
    <div class="mb-4 animate-fade-in">
      <Convivencia {positivo} {blinking} />
    </div>
  {/if}

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
    {:else if showPeriodTabs === 'Concentrador'}
      {#if notas.length > 0}
        <ListaNotasConcentrador notas={notas.map(n => ({ asignatura: n.asignatura, periodo: n.periodo, valoracion: n.valoracion, desempeno: n.desempeno }))} />
      {:else}
        <Spn />
      {/if}
    {:else}
      {#if notas.length > 0}
        <ListaNotas {notas} {estudiante} {asignacion} {nombres} periodo={showPeriodTabs} {nivel} />
      {:else}
        <Spn />
      {/if}
    {/if}
  </div>
</div>
