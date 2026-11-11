<script lang="ts">
  import Composer from './Composer.svelte'
  import PostCard from './PostCard.svelte'
  import ModPanel from './ModPanel.svelte'
  import { onMount } from 'svelte'
  import { socialApi, tiempoRelativo, type SocialPost, type SocialSesion } from '$lib/services/social'
  import { REACCIONES, totalesDe, pluralizar } from '$lib/social/acciones'
  import { trackPageView, trackEvent } from '$lib/analytics'
  import Swal from 'sweetalert2'
  import { swalTheme } from '$lib/theme.svelte'

  let {
    sesion = null,
    origen = 'login',
    onVolver,
    onSalirRed,
    onSolicitarLogin,
  }: {
    sesion?: SocialSesion | null
    /** 'notas' cuando se abrio desde el panel; 'login' desde la pantalla de acceso. */
    origen?: 'login' | 'notas'
    onVolver: () => void
    onSalirRed: () => void
    onSolicitarLogin?: () => void
  } = $props()

  let posts = $state<SocialPost[]>([])
  let misPendientes = $state<SocialPost[]>([])
  let cargando = $state(true)
  let error = $state('')
  let vista = $state<'feed' | 'acceso'>('feed')
  let pestaña = $state<'todas' | 'mias'>('todas')
  /** Codigo del docente activo: permite reaccionar y comentar desde el feed. */
  let modCodeActivo = $state<string | null>(null)

  const invitado = $derived(!sesion)

  const tituloSaludo = $derived(
    (() => {
      const h = new Date().getHours()
      if (h < 12) return 'Buenos dias'
      if (h < 18) return 'Buenas tardes'
      return 'Buenas noches'
    })(),
  )

  const nombrePila = $derived(
    (() => {
      if (!sesion) return ''
      // El formato del colegio es APELLIDO1 APELLIDO2 NOMBRES...
      const partes = sesion.nombres.trim().split(/\s+/)
      const nombre = partes.length >= 3 ? partes.slice(2).join(' ') : partes[0]
      return nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase()
    })(),
  )

  onMount(() => {
    trackPageView('social_feed', { invitado: !sesion })
    cargar()
  })

  async function cargar() {
    cargando = true
    error = ''

    // Red de seguridad: pase lo que pase, el indicador de carga se apaga.
    const seguro = setTimeout(() => {
      if (cargando) {
        cargando = false
        if (!error) error = 'La red social esta tardando demasiado. Intenta de nuevo.'
      }
    }, 25000)

    try {
      // El feed es publico: se lee sin iniciar sesion.
      const feed = await socialApi.feed(sesion?.estudiante)
      posts = feed.posts

      // Lo pendiente solo aplica a estudiantes con sesion.
      if (sesion) {
        const mios = await socialApi
          .misPendientes(sesion.estudiante, sesion.token)
          .catch(() => ({ ok: true, posts: [] as SocialPost[], comentarios: [] as SocialPost[] }))
        misPendientes = mios.posts ?? []
      } else {
        misPendientes = []
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo cargar la red social'
    } finally {
      clearTimeout(seguro)
      cargando = false
    }
  }

  function pedirLogin() {
    trackEvent('social_pide_login')
    onSolicitarLogin?.()
  }

  async function salirRed() {
    const r = await Swal.fire({
      title: 'Salir de la red social',
      text: 'Volveras a la pantalla de acceso.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6366f1',
      ...swalTheme(),
    })
    if (!r.isConfirmed) return
    trackEvent('social_logout')
    onSalirRed()
  }

  function irAModeracion() {
    vista = 'acceso'
    trackPageView('social_moderacion')
  }

  /**
   * Entra al feed con el codigo del docente ya validado. Asi puede reaccionar
   * y comentar aportando el codigo, sin necesidad de una sesion de estudiante.
   */
  function activarModoDocente(code: string) {
    modCodeActivo = code
    vista = 'feed'
    trackEvent('social_feed_docente')
    cargar()
  }

  function salirModoDocente() {
    modCodeActivo = null
    vista = 'acceso'
  }

  const visibles = $derived(
    pestaña === 'mias' && sesion
      ? posts.filter((p) => p.autor_nombre === sesion.nombres)
      : posts,
  )

  /** Totales de lo que se esta mostrando (reacciones y comentarios). */
  const totales = $derived(totalesDe(visibles))

  /** Desglose de esos totales por tipo de reaccion, para el resumen. */
  const totalesPorTipo = $derived(
    REACCIONES.map((r) => ({ ...r, conteo: totales.porTipo[r.tipo] ?? 0 })).filter(
      (r) => r.conteo > 0,
    ),
  )

  function verTotales() {
    const filas = totalesPorTipo.length
      ? totalesPorTipo.map((r) => `<li>${r.icono} ${r.etiqueta}: ${r.conteo}</li>`).join('')
      : '<li>Todavia no hay reacciones</li>'

    Swal.fire({
      title: 'Totales de la red social',
      html:
        `<div style="text-align:left;font-size:13px;line-height:1.9">` +
        `<p><strong>${pluralizar(totales.reacciones, 'reaccion', 'reacciones')}</strong></p>` +
        `<ul style="margin:0 0 12px 18px;padding:0">${filas}</ul>` +
        `<p><strong>${pluralizar(totales.comentarios, 'comentario', 'comentarios')}</strong></p>` +
        `<p style="margin:0;opacity:.7">Sobre las ${pluralizar(visibles.length, 'publicacion aprobada', 'publicaciones aprobadas')} que se estan mostrando.</p>` +
        `</div>`,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#6366f1',
      ...swalTheme(),
    })
  }
</script>

{#if vista === 'acceso'}
  <ModPanel
    onSalir={() => (vista = 'feed')}
    onVerFeed={activarModoDocente}
  />
{:else}
  <nav class="sticky top-0 z-50 glass-strong border-b border-white/5">
    <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
      {#if modCodeActivo}
        <button
          onclick={salirModoDocente}
          class="px-3 py-1.5 rounded-xl text-xs font-bold glass border-amber-500/40 text-amber-400 transition-all"
        >
          Panel
        </button>
      {:else}
        <button onclick={onVolver} class="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span class="text-xs font-semibold">Notas</span>
        </button>
      {/if}

      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20">
          <img src="escudo.png" alt="Colegio" class="w-full h-full object-contain" />
        </div>
        <span class="text-sm font-bold text-white">Social</span>
      </div>

      <div class="flex items-center gap-1">
        <button
          onclick={irAModeracion}
          class="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-all"
          title="Panel de moderacion (docentes)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </button>

        {#if sesion && origen === 'notas'}
          <button
            onclick={salirRed}
            class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Cerrar sesion"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        {:else if !sesion}
          <button
            onclick={pedirLogin}
            class="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
          >
            Entrar
          </button>
        {/if}
      </div>
    </div>
  </nav>

  <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
    {#if modCodeActivo}
      <div class="mb-4 glass rounded-2xl p-3 border-l-2 border-amber-400/60 flex items-center gap-2">
        <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12 12 0 0112 21a12 12 0 01-6.16-10.42L12 14z" />
        </svg>
        <p class="text-[11px] font-bold text-amber-400 flex-1">
          Modo docente
          <span class="font-normal text-slate-500">· puedes reaccionar y comentar</span>
        </p>
        <button
          onclick={salirModoDocente}
          class="px-2.5 py-1 rounded-lg text-[10px] font-semibold glass border-white/10 text-slate-300 hover:text-white transition-all"
        >
          Volver al panel
        </button>
      </div>
    {/if}

    <div class="mb-5">
      {#if sesion}
        <h1 class="text-xl font-extrabold text-white">{tituloSaludo}, {nombrePila}</h1>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Red social del colegio · contenido revisado por docentes
        </p>
      {:else}
        <h1 class="text-xl font-extrabold text-white">Red Social del Colegio</h1>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Estas viendo el contenido publico · inicia sesion para publicar y comentar
        </p>
      {/if}
    </div>

    {#if sesion}
      <Composer {sesion} publicar={cargar} />
    {:else}
      <button
        onclick={pedirLogin}
        class="w-full glass rounded-3xl p-4 sm:p-5 glow-card flex items-center gap-3 text-left hover:border-indigo-500/40 transition-all group"
      >
        <div class="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <span class="flex-1 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
          Comparte algo con tus companeros...
        </span>
        <span class="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500 text-white group-hover:bg-indigo-600 transition-colors">
          Entrar
        </span>
      </button>
    {/if}

    {#if sesion && misPendientes.length > 0}
      <div class="mt-5 glass rounded-2xl p-4 border-l-2 border-amber-400/60">
        <p class="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          En revision ({misPendientes.length})
        </p>
        <div class="space-y-2">
          {#each misPendientes as p (p.id)}
            <div class="text-xs">
              <p class="text-slate-300 truncate">{p.contenido || '(imagen)'}</p>
              {#if p.estado === 'rechazado'}
                <p class="text-[10px] text-red-400">
                  Rechazado{p.motivo_rechazo ? `: ${p.motivo_rechazo}` : ''} · {tiempoRelativo(p.created_at)}
                </p>
              {:else}
                <p class="text-[10px] text-slate-500">Pendiente de aprobacion · {tiempoRelativo(p.created_at)}</p>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if sesion}
      <div class="mt-5 flex rounded-2xl glass border-white/10 p-1">
        <button
          onclick={() => { pestaña = 'todas'; trackEvent('social_tab', { tab: 'todas' }) }}
          class="flex-1 py-2 rounded-xl text-xs font-semibold transition-all {pestaña === 'todas' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}"
        >
          Todas
        </button>
        <button
          onclick={() => { pestaña = 'mias'; trackEvent('social_tab', { tab: 'mias' }) }}
          class="flex-1 py-2 rounded-xl text-xs font-semibold transition-all {pestaña === 'mias' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}"
        >
          Mis publicaciones
        </button>
      </div>
    {/if}

    {#if !cargando && !error}
      <!-- Totales de lo mostrado: reacciones y comentarios, siempre visibles -->
      <button
        onclick={verTotales}
        class="mt-4 w-full glass rounded-2xl px-4 py-2.5 flex items-center gap-3 text-[11px] hover:border-indigo-500/40 transition-all"
        title="Ver el desglose de reacciones"
      >
        <span class="flex items-center gap-1.5 text-slate-300">
          {#if totalesPorTipo.length > 0}
            <span class="flex items-center">
              {#each totalesPorTipo.slice(0, 4) as r, i (r.tipo)}
                <span
                  class="w-5 h-5 rounded-full bg-slate-800 ring-2 ring-[var(--app-glass-bg)] flex items-center justify-center text-[10px]"
                  style="margin-left: {i === 0 ? 0 : -5}px; z-index: {10 - i}"
                  title="{r.etiqueta}: {r.conteo}"
                >
                  {r.icono}
                </span>
              {/each}
            </span>
          {:else}
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          {/if}
          <span class="font-semibold">{pluralizar(totales.reacciones, 'reaccion', 'reacciones')}</span>
        </span>

        <span class="flex items-center gap-1.5 text-slate-400">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span class="font-semibold">{pluralizar(totales.comentarios, 'comentario', 'comentarios')}</span>
        </span>

        <span class="ml-auto text-slate-500">{pluralizar(visibles.length, 'publicacion', 'publicaciones')}</span>
      </button>
    {/if}

    {#if cargando}
      <div class="mt-5 space-y-3">
        {#each [1, 2] as i}
          <div class="glass rounded-3xl p-5 animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-white/10"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3 w-32 rounded bg-white/10"></div>
                <div class="h-2 w-20 rounded bg-white/5"></div>
              </div>
            </div>
            <div class="mt-4 space-y-2">
              <div class="h-3 w-full rounded bg-white/10"></div>
              <div class="h-3 w-2/3 rounded bg-white/10"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if error}
      <div class="mt-5 glass rounded-3xl p-8 text-center">
        <svg class="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-2.99l-6.93-12a2 2 0 00-3.48 0l-6.93 12A2 2 0 005.07 19z" />
        </svg>
        <p class="text-sm text-slate-300">{error}</p>
        <button
          onclick={cargar}
          class="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    {:else}
      {#if visibles.length === 0}
        <div class="mt-5 glass rounded-3xl p-10 text-center">
          <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          <p class="text-sm text-slate-400">
            {pestaña === 'mias' ? 'Todavia no tienes publicaciones aprobadas' : 'Todavia no hay publicaciones aprobadas'}
          </p>
          <p class="text-[11px] text-slate-500 mt-1">Se el primero en compartir algo con el colegio</p>
        </div>
      {:else}
        <div class="mt-5 space-y-4">
          {#each visibles as post (post.id)}
            <PostCard
              {post}
              {sesion}
              modCode={modCodeActivo}
              onCambio={cargar}
              onSolicitarLogin={pedirLogin}
            />
          {/each}
        </div>
      {/if}
    {/if}
  </div>
{/if}
