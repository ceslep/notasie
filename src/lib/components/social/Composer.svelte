<script lang="ts">
  import { socialApi, comprimirImagen } from '$lib/services/social'
  import { trackEvent } from '$lib/analytics'
  import Swal from 'sweetalert2'
  import { swalTheme } from '$lib/theme.svelte'

  let {
    sesion = null,
    modCode = null,
    publicar,
  }: {
    /** Estudiante con sesion. Si es null y hay modCode, publica el docente. */
    sesion?: { estudiante: string; nombres: string; token: string } | null
    /** Codigo de moderador: sus publicaciones se aprueban al instante. */
    modCode?: string | null
    publicar: () => void
  } = $props()

  let texto = $state('')
  let imagen = $state<string | null>(null)
  let procesando = $state(false)
  let error = $state('')
  let inputArchivo: HTMLInputElement | undefined = $state()

  const MAX = 500
  const restantes = $derived(MAX - texto.length)
  const puedeEnviar = $derived((texto.trim().length > 0 || imagen !== null) && !procesando)
  const esDocente = $derived(Boolean(modCode))

  async function elegirImagen(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    error = ''

    if (!file.type.startsWith('image/')) {
      error = 'Solo se permiten imagenes'
      input.value = ''
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      error = 'La imagen es muy grande (maximo 12 MB)'
      input.value = ''
      return
    }

    procesando = true
    try {
      imagen = await comprimirImagen(file)
    } catch {
      error = 'No se pudo procesar la imagen'
    } finally {
      procesando = false
      input.value = ''
    }
  }

  async function enviar() {
    if (!puedeEnviar) return
    procesando = true
    error = ''
    try {
      const r = await socialApi.crearPost(
        sesion?.estudiante ?? '',
        sesion?.token ?? '',
        texto.trim(),
        imagen,
        modCode ?? undefined,
      )
      trackEvent('social_post_creado', { docente: r.auto_aprobado })

      texto = ''
      imagen = null

      await Swal.fire({
        title: r.auto_aprobado ? 'Publicado' : 'Enviado a revision',
        text: r.auto_aprobado
          ? 'Tu publicacion ya es visible en la red social.'
          : 'Tu publicacion sera visible cuando un docente la apruebe.',
        icon: 'success',
        timer: 2200,
        showConfirmButton: false,
        ...swalTheme(),
        iconColor: '#10b981',
      })
      publicar()
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo publicar'
    } finally {
      procesando = false
    }
  }
</script>

<div class="glass rounded-3xl p-4 sm:p-5 glow-card {esDocente ? 'border-l-2 border-amber-400/60' : ''}">
  <div class="flex items-start gap-3">
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

    <div class="flex-1 min-w-0">
      {#if esDocente}
        <p class="text-[11px] font-bold text-amber-400 mb-2 flex items-center gap-1.5">
          Publicando como docente
          <span class="font-normal text-slate-500">· se publica al instante, sin aprobacion</span>
        </p>
      {/if}

      <textarea
        bind:value={texto}
        maxlength={MAX}
        rows="3"
        placeholder={esDocente ? 'Comparte un anuncio con los estudiantes...' : 'Comparte algo con tus companeros...'}
        class="w-full resize-none rounded-2xl glass border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
      ></textarea>

      {#if imagen}
        <div class="relative mt-3 rounded-2xl overflow-hidden border border-white/10">
          <img src={imagen} alt="Vista previa" class="w-full max-h-72 object-cover" />
          <button
            onclick={() => (imagen = null)}
            class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            title="Quitar imagen"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/if}

      {#if error}
        <p class="mt-2 text-xs text-red-400">{error}</p>
      {/if}

      <div class="mt-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <button
            onclick={() => inputArchivo?.click()}
            disabled={procesando}
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass border-white/10 text-xs text-slate-300 hover:text-indigo-400 hover:border-indigo-500/40 transition-all disabled:opacity-50"
            title="Adjuntar imagen"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Imagen
          </button>
          <input
            bind:this={inputArchivo}
            type="file"
            accept="image/*"
            class="hidden"
            onchange={elegirImagen}
          />
          <span class="text-[10px] {restantes < 50 ? 'text-amber-400' : 'text-slate-500'}">{restantes}</span>
        </div>

        <button
          onclick={enviar}
          disabled={!puedeEnviar}
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          {#if procesando}
            <div class="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            Enviando
          {:else}
            Publicar
          {/if}
        </button>
      </div>

      {#if !esDocente}
        <p class="mt-2 text-[10px] text-slate-500 flex items-center gap-1.5">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Toda publicacion es revisada por un docente antes de aparecer.
        </p>
      {/if}
    </div>
  </div>
</div>
