<script lang="ts">
import { socialApi, type SocialSesion } from '$lib/services/social'
import { trackEvent } from '$lib/analytics'

let {
  onAcceso,
  onClose,
}: {
  onAcceso: (sesion: SocialSesion) => void
  onClose: () => void
} = $props()

let usu = $state('')
let cla = $state('')
let cargando = $state(false)
let error = $state('')

const puedeEntrar = $derived(usu.trim() !== '' && cla !== '' && !cargando)

async function entrar() {
  if (!puedeEntrar) return
  cargando = true
  error = ''
  try {
    const r = await socialApi.login(usu.trim(), cla)
    trackEvent('social_login')
    onAcceso({
      estudiante: String(r.estudiante),
      nombres: String(r.nombres),
      nivel: String(r.nivel ?? ''),
      numero: String(r.numero ?? ''),
      token: String(r.token),
    })
  } catch (e) {
    error = e instanceof Error ? e.message : 'No se pudo iniciar sesion'
    trackEvent('social_login_fallido')
  } finally {
    cargando = false
  }
}
</script>

<div
  class="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
>
  <div
    class="w-full max-w-sm glass-strong rounded-3xl p-6 glow-card animate-in zoom-in duration-300"
    role="dialog"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </div>
        <div>
          <h2 class="text-base font-bold text-white">Red Social</h2>
          <p class="text-[11px] text-slate-500">Solo estudiantes del colegio</p>
        </div>
      </div>
      <button
        onclick={onClose}
        class="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
        title="Cerrar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <p class="text-xs text-slate-400 mb-5">
      Usa el mismo documento y contrasena con los que entras al sistema academico.
      Todo lo que publiques sera revisado por un docente antes de aparecer.
    </p>

    <form
      class="space-y-3"
      onsubmit={(e) => {
        e.preventDefault()
        entrar()
      }}
    >
      <input
        bind:value={usu}
        type="text"
        inputmode="numeric"
        placeholder="Documento de identidad"
        class="w-full rounded-2xl glass border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
      />
      <input
        bind:value={cla}
        type="password"
        placeholder="Contrasena"
        class="w-full rounded-2xl glass border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
      />

      {#if error}
        <p class="text-xs text-red-400">{error}</p>
      {/if}

      <button
        type="submit"
        disabled={!puedeEntrar}
        class="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        {cargando ? 'Verificando...' : 'Entrar a la red social'}
      </button>
    </form>

    <p class="mt-4 text-[10px] text-slate-500 text-center">
      Publicaciones, imagenes y comentarios pasan por aprobacion previa.
    </p>
  </div>
</div>
