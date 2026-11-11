<script lang="ts">
  import { socialApi, nombreCorto, tiempoRelativo, type SocialPost } from '$lib/services/social'
  import { definicion, desgloseOrdenado } from '$lib/social/acciones'
  import Composer from './Composer.svelte'
  import { trackEvent } from '$lib/analytics'
  import Swal from 'sweetalert2'
  import { swalTheme } from '$lib/theme.svelte'

  let {
    onSalir,
    onVerFeed,
    sesion = null,
    modCodeInicial = null,
  }: {
    onSalir: () => void
    /** Lleva al feed en modo docente, para reaccionar y comentar. */
    onVerFeed?: (modCode: string) => void
    /** Sesion de estudiante, si la hay. El docente publica con su codigo. */
    sesion?: { estudiante: string; nombres: string; token: string } | null
    /** Codigo ya validado por el componente padre, para no volver a pedirlo. */
    modCodeInicial?: string | null
  } = $props()

  const STORAGE_KEY = 'notasie_mod_code'

  // Se inicializa vacio a proposito: el $effect de abajo decide con que codigo
  // entrar (el que ya valido el padre, o el guardado en este dispositivo).
  let modCode = $state('')
  let autenticado = $state(false)
  let verificando = $state(false)
  let error = $state('')

  let items = $state<SocialPost[]>([])
  let cargando = $state(false)
  let tipo = $state<'posts' | 'comentarios'>('posts')
  let estado = $state<'pendiente' | 'aprobado' | 'rechazado'>('pendiente')
  let imagenAmpliada = $state<string | null>(null)
  let intentado = false

async function entrar(code: string) {
  if (code.trim() === '') return
  verificando = true
  error = ''
  try {
    await socialApi.modLogin(code.trim())
    modCode = code.trim()
    autenticado = true
    try {
      localStorage.setItem(STORAGE_KEY, modCode)
    } catch {
      /* almacenamiento no disponible */
    }
    trackEvent('social_mod_login')
    await cargar()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Codigo incorrecto'
  } finally {
    verificando = false
  }
}

async function cargar() {
  cargando = true
  try {
    const r = await socialApi.modListar(modCode, tipo, estado)
    items = r.items
  } catch (e) {
    // Si la clave dejo de ser valida (o el secret cambio), se vuelve al acceso.
    autenticado = false
    error = e instanceof Error ? e.message : 'No se pudo cargar'
    items = []
  } finally {
    cargando = false
  }
}

async function cambiarTipo(t: 'posts' | 'comentarios') {
  tipo = t
  await cargar()
}

async function cambiarEstado(e: 'pendiente' | 'aprobado' | 'rechazado') {
  estado = e
  await cargar()
}

async function aprobar(item: SocialPost) {
  try {
    await socialApi.modAprobar(modCode, item.id, tipo === 'comentarios' ? 'comentario' : 'post')
    trackEvent('social_mod_aprobar', { tipo })
    items = items.filter((i) => i.id !== item.id)
  } catch (e) {
    Swal.fire({ title: 'Error', text: e instanceof Error ? e.message : '', icon: 'error', ...swalTheme(), iconColor: '#ef4444', confirmButtonColor: '#6366f1' })
  }
}

async function rechazar(item: SocialPost) {
  const r = await Swal.fire({
    title: 'Rechazar',
    input: 'text',
    inputPlaceholder: 'Motivo (opcional, lo vera el estudiante)',
    showCancelButton: true,
    confirmButtonText: 'Rechazar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    ...swalTheme(),
  })
  if (!r.isConfirmed) return

  try {
    await socialApi.modRechazar(
      modCode,
      item.id,
      tipo === 'comentarios' ? 'comentario' : 'post',
      String(r.value ?? ''),
    )
    trackEvent('social_mod_rechazar', { tipo })
    items = items.filter((i) => i.id !== item.id)
  } catch (e) {
    Swal.fire({ title: 'Error', text: e instanceof Error ? e.message : '', icon: 'error', ...swalTheme(), iconColor: '#ef4444', confirmButtonColor: '#6366f1' })
  }
}

async function borrar(item: SocialPost) {
  const r = await Swal.fire({
    title: 'Eliminar definitivamente',
    text: 'Se borra la publicacion y sus comentarios. No se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    ...swalTheme(),
  })
  if (!r.isConfirmed) return

  try {
    await socialApi.modBorrar(modCode, item.id)
    trackEvent('social_mod_borrar')
    items = items.filter((i) => i.id !== item.id)
  } catch (e) {
    Swal.fire({ title: 'Error', text: e instanceof Error ? e.message : '', icon: 'error', ...swalTheme(), iconColor: '#ef4444', confirmButtonColor: '#6366f1' })
  }
}

function cerrarSesionMod() {
  autenticado = false
  modCode = ''
  items = []
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignorar */
  }
}

$effect(() => {
  // Entra automaticamente con el codigo ya validado por el padre, o con el que
  // haya quedado guardado en este dispositivo, para no pedirlo cada vez.
  if (intentado) return
  intentado = true

  const candidato = modCodeInicial ?? leerGuardado()
  if (candidato) {
    modCode = candidato
    entrar(candidato)
  }
})

function leerGuardado(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}
</script>

{#if imagenAmpliada}
  <div
    class="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
    role="button"
    tabindex="0"
    onclick={() => (imagenAmpliada = null)}
    onkeydown={(e) => e.key === 'Escape' && (imagenAmpliada = null)}
  >
    <img src={imagenAmpliada} alt="" class="max-w-full max-h-full object-contain rounded-2xl" />
  </div>
{/if}

<div class="max-w-2xl mx-auto px-4 py-6">
  <div class="flex items-center justify-between mb-5">
    <div>
      <h2 class="text-lg font-bold text-white">Panel de moderacion</h2>
      <p class="text-[11px] text-slate-500">Aprueba o rechaza el contenido antes de que sea publico</p>
    </div>
    <button
      onclick={autenticado ? cerrarSesionMod : onSalir}
      class="px-3 py-2 rounded-xl glass border-white/10 text-xs text-slate-300 hover:text-white transition-all"
    >
      {autenticado ? 'Salir' : 'Volver'}
    </button>
  </div>

  {#if !autenticado}
    <div class="glass-strong rounded-3xl p-6 glow-card">
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 class="text-sm font-bold text-white text-center">Acceso para docentes</h3>
      <p class="text-[11px] text-slate-500 text-center mt-1 mb-5">Ingresa el codigo de moderador del colegio</p>

      <input
        bind:value={modCode}
        type="password"
        placeholder="Codigo de moderador"
        class="w-full rounded-2xl glass border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        onkeydown={(e) => e.key === 'Enter' && entrar(modCode)}
      />

      {#if error}
        <p class="mt-2 text-xs text-red-400">{error}</p>
      {/if}

      <button
        onclick={() => entrar(modCode)}
        disabled={verificando || modCode.trim() === ''}
        class="mt-4 w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-40"
      >
        {verificando ? 'Verificando...' : 'Entrar'}
      </button>
    </div>
  {:else}
    <div class="flex items-center gap-2 mb-4">
      <div class="flex rounded-2xl glass border-white/10 p-1">
        <button
          onclick={() => cambiarTipo('posts')}
          class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all {tipo === 'posts' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}"
        >
          Publicaciones
        </button>
        <button
          onclick={() => cambiarTipo('comentarios')}
          class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all {tipo === 'comentarios' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}"
        >
          Comentarios
        </button>
      </div>
      <button
        onclick={cargar}
        class="ml-auto p-2 rounded-xl glass border-white/10 text-slate-400 hover:text-white transition-all"
        title="Actualizar"
      >
        <svg class="w-4 h-4 {cargando ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    {#if tipo === 'posts'}
      <div class="flex rounded-2xl glass border-white/10 p-1 mb-4">
        {#each [['pendiente', 'Pendientes'], ['aprobado', 'Aprobadas'], ['rechazado', 'Rechazadas']] as [valor, etiqueta]}
          <button
            onclick={() => cambiarEstado(valor as 'pendiente' | 'aprobado' | 'rechazado')}
            class="flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all {estado === valor ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}"
          >
            {etiqueta}
          </button>
        {/each}
      </div>

      <!-- El docente puede publicar avisos; salen aprobados al instante. -->
      <div class="mb-3">
        <Composer sesion={null} {modCode} publicar={cargar} />
      </div>

      <!-- Para reaccionar y comentar hay que ir al feed, donde esta el contexto. -->
      <button
        onclick={() => onVerFeed?.(modCode)}
        class="w-full mb-5 flex items-center gap-2 px-4 py-3 rounded-2xl glass border-white/10 text-xs font-semibold text-slate-300 hover:text-indigo-400 hover:border-indigo-500/40 transition-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
        Ir al feed para reaccionar y comentar como docente
        <svg class="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    {/if}

    {#if cargando}
      <div class="glass rounded-3xl p-8 text-center">
        <div class="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto"></div>
      </div>
    {:else if items.length === 0}
      <div class="glass rounded-3xl p-8 text-center">
        <svg class="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-slate-400">No hay elementos en esta bandeja</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each items as item (item.id)}
          <div class="glass rounded-2xl p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-semibold text-white">{nombreCorto(item.autor_nombre)}</span>
              <span class="text-[10px] text-slate-500">{tiempoRelativo(item.created_at)}</span>
              {#if item.reportes && item.reportes > 0}
                <span class="ml-auto px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">
                  {item.reportes} reporte{item.reportes > 1 ? 's' : ''}
                </span>
              {/if}
            </div>

            {#if item.post_contenido}
              <p class="text-[10px] text-slate-500 mb-1 truncate">En: {item.post_contenido}</p>
            {/if}

            <p class="text-sm text-slate-200 whitespace-pre-wrap break-words">{item.contenido}</p>

            {#if item.imagen}
              <button class="mt-3 block w-full rounded-xl overflow-hidden border border-white/10" onclick={() => (imagenAmpliada = item.imagen)}>
                <img src={item.imagen} alt="" class="w-full max-h-64 object-cover" loading="lazy" />
              </button>
            {/if}

            {#if item.motivo_rechazo}
              <p class="mt-2 text-[11px] text-red-400">Motivo enviado: {item.motivo_rechazo}</p>
            {/if}

            {#if tipo === 'posts' && estado === 'pendiente'}
              <div class="mt-3 flex items-center gap-2">
                <button
                  onclick={() => aprobar(item)}
                  class="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  Aprobar
                </button>
                <button
                  onclick={() => rechazar(item)}
                  class="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  Rechazar
                </button>
                <button
                  onclick={() => borrar(item)}
                  class="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all"
                  title="Eliminar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            {:else if tipo === 'comentarios'}
              <div class="mt-3 flex items-center gap-2">
                <button
                  onclick={() => aprobar(item)}
                  class="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  Aprobar
                </button>
                <button
                  onclick={() => rechazar(item)}
                  class="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  Rechazar
                </button>
              </div>
            {:else}
              <div class="mt-3">
                <button
                  onclick={() => borrar(item)}
                  class="w-full py-2 rounded-xl text-xs font-bold glass border-white/10 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Eliminar publicacion
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
