<script lang="ts">
  import type { Nota } from '$lib/types'
  import { gradesApi } from '$lib/services/api'
  import ModalNotas from '../modals/ModalNotas.svelte'
  import ModalInas from '../modals/ModalInas.svelte'
  import ModalExcusas from '../modals/ModalExcusas.svelte'
  import ModalDescripcion from '../modals/ModalDescripcion.svelte'
  import MensajeAlProfesor from '../modals/MensajeAlProfesor.svelte'

  let { notas = [], notasDetalladas = {}, estudiante = '', periodo = '', nivel = '', asignacion = '', nombres = '', HED = '', numero = '' }: {
    notas: Nota[]; notasDetalladas?: Record<string, any[]>; estudiante: string; periodo: string; nivel: string; asignacion?: string; nombres?: string; HED?: string; numero?: string
  } = $props()

  let activeModal = $state('')
  let notaSel = $state<any>(null)
  let openMensaje = $state(false)
  let notaMensaje = $state<any>(null)
  let infoAcadMap = $state<Record<string, { desempeno: string; descripcion: string }>>({})
  let infoAcadLoading = $state(false)

  const STORAGE_KEY = 'notasie_favorites'
  let favorites = $state<string[]>([])

  function loadFavorites() {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY}_${estudiante}`)
      favorites = data ? JSON.parse(data) : []
    } catch { favorites = [] }
  }

  function toggleFav(asignatura: string) {
    const idx = favorites.indexOf(asignatura)
    if (idx >= 0) {
      favorites = favorites.filter(f => f !== asignatura)
    } else {
      favorites = [...favorites, asignatura]
    }
    try { localStorage.setItem(`${STORAGE_KEY}_${estudiante}`, JSON.stringify(favorites)) } catch {}
  }

  $effect(() => { if (estudiante) loadFavorites() })

  $effect(() => {
    if (notas.length === 0 || !periodo || !asignacion || !nivel) return
    infoAcadLoading = true
    const nivelInt = parseInt(nivel) || 0
    const grado = `${nivel}-${numero}`
    Promise.all(
      notas.map(async (n) => {
        const valoract = parseFloat(n.valoracion) || 0
        const result = await gradesApi.getInfoAcad(asignacion, nivelInt, valoract, n.asignatura, periodo, HED, grado)
        return { asignatura: n.asignatura, ...result }
      })
    ).then((results) => {
      const map: Record<string, { desempeno: string; descripcion: string }> = {}
      for (const r of results) map[r.asignatura] = { desempeno: r.desempeno, descripcion: r.descripcion }
      infoAcadMap = map
      infoAcadLoading = false
    }).catch(() => { infoAcadLoading = false })
  })

  let notasSorted = $derived(() => {
    const favSet = new Set(favorites)
    return [...notas].sort((a, b) => {
      const af = favSet.has(a.asignatura) ? 0 : 1
      const bf = favSet.has(b.asignatura) ? 0 : 1
      return af - bf
    })
  })

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

  const desempenoColor = (d: string) => {
    const v = d.toUpperCase()
    if (v === 'SUPERIOR' || v === 'ALTO') return 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
    if (v === 'BASICO') return 'bg-amber-500/15 border-amber-500/25 text-amber-300'
    if (v === 'BAJO') return 'bg-red-500/15 border-red-500/25 text-red-300'
    return 'bg-white/10 border-white/10 text-slate-300'
  }

  // Obtener la menor nota real de las notas detalladas del estudiante
  function getMinorInfo(nota: any): { menor: string; aspecto: string; hasData: boolean } {
    const det = notasDetalladas[nota.asignatura]
    if (!det || det.length === 0)
      return { menor: '', aspecto: '', hasData: false }

    let menor = Infinity
    let aspecto = ''
    for (const d of det) {
      const val = parseFloat(d.Nota)
      if (!isNaN(val) && val > 0 && val < menor) {
        menor = val
        aspecto = d.Aspecto || ''
      }
    }
    return { menor: menor === Infinity ? '' : menor.toFixed(1), aspecto, hasData: menor !== Infinity }
  }
</script>

{#if activeModal === 'notas' && notaSel}
  <ModalNotas {estudiante} asignatura={notaSel.asignatura} docente={notaSel.docente} {periodo} onClose={(t) => { close() }} />
{/if}
{#if activeModal === 'inas' && notaSel}
  <ModalInas {estudiante} asignatura={notaSel.asignatura} {periodo} total={parseInt(notaSel.cantidadInasistencias)} onClose={(t) => { close() }} />
{/if}
{#if activeModal === 'excusas'}
  <ModalExcusas {estudiante} {periodo} total={notas.reduce((a, n) => a + (Number(n.cantidadInasistencias) || 0), 0)} onClose={(t) => { close() }} />
{/if}
{#if activeModal === 'desc' && notaSel}
  <ModalDescripcion {estudiante} asignatura={notaSel.asignatura} valoracion={notaSel.valoracion} {periodo} docente={notaSel.docente} onClose={(t) => { close() }} />
{/if}
{#if openMensaje && notaMensaje}
  <MensajeAlProfesor docente={notaMensaje.docente} asignatura={notaMensaje.asignatura} onClose={() => { openMensaje = false; notaMensaje = null }} />
{/if}

<div class="space-y-3 relative">
  {#if infoAcadLoading}
    <div class="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-2xl">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
        <span class="text-xs text-slate-300">Cargando info academica...</span>
      </div>
    </div>
  {/if}
  {#each notasSorted() as nota, i}
    {@const menorInfo = getMinorInfo(nota)}
    {@const showWarning = menorInfo.hasData && parseFloat(menorInfo.menor) < 3}
    {@const isFav = favorites.includes(nota.asignatura)}
    <div class="glass rounded-2xl overflow-hidden border animate-slide-up {isFav ? 'border-amber-500/30' : 'border-white/5'}" style="animation-delay: {i * 50}ms">
      <div class="p-4">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-QhvfavmoGfPmREwwvl4XtqTIORARDz.png" alt="" class="w-8 h-8 object-contain flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm font-bold text-white truncate">{nota.asignatura}</h4>
                {#if menorInfo.hasData}
                  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md {parseFloat(menorInfo.menor) < 3 ? 'bg-red-500/15 border border-red-500/20' : 'bg-white/5 border border-white/5'}">
                    <span class="text-[9px] {parseFloat(menorInfo.menor) < 3 ? 'text-red-400' : 'text-slate-400'}">menor:</span>
                    <span class="text-[9px] font-bold {parseFloat(menorInfo.menor) < 3 ? 'text-red-400' : 'text-slate-300'}">{menorInfo.menor}</span>
                    {#if menorInfo.aspecto}
                      <span class="text-[8px] text-slate-500 hidden sm:inline">({menorInfo.aspecto})</span>
                    {/if}
                  </span>
                {/if}
              </div>
              <p class="text-xs text-slate-400 mt-0.5 truncate">{nota.docente}</p>
              {#if infoAcadMap[nota.asignatura]?.desempeno}
                <div class="mt-1.5 px-2 py-1 rounded-lg border {desempenoColor(infoAcadMap[nota.asignatura].desempeno)}">
                  <span class="text-[10px] font-bold uppercase">{infoAcadMap[nota.asignatura].desempeno}</span>
                  {#if infoAcadMap[nota.asignatura]?.descripcion}
                    <p class="text-[9px] text-slate-400 mt-0.5 leading-tight">{infoAcadMap[nota.asignatura].descripcion}</p>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button class="p-1.5 rounded-lg transition-all {isFav ? 'bg-amber-500/20' : 'bg-white/5 hover:bg-white/10'}" onclick={() => toggleFav(nota.asignatura)}>
              {#if isFav}
                <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {:else}
                <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
              {/if}
            </button>
            <div class="relative group">
              {#if showWarning}
                <div class="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40 animate-pulse">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                </div>
              {/if}
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br {gradeColor(nota.valoracion)} flex items-center justify-center shadow-lg {showWarning ? 'relative overflow-hidden' : ''}">
                {#if showWarning}<div class="absolute inset-0 border-2 border-red-500/50 rounded-xl"></div>{/if}
                <span class="text-sm font-bold text-white">{fmt(nota.valoracion)}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-1.5">
          <button class="flex-1 py-2 rounded-xl text-[10px] font-semibold glass text-indigo-300 hover:bg-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1" onclick={() => show('notas', nota)}>
            <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-QhvfavmoGfPmREwwvl4XtqTIORARDz.png" alt="" class="w-3.5 h-3.5 object-contain" />
            Notas
          </button>
          <button class="flex-1 py-2 rounded-xl text-[10px] font-semibold glass text-cyan-300 hover:bg-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-1" onclick={() => show('inas', nota)}>
            <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-CK4odMSKWdmIj0ueBtNq9HOZR6Fbgv.png" alt="" class="w-3.5 h-3.5 object-contain" />
            {nota.cantidadInasistencias || '0'}
          </button>
          <button class="flex-1 py-2 rounded-xl text-[10px] font-semibold glass text-purple-300 hover:bg-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-1" onclick={() => show('desc', nota)}>
            <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-rCHVjln5KLUOliL1uQIEtzhjuvyC3F.png" alt="" class="w-3.5 h-3.5 object-contain" />
            Desc
          </button>
          <button class="flex-1 py-2 rounded-xl text-[10px] font-semibold glass text-pink-300 hover:bg-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-1" onclick={() => { openMensaje = true; notaMensaje = nota }}>
            <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-lp9vjuXTCqeB9yhVXBoBmyqdy8e9jv.png" alt="" class="w-3.5 h-3.5 object-contain" />
            Mensaje
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
