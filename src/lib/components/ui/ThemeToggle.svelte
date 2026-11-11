<script lang="ts">
  import { theme, toggleTheme } from '$lib/theme.svelte'

  let { class: className = '' }: { class?: string } = $props()

  const isDark = $derived(theme.current === 'dark')
  const label = $derived(isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro')
</script>

<button
  type="button"
  onclick={toggleTheme}
  aria-label={label}
  title={label}
  aria-pressed={isDark}
  class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all {className}"
>
  <span class="sr-only">{label}</span>
  {#if isDark}
    <!-- Sol: disponible en modo oscuro para volver al claro -->
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  {:else}
    <!-- Luna: disponible en modo claro para pasar al oscuro -->
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  {/if}
</button>
