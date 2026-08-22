<script lang="ts">
  import { onMount } from 'svelte'
  import { convivenciaApi } from '$lib/services/api'
  import ModalConvivencia from '../modals/ModalConvivencia.svelte'

  let { estudiante }: { estudiante: string } = $props()
  let consolidado = $state<any[]>([])
  let info = $state<any>(null)
  let showModal = $state(false)

  onMount(async () => {
    consolidado = await convivenciaApi.getConsolidado(estudiante, new Date().getFullYear())
  })

  const openDetail = async (cons: any) => {
    const [data] = await convivenciaApi.getDetallado(cons.ind, new Date().getFullYear())
    info = data
    showModal = true
  }
</script>

{#if showModal}
  <ModalConvivencia {info} onClose={() => showModal = false} />
{/if}

<div class="overflow-x-auto -mx-4 px-4">
  <table class="w-full text-xs">
    <thead><tr class="bg-emerald-50 border-b border-white/5">
      <th class="px-2 py-2 text-center font-semibold text-slate-400">#</th>
      <th class="px-2 py-2 text-center font-semibold text-slate-400">Ver</th>
      <th class="px-2 py-2 text-center font-semibold text-slate-400">Fecha</th>
      <th class="px-2 py-2 text-center font-semibold text-slate-400">Hora</th>
      <th class="px-2 py-2 text-center font-semibold text-slate-400">Falta</th>
    </tr></thead>
    <tbody>
      {#each consolidado as { fecha, hora, tipoFalta, ...cons }, index}
        <tr class="border-b border-white/5 active:bg-white/5">
          <td class="px-2 py-2 text-center">{index + 1}</td>
          <td class="px-2 py-2 text-center">
            <button class="rounded-full px-2 py-1 text-[10px] bg-emerald-500 text-white active:scale-95 transition-transform" onclick={() => openDetail(cons)}>
              <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          </td>
          <td class="px-2 py-2 text-center">{fecha}</td>
          <td class="px-2 py-2 text-center">{hora}</td>
          <td class="px-2 py-2 text-center">{tipoFalta}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

