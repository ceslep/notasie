<script lang="ts">
  import {
    socialApi,
    nombreCorto,
    tiempoRelativo,
    type SocialPost,
    type SocialComentario,
  } from '$lib/services/social'
  import {
    REACCIONES,
    definicion,
    desgloseOrdenado,
    resumenReacciones,
    pluralizar,
  } from '$lib/social/acciones'
  import { trackEvent } from '$lib/analytics'
  import Swal from 'sweetalert2'
  import { swalTheme } from '$lib/theme.svelte'

  let {
    post,
    sesion = null,
    modCode = null,
    onCambio,
    onSolicitarLogin,
  }: {
    post: SocialPost
    sesion?: { estudiante: string; nombres: string; token: string } | null
    /** Codigo del docente: le permite reaccionar y comentar desde el panel. */
    modCode?: string | null
    onCambio?: () => void
    onSolicitarLogin?: () => void
  } = $props()

  let reacciones = $state<Record<string, number>>({})
  let totalReacciones = $state(0)
  let miReaccion = $state<string | null>(null)
  let comentarios = $state<SocialComentario[]>([])
  let totalComentarios = $state(0)
  let mostrarComentarios = $state(false)
  let cargandoComentarios = $state(false)
  let nuevoComentario = $state('')
  let enviandoComentario = $state(false)
  let imagenAmpliada = $state(false)

  /** Copia local del texto y del rastro de edicion, para reflejar cambios al instante. */
  let textoPost = $state('')
  let editado = $state(false)
  let editadoPor = $state<string | null>(null)
  let guardandoEdicion = $state(false)

  // Selector de reacciones
  let menuAbierto = $state(false)
  let temporizadorMenu: ReturnType<typeof setTimeout> | undefined
  let enviandoReaccion = $state(false)

  // Sincroniza el estado local cuando llega una lista nueva desde el feed.
  $effect(() => {
    reacciones = post.reacciones ?? {}
    totalReacciones = post.total_reacciones ?? 0
    miReaccion = post.yo_reaccion ?? null
    totalComentarios = Number(post.comentarios ?? 0)
    textoPost = post.contenido ?? ''
    editado = Boolean(post.editado)
    editadoPor = post.editado_por ?? null
  })

  const esMio = $derived(Boolean(sesion) && post.autor_nombre === sesion?.nombres)
  const esDocente = $derived(post.autor_nombre === 'Docente')
  const autor = $derived(esDocente ? 'Docente' : nombreCorto(post.autor_nombre))
  const grado = $derived(post.nivel && post.numero ? `${post.nivel}-${post.numero}` : '')
  const miDefinicion = $derived(definicion(miReaccion))
  const desglose = $derived(desgloseOrdenado(reacciones))
  /** Sin sesion de estudiante, pero con codigo de docente, se puede interactuar. */
  const esDocenteActivo = $derived(Boolean(modCode))
  const invitado = $derived(!sesion && !esDocenteActivo)

  function abrirMenu() {
    clearTimeout(temporizadorMenu)
    menuAbierto = true
  }

  function cerrarMenuConRetraso() {
    clearTimeout(temporizadorMenu)
    temporizadorMenu = setTimeout(() => (menuAbierto = false), 350)
  }

  /** Pulsacion corta: repite la ultima reaccion usada o pone "Me gusta". */
  function reaccionRapida() {
    if (invitado) return pedirLogin()
    const tipo = miReaccion ?? 'me_gusta'
    reaccionar(tipo)
  }

  function pedirLogin() {
    menuAbierto = false
    onSolicitarLogin?.()
  }

  async function reaccionar(tipo: string) {
    if (invitado) return pedirLogin()
    if (enviandoReaccion || !sesion) return

    menuAbierto = false
    enviandoReaccion = true

    // Actualizacion optimista para que el toque se sienta inmediato.
    const anterior = { reacciones: { ...reacciones }, total: totalReacciones, mia: miReaccion }

    const copia = { ...reacciones }
    if (miReaccion) {
      copia[miReaccion] = Math.max(0, (copia[miReaccion] ?? 1) - 1)
      if (copia[miReaccion] === 0) delete copia[miReaccion]
    }
    if (miReaccion === tipo) {
      miReaccion = null
    } else {
      copia[tipo] = (copia[tipo] ?? 0) + 1
      miReaccion = tipo
    }
    reacciones = copia
    totalReacciones = Object.values(copia).reduce((a, b) => a + b, 0)

    try {
      const r = await socialApi.reaccionar(
        sesion?.estudiante ?? '',
        sesion?.token ?? '',
        post.id,
        tipo,
        modCode ?? undefined,
      )
      reacciones = r.reacciones ?? {}
      totalReacciones = r.total ?? 0
      miReaccion = r.mi_reaccion ?? null
      trackEvent('social_reaccion', { tipo, mi_reaccion: r.mi_reaccion })
    } catch (e) {
      reacciones = anterior.reacciones
      totalReacciones = anterior.total
      miReaccion = anterior.mia
      Swal.fire({
        title: 'No se pudo reaccionar',
        text: e instanceof Error ? e.message : 'Intenta de nuevo',
        icon: 'error',
        ...swalTheme(),
        iconColor: '#ef4444',
        confirmButtonColor: '#6366f1',
      })
    } finally {
      enviandoReaccion = false
    }
  }

  async function alternarComentarios() {
    mostrarComentarios = !mostrarComentarios
    if (!mostrarComentarios || comentarios.length > 0) return

    cargandoComentarios = true
    try {
      const r = await socialApi.comentarios(post.id)
      comentarios = r.comentarios
    } catch {
      /* se muestra el estado vacio */
    } finally {
      cargandoComentarios = false
    }
  }

  async function enviarComentario() {
    if (invitado) return pedirLogin()
    const texto = nuevoComentario.trim()
    if (texto === '' || enviandoComentario) return

    enviandoComentario = true
    try {
      const r = await socialApi.comentar(
        sesion?.estudiante ?? '',
        sesion?.token ?? '',
        post.id,
        texto,
        modCode ?? undefined,
      )
      nuevoComentario = ''
      trackEvent('social_comentario_creado', { docente: r.auto_aprobado })
      await Swal.fire({
        title: r.auto_aprobado ? 'Comentario publicado' : 'Comentario enviado',
        text: r.auto_aprobado
          ? 'Tu comentario ya es visible.'
          : 'Aparecera cuando un docente lo apruebe.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        ...swalTheme(),
        iconColor: '#10b981',
      })
      onCambio?.()
    } catch (e) {
      Swal.fire({
        title: 'No se pudo comentar',
        text: e instanceof Error ? e.message : 'Intenta de nuevo',
        icon: 'error',
        ...swalTheme(),
        iconColor: '#ef4444',
        confirmButtonColor: '#6366f1',
      })
    } finally {
      enviandoComentario = false
    }
  }

  async function reportar() {
    if (invitado) return pedirLogin()
    if (!sesion) return
    const r = await Swal.fire({
      title: 'Reportar publicacion',
      input: 'text',
      inputPlaceholder: 'Motivo (opcional)',
      showCancelButton: true,
      confirmButtonText: 'Reportar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      ...swalTheme(),
    })
    if (!r.isConfirmed) return

    try {
      await socialApi.reportar(sesion.estudiante, sesion.token, post.id, String(r.value ?? ''))
      trackEvent('social_reporte')
      Swal.fire({
        title: 'Reporte enviado',
        text: 'El moderador revisara la publicacion.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        ...swalTheme(),
        iconColor: '#10b981',
      })
    } catch (e) {
      Swal.fire({
        title: 'Error',
        text: e instanceof Error ? e.message : 'Intenta de nuevo',
        icon: 'error',
        ...swalTheme(),
        iconColor: '#ef4444',
        confirmButtonColor: '#6366f1',
      })
    }
  }

  const puedeBorrar = $derived(esMio || esDocenteActivo)

  /**
   * El docente puede corregir cualquier publicacion. El estudiante solo la
   * suya y mientras siga pendiente (una vez revisada ya no se toca).
   */
  const puedeEditar = $derived(
    esDocenteActivo || (esMio && (post.estado ?? 'aprobado') === 'pendiente'),
  )

  async function editar() {
    const r = await Swal.fire({
      title: esDocenteActivo ? 'Corregir publicacion' : 'Editar mi publicacion',
      input: 'textarea',
      inputValue: textoPost,
      inputAttributes: { maxlength: '500', rows: '6' },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6366f1',
      ...swalTheme(),
      ...(esDocenteActivo
        ? { inputLabel: 'Quedara registrado que la correccion la hizo el docente.' }
        : {}),
    })
    if (!r.isConfirmed) return

    const nuevo = String(r.value ?? '').trim()
    if (nuevo === '' || nuevo === textoPost) return

    guardandoEdicion = true
    try {
      const res = await socialApi.editarPost(nuevo, post.id, {
        estudiante: sesion?.estudiante,
        token: sesion?.token,
        modCode: modCode ?? undefined,
      })
      // Actualizacion inmediata en pantalla, sin esperar a recargar el feed.
      textoPost = res.contenido
      editado = true
      editadoPor = res.editado_por
      trackEvent('social_post_editado', { por_docente: res.por_docente })
      toast('Publicacion corregida')
    } catch (e) {
      Swal.fire({
        title: 'No se pudo editar',
        text: e instanceof Error ? e.message : 'Intenta de nuevo',
        icon: 'error',
        ...swalTheme(),
        iconColor: '#ef4444',
        confirmButtonColor: '#6366f1',
      })
    } finally {
      guardandoEdicion = false
    }
  }

  /** Muestra el desglose completo de reacciones y comentarios. */
  function verDetalleReacciones() {
    const partes: string[] = []
    for (const item of desglose) {
      partes.push(`${item.def?.etiqueta ?? item.tipo}: ${item.conteo}`)
    }

    Swal.fire({
      title: 'Detalle de la publicacion',
      html:
        `<div style="text-align:left;font-size:13px;line-height:1.9">` +
        `<p><strong>${pluralizar(totalReacciones, 'reaccion', 'reacciones')}</strong></p>` +
        (partes.length > 0
          ? `<ul style="margin:0 0 12px 18px;padding:0">${partes.map((p) => `<li>${p}</li>`).join('')}</ul>`
          : `<p style="margin:0 0 12px;opacity:.7">Todavia no hay reacciones.</p>`) +
        `<p><strong>${pluralizar(totalComentarios, 'comentario', 'comentarios')}</strong></p>` +
        `<p style="margin:4px 0 0;opacity:.7">` +
        `Se cuentan solo los comentarios aprobados.</p>` +
        `</div>`,
      showConfirmButton: true,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#6366f1',
      ...swalTheme(),
    })
  }

  function toast(titulo: string) {
    Swal.fire({
      title: titulo,
      icon: 'success',
      timer: 1600,
      showConfirmButton: false,
      ...swalTheme(),
      iconColor: '#10b981',
    })
  }

  async function borrar() {
    if (!sesion && !modCode) return
    const r = await Swal.fire({
      title: 'Borrar publicacion',
      text: 'Esta accion no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Borrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      ...swalTheme(),
    })
    if (!r.isConfirmed) return

    try {
      if (esDocenteActivo) {
        await socialApi.modBorrar(modCode as string, post.id)
      } else {
        await socialApi.borrarPropio(sesion!.estudiante, sesion!.token, post.id)
      }
      onCambio?.()
    } catch (e) {
      Swal.fire({
        title: 'Error',
        text: e instanceof Error ? e.message : 'Intenta de nuevo',
        icon: 'error',
        ...swalTheme(),
        iconColor: '#ef4444',
        confirmButtonColor: '#6366f1',
      })
    }
  }
</script>

{#if imagenAmpliada && post.imagen}
  <div
    class="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
    role="button"
    tabindex="0"
    onclick={() => (imagenAmpliada = false)}
    onkeydown={(e) => e.key === 'Escape' && (imagenAmpliada = false)}
  >
    <img src={post.imagen} alt="" class="max-w-full max-h-full object-contain rounded-2xl" />
  </div>
{/if}

<article class="glass rounded-3xl overflow-hidden glow-card animate-in fade-in duration-300">
  <div class="p-4 sm:p-5">
    <div class="flex items-center gap-3">
      <div
        class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center {esDocente
          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
          : 'bg-gradient-to-br from-indigo-500 to-purple-600'}"
      >
        {#if esDocente}
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12 12 0 0112 21a12 12 0 01-6.16-10.42L12 14z" />
          </svg>
        {:else}
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        {/if}
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-white truncate flex items-center gap-1.5">
          {autor}
          {#if esDocente}
            <span class="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-bold uppercase tracking-wide">
              Docente
            </span>
          {/if}
        </p>
        <p class="text-[10px] text-slate-500">
          {#if grado}<span class="text-indigo-400 font-semibold">{grado}</span> · {/if}{tiempoRelativo(post.created_at)}
        </p>
      </div>
      {#if puedeEditar}
        <button
          onclick={editar}
          disabled={guardandoEdicion}
          class="p-2 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-white/5 transition-all disabled:opacity-40"
          title={esDocenteActivo ? 'Corregir publicacion (queda registrado)' : 'Editar mi publicacion'}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      {/if}

      {#if puedeBorrar}
        <button
          onclick={borrar}
          class="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-white/5 transition-all"
          title="Borrar publicacion"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      {/if}
    </div>

    {#if textoPost}
      <p class="mt-3 text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed">{textoPost}</p>
    {/if}

    {#if editado}
      <p class="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Editado{editadoPor === 'moderador' ? ' por el docente' : ''}
      </p>
    {/if}
  </div>

  {#if post.imagen}
    <button
      class="block w-full border-y border-white/10"
      onclick={() => (imagenAmpliada = true)}
      title="Ver imagen completa"
    >
      <img src={post.imagen} alt="Imagen de la publicacion" class="w-full max-h-[28rem] object-cover" loading="lazy" />
    </button>
  {/if}

  <!-- Conteos: siempre visibles, aunque sean cero, y con desglose al pulsar -->
  <div class="px-4 sm:px-5 pt-3 flex items-center gap-2 text-[11px]">
    <button
      onclick={verDetalleReacciones}
      class="flex items-center gap-1.5 {totalReacciones > 0 ? 'text-slate-300 hover:underline' : 'text-slate-500'}"
      title={totalReacciones > 0 ? 'Ver el detalle de las reacciones' : 'Todavia no hay reacciones'}
    >
      {#if totalReacciones > 0}
        <span class="flex items-center">
          {#each desglose.slice(0, 3) as item, i (item.tipo)}
            <span
              class="w-5 h-5 rounded-full bg-slate-800 ring-2 ring-[var(--app-glass-bg)] flex items-center justify-center text-[11px]"
              style="margin-left: {i === 0 ? 0 : -6}px; z-index: {10 - i}"
              title="{item.def?.etiqueta ?? item.tipo}: {item.conteo}"
            >
              {item.def?.icono ?? '👍'}
            </span>
          {/each}
        </span>
      {:else}
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      {/if}
      {pluralizar(totalReacciones, 'reaccion', 'reacciones')}
    </button>

    <button
      onclick={alternarComentarios}
      class="ml-auto flex items-center gap-1.5 {totalComentarios > 0 ? 'text-slate-300 hover:underline' : 'text-slate-500'}"
      title={totalComentarios > 0 ? 'Ver los comentarios' : 'Todavia no hay comentarios'}
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {pluralizar(totalComentarios, 'comentario', 'comentarios')}
    </button>
  </div>

  <!-- Desglose por tipo, visible en pantallas anchas -->
  {#if totalReacciones > 0}
    <div class="hidden sm:flex flex-wrap gap-1.5 px-4 sm:px-5 pt-2">
      {#each desglose as item (item.tipo)}
        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full glass border-white/10 text-[10px] text-slate-300"
          style="color: {item.def?.color ?? 'inherit'}"
        >
          <span class="text-[11px] leading-none">{item.def?.icono ?? '👍'}</span>
          <span class="font-semibold">{item.conteo}</span>
          <span class="text-slate-400">{item.def?.etiqueta ?? item.tipo}</span>
        </span>
      {/each}
    </div>
  {/if}

  <div class="px-2 py-1.5 flex items-center gap-1 relative">
    <!-- Selector de reacciones -->
    {#if menuAbierto && !invitado}
      <div
        class="absolute bottom-[52px] left-2 z-30 flex items-end gap-0.5 px-2 py-1.5 rounded-full glass-strong border border-white/15 shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-150"
        onmouseenter={abrirMenu}
        onmouseleave={cerrarMenuConRetraso}
        role="toolbar"
        tabindex="-1"
      >
        {#each REACCIONES as r (r.tipo)}
          <button
            onclick={() => reaccionar(r.tipo)}
            class="group relative p-1.5 rounded-full transition-transform duration-150 hover:scale-[1.45] hover:-translate-y-1 {miReaccion === r.tipo
              ? 'bg-white/15'
              : ''}"
            title={r.etiqueta}
          >
            <span class="block text-2xl leading-none">{r.icono}</span>
            <span
              class="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900/95 text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {r.etiqueta}
            </span>
          </button>
        {/each}
      </div>
    {/if}

    <!-- Boton de reaccion: pulsacion corta = repetir, mantener/hover = elegir -->
    <button
      onclick={reaccionRapida}
      onmouseenter={abrirMenu}
      onmouseleave={cerrarMenuConRetraso}
      ontouchstart={abrirMenu}
      class="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all {miDefinicion
        ? ''
        : 'text-slate-400 hover:bg-white/5'}"
      style={miDefinicion ? `color: ${miDefinicion.color}` : ''}
      title={invitado ? 'Inicia sesion para reaccionar' : 'Pulsa para reaccionar, manten para elegir'}
    >
      {#if miDefinicion}
        <span class="text-base leading-none">{miDefinicion.icono}</span>
        {miDefinicion.etiqueta}
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        Me gusta
      {/if}
    </button>

    <button
      onclick={alternarComentarios}
      class="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition-all"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      Comentar
    </button>

    {#if !esMio}
      <button
        onclick={reportar}
        class="p-2 rounded-xl text-slate-500 hover:text-amber-400 hover:bg-white/5 transition-all"
        title={invitado ? 'Inicia sesion para reportar' : 'Reportar'}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      </button>
    {/if}
  </div>

  {#if mostrarComentarios}
    <div class="border-t border-white/10 px-4 sm:px-5 py-4 space-y-3 bg-white/[0.02]">
      {#if cargandoComentarios}
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <div class="w-3.5 h-3.5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
          Cargando comentarios...
        </div>
      {:else if comentarios.length === 0}
        <p class="text-xs text-slate-500">Todavia no hay comentarios aprobados.</p>
      {:else}
        {#each comentarios as c (c.id)}
          <div class="flex items-start gap-2.5">
            <div class="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
              <span class="text-[10px] font-bold text-white">{nombreCorto(c.autor_nombre).charAt(0)}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                {nombreCorto(c.autor_nombre)}
                {#if c.autor_nombre === 'Docente'}
                  <span class="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-bold uppercase tracking-wide">
                    Docente
                  </span>
                {/if}
                <span class="font-normal text-slate-500">· {tiempoRelativo(c.created_at)}</span>
                {#if c.editado}
                  <span class="font-normal text-slate-500" title={c.editado_por === 'moderador' ? 'Corregido por el docente' : 'Editado'}>
                    · editado
                  </span>
                {/if}
              </p>
              <p class="text-xs text-slate-300 whitespace-pre-wrap break-words">{c.contenido}</p>
            </div>
          </div>
        {/each}
      {/if}

      {#if invitado}
        <button
          onclick={pedirLogin}
          class="w-full py-2.5 rounded-xl glass border-white/10 text-xs font-semibold text-indigo-400 hover:border-indigo-500/50 transition-all"
        >
          Inicia sesion para comentar
        </button>
      {:else}
        <div class="flex items-center gap-2 pt-1">
          <input
            bind:value={nuevoComentario}
            maxlength="300"
            placeholder="Escribe un comentario..."
            class="flex-1 rounded-xl glass border-white/10 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            onkeydown={(e) => e.key === 'Enter' && enviarComentario()}
          />
          <button
            onclick={enviarComentario}
            disabled={enviandoComentario || nuevoComentario.trim() === ''}
            class="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-40"
          >
            {enviandoComentario ? '...' : 'Enviar'}
          </button>
        </div>
        <p class="text-[10px] text-slate-500">Los comentarios tambien pasan por aprobacion.</p>
      {/if}
    </div>
  {/if}
</article>
