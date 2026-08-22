<script lang="ts">
  import ModalViewFoto from './modals/ModalViewFoto.svelte'

  let { photoURL = '', nombres = '', title = '', onLogout, onLogin, onRegister, showActions = true }: {
    photoURL?: string; nombres?: string; title?: string; onLogout?: () => void; onLogin?: () => void; onRegister?: () => void; showActions?: boolean
  } = $props()

  let openFoto = $state(false)
  const isLoggedIn = $derived(nombres !== '')
</script>

{#if openFoto}
  <ModalViewFoto {photoURL} onClose={() => openFoto = false} />
{/if}

<nav class="sticky top-0 z-50 glass-strong border-b border-white/5">
  <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20">
        <img src="https://app.iedeoccidente.com/eduadmin/escudohd.png" alt="I.E. de Occidente" class="w-full h-full object-contain" />
      </div>
      <span class="text-sm font-bold text-white hidden sm:block">Academico</span>
    </a>

    {#if isLoggedIn}
      <div class="flex items-center gap-2">
        <div class="text-right hidden sm:block">
          <p class="text-xs font-medium text-slate-300 leading-tight">{nombres}</p>
          {#if title}<p class="text-[10px] text-indigo-400 font-semibold">{title}</p>{/if}
        </div>
        <button onclick={() => openFoto = true} class="relative group">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <img class="relative w-9 h-9 rounded-full object-cover ring-2 ring-white/20" src={photoURL || ''} alt="" onerror={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }} />
          <div class="hidden relative w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-white/20">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
        </button>
        <button class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all" onclick={() => onLogout?.()} title="Cerrar Sesion">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </div>
    {/if}
  </div>
</nav>
