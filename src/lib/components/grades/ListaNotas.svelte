<script lang="ts">
  import type { Nota } from '$lib/types'
  import ModalNotas from '../modals/ModalNotas.svelte'
  import ModalInas from '../modals/ModalInas.svelte'
  import ModalExcusas from '../modals/ModalExcusas.svelte'
  import ModalDescripcion from '../modals/ModalDescripcion.svelte'

  let { notas = [], estudiante = '', periodo = '', nivel = '', asignacion = '', nombres = '' }: {
    notas: Nota[]; estudiante: string; periodo: string; nivel: string; asignacion?: string; nombres?: string
  } = $props()

  let activeModal = $state('')
  let notaSel = $state<any>(null)

  const show = (m: string, n: any) => { activeModal = m; notaSel = n }
  const close = () => { activeModal = ''; notaSel = null }

  const gradeColor = (v: string) => {
    const f = parseFloat(v)
    if (f >= 4.5) return 'from-emerald-500 to-green-400'
    if (f >= 3.5) return 'from-blue-500 to-cyan-400'
    if (f >= 3.0) return 'from-amber-500 to-yellow-400'
    return 'from-red-500 to-rose-400'
  }
  const gradeTextColor = (v: string) => {
    const f = parseFloat(v)
    if (f >= 3.0) return 'text-emerald-300'
    return 'text-red-400'
  }
  const fmt = (v: string) => parseFloat(v || '0').toFixed(1)
</script>

{#if activeModal === 'notas' && notaSel}
  <ModalNotas {estudiante} asignatura={notaSel.asignatura} {periodo} onClose={(t) => { close() }} />
{/if}
{#if activeModal === 'inas' && notaSel}
  <ModalInas {estudiante} asignatura={notaSel.asignatura} {periodo} total={parseInt(notaSel.cantidadInasistencias)} onClose={(t) => { close() }} />
{/if}
{#if activeModal === 'excusas'}
  <ModalExcusas {estudiante} {periodo} total={notas.reduce((a, n) => a + (parseInt(n.cantidadInasistencias) || 0), 0)} onClose={(t) => { close() }} />
{/if}
{#if activeModal === 'desc' && notaSel}
  <ModalDescripcion {estudiante} asignatura={notaSel.asignatura} valoracion={notaSel.valoracion} {periodo} docente={notaSel.docente} onClose={(t) => { close() }} />
{/if}

<div class="space-y-3">
  {#each notas as nota, i}
    <div class="glass rounded-2xl overflow-hidden border border-white/5 animate-slide-up" style="animation-delay: {i * 50}ms">
      <div class="p-4">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-white truncate">{nota.asignatura}</h4>
            <p class="text-xs text-slate-400 mt-0.5 truncate">{nota.docente}</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br {gradeColor(nota.valoracion)} flex items-center justify-center shadow-lg">
              <span class="text-sm font-bold text-white">{fmt(nota.valoracion)}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-1.5">
          <button class="flex-1 py-2 rounded-xl text-[10px] font-semibold glass text-indigo-300 hover:bg-indigo-500/20 active:scale-95 transition-all" onclick={() => show('notas', nota)}>
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Notas
          </button>
          <button class="flex-1 py-2 rounded-xl text-[10px] font-semibold glass text-cyan-300 hover:bg-cyan-500/20 active:scale-95 transition-all" onclick={() => show('inas', nota)}>
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {nota.cantidadInasistencias || '0'}
          </button>
          <button class="flex-1 py-2 rounded-xl text-[10px] font-semibold glass text-purple-300 hover:bg-purple-500/20 active:scale-95 transition-all" onclick={() => show('desc', nota)}>
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Desc
          </button>
        </div>
      </div>
      {#if nivel === 'BG' && nota.countNotas.length > 0}
        <div class="px-4 pb-3 flex gap-1 flex-wrap">
          {#each nota.countNotas as cv}
            <span class="text-[9px] rounded-md px-2 py-0.5 bg-white/5 text-slate-400 border border-white/5">{cv}</span>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
