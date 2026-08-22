<script lang="ts">
  import type { Puesto } from '$lib/types'
  let { estudiante = '', data = [] }: { estudiante: string; data: Puesto[] } = $props()
</script>
{#if data.length > 0}
  <div class="overflow-x-auto rounded-xl border border-white/5">
    <table class="w-full text-xs">
      <thead><tr class="bg-white/5 border-b border-white/5">
        <th class="px-2 py-2 text-center font-semibold text-slate-400">N</th>
        {#each Object.keys(data[0]) as k}<th class="px-2 py-2 text-center font-semibold text-slate-400">{k}</th>{/each}
      </tr></thead>
      <tbody>
        {#each data as lista, i}
          <tr class="border-b border-white/5 {lista.nombres === estudiante ? 'bg-emerald-500/15' : 'active:bg-white/5'}">
            <td class="px-2 py-2 text-center text-[10px]">{i + 1}</td>
            {#each Object.keys(lista) as k}<td class="px-2 py-2 text-center text-[10px]">{lista[k as keyof Puesto]}</td>{/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="flex items-center justify-center p-8"><div class="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>
{/if}

