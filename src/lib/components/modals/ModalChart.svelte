<script lang="ts">
  import { onMount } from 'svelte'

  let { labels = [], data = [], backgroundColor = [], labelsFor, onClose }: {
    labels?: string[]; data?: number[]; backgroundColor?: string[]; labelsFor: string; onClose?: () => void
  } = $props()

  let canvas: HTMLCanvasElement

  onMount(async () => {
    const { Chart } = await import('chart.js')
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: `Aspecto de la nota vs ${labelsFor}`,
          data,
          backgroundColor,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    })
  })
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10">
  <div class="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-white px-5 py-3 rounded-t-3xl flex items-center justify-between">
    <h3 class="text-base font-bold">Grafico</h3>
    <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
  </div>
  <div class="p-4 h-[45vh]">
    <canvas bind:this={canvas}></canvas>
  </div>
  <div class="px-5 pb-5"><button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cerrar</button></div>
</div></div>


