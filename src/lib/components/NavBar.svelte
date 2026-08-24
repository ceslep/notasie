<script lang="ts">
  import ModalViewFoto from './modals/ModalViewFoto.svelte'

  let { photoURL = '', nombres = '', title = '', onLogout, onLogin, onRegister, showActions = true, refreshing = false, onRefresh, linkedStudents = [], currentStudentIdx = 0, onSwitchStudent }: {
    photoURL?: string; nombres?: string; title?: string; onLogout?: () => void; onLogin?: () => void; onRegister?: () => void; showActions?: boolean; refreshing?: boolean; onRefresh?: () => void; linkedStudents?: { name: string; grade?: string }[]; currentStudentIdx?: number; onSwitchStudent?: (idx: number) => void
  } = $props()

  let openFoto = $state(false)
  let showSwitcher = $state(false)
  const isLoggedIn = $derived(nombres !== '')

  function handleClickOutside(e: MouseEvent) {
    if (showSwitcher) showSwitcher = false
  }
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
          {#if linkedStudents.length > 1}
            <button
              onclick={(e) => { e.stopPropagation(); showSwitcher = !showSwitcher }}
              class="inline-flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <span>{linkedStudents[currentStudentIdx]?.name ?? 'Estudiante'}</span>
              <svg class="w-3 h-3 transition-transform {showSwitcher ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
          {/if}
        </div>
        <button onclick={() => openFoto = true} class="relative group">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <img class="relative w-9 h-9 rounded-full object-cover ring-2 ring-white/20" src={photoURL || ''} alt="" onerror={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }} />
          <div class="hidden relative w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-white/20">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
        </button>
        <button onclick={() => onRefresh?.()} class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="Actualizar" disabled={refreshing}>
          <svg class="w-4 h-4 {refreshing ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
        <button class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all" onclick={() => onLogout?.()} title="Cerrar Sesion">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </div>
    {/if}
  </div>
</nav>

{#if showSwitcher}
  <div class="fixed inset-0 z-40" onclick={handleClickOutside}></div>
  <div class="fixed top-14 right-4 sm:right-auto sm:translate-x-0 z-50 w-64 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/40 p-1.5">
    {#each linkedStudents as student, idx}
      <button
        class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-all {idx === currentStudentIdx ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'}"
        onclick={() => { onSwitchStudent?.(idx); showSwitcher = false }}
      >
        <span class="text-xs font-medium truncate">{student.name}</span>
        {#if student.grade}<span class="text-[10px] {idx === currentStudentIdx ? 'text-indigo-400' : 'text-slate-500'}">{student.grade}</span>{/if}
      </button>
    {/each}
  </div>
{/if}
