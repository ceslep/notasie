<script lang="ts">
  import { onMount } from 'svelte'
  import { convivenciaApi } from '$lib/services/api'
  import ModalConvivencia from '../modals/ModalConvivencia.svelte'

  let { estudiante }: { estudiante: string } = $props()
  let consolidado = $state<any[]>([])
  let info = $state<any>(null)
  let showModal = $state(false)
  let loadingDetail = $state(false)
  let loading = $state(true)
  let detailPositivo = $state(false)

  function fixLabel(text: string): string {
    if (!text) return text
    return text
      .replace(/&([a-z]+);/gi, (_, entity) => {
        const el = document.createElement('textarea')
        el.innerHTML = `&${entity};`
        return el.value
      })
      .replace(/Falta/gi, 'Situacion')
      .replace(/Faltas/gi, 'Situaciones')
  }

  onMount(async () => {
    try {
      consolidado = await convivenciaApi.getConsolidado(estudiante, new Date().getFullYear())
    } finally {
      loading = false
    }
  })

  const openDetail = async (cons: any) => {
    loadingDetail = true
    showModal = true
    const tipo = cons.cv_tipoFalta || cons.tipoFalta || ''
    detailPositivo = tipo.toUpperCase().includes('POSITIVO')
    try {
      const [data] = await convivenciaApi.getDetallado(cons.ind, new Date().getFullYear())
      info = data
    } catch {
      info = null
    }
    loadingDetail = false
  }
</script>

{#if showModal}
  {#if loadingDetail}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={() => { showModal = false; loadingDetail = false }}></div>
      <div class="relative glass-strong w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-300">
        <div class="p-8 flex flex-col items-center gap-4">
          <div class="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p class="text-sm text-slate-400">Cargando detalle...</p>
        </div>
      </div>
    </div>
  {:else}
    <ModalConvivencia {info} positivo={detailPositivo} onClose={() => { showModal = false; info = null }} />
  {/if}
{/if}

{#if loading}
  <div class="glass rounded-2xl p-8 text-center border border-white/5">
    <div class="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
    <p class="text-sm text-slate-400">Cargando convivencia...</p>
  </div>
{:else if consolidado.length === 0}
  <div class="glass rounded-2xl p-8 text-center border border-white/5">
    <svg class="w-10 h-10 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
    <p class="text-sm text-slate-400">No hay registros de convivencia</p>
  </div>
{:else}
  <div class="space-y-4">
  {#each consolidado as cons, index}
    {@const tipo = cons.cv_tipoFalta || cons.tipoFalta || ''}
    {@const desc = cons.cv_descripcionSituacion || cons.descripcionSituacion || cons.cv_positivos || ''}
    {@const faltas = cons.cv_faltas || cons.faltas || ''}
    {@const isTipo = tipo.toUpperCase().includes('TIPO')}
    {@const isPositivo = tipo.toUpperCase().includes('POSITIVO')}
    {@const preview = (desc || faltas).slice(0, 170)}
    {@const cardColor = isTipo ? 'red' : isPositivo ? 'emerald' : 'amber'}
    <div class="glass rounded-2xl p-5 border animate-slide-up {isTipo ? 'border-red-500/30' : isPositivo ? 'border-emerald-500/30' : 'border-amber-500/30'}" style="animation-delay: {index * 50}ms">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-12 h-12 rounded-xl {isTipo ? 'bg-red-500/20' : isPositivo ? 'bg-emerald-500/20' : 'bg-amber-500/20'} flex items-center justify-center flex-shrink-0">
          {#if isTipo}
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          {:else if isPositivo}
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {:else}
            <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          {/if}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold {isTipo ? 'text-red-300' : isPositivo ? 'text-emerald-300' : 'text-amber-300'}">{fixLabel(tipo)}</p>
          {#if desc}
            <p class="text-xs text-slate-400 leading-relaxed mt-1">{fixLabel(desc.slice(0, 170))}{desc.length > 170 ? '...' : ''}</p>
          {/if}
          <div class="flex items-center gap-2 mt-1">
            <span class="text-[11px] text-slate-400 flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              {cons.cv_fecha || cons.fecha}
            </span>
            {#if cons.cv_hora || cons.hora}
              <span class="text-slate-600">|</span>
              <span class="text-[11px] text-slate-400 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {cons.cv_hora || cons.hora}
              </span>
            {/if}
          </div>
        </div>
      </div>

      {#if cons.cv_docente || cons.cv_asignatura}
        <div class="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-white/5">
          <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <p class="text-xs text-slate-300 truncate">{cons.cv_docente}</p>
          {#if cons.cv_asignatura}
            <span class="text-slate-600">-</span>
            <p class="text-xs text-slate-400 truncate">{cons.cv_asignatura}</p>
          {/if}
        </div>
      {/if}

      <button class="w-full mt-1 rounded-xl px-4 py-2.5 text-xs font-semibold {isTipo ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : isPositivo ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'} active:scale-[0.98] transition-all flex items-center justify-center gap-2" onclick={() => openDetail(cons)}>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        Ver detalle
      </button>
    </div>
  {/each}
  </div>
{/if}
