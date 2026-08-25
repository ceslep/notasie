<script lang="ts">
  import { onMount } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  import { trackStatisticsView } from '$lib/analytics'

  let { notas = [], convivencia = [], estudiante = '', nivel = '' }: {
    notas?: any[]; convivencia?: any[]; estudiante?: string; nivel?: string
  } = $props()

  // svelte-ignore non_reactive_update
  let barCanvas: HTMLCanvasElement
  // svelte-ignore non_reactive_update
  let doughnutCanvas: HTMLCanvasElement
  // svelte-ignore non_reactive_update
  let radarCanvas: HTMLCanvasElement
  let barChart: Chart | null = null
  let doughnutChart: Chart | null = null
  let radarChart: Chart | null = null
  let chartReady = $state(false)

  // Keep track of last data to avoid unnecessary rebuilds
  let lastDataKey = ''

  let stats = $derived.by(() => {
    if (!notas || notas.length === 0) return null

    const promedios = notas.map(n => parseFloat(n.valoracion || '0')).filter(v => v > 0)
    const promedioGeneral = promedios.length > 0
      ? promedios.reduce((a, b) => a + b, 0) / promedios.length
      : 0

    const mejor = notas.reduce((best, n) => {
      const val = parseFloat(n.valoracion || '0')
      const bestVal = parseFloat(best.valoracion || '0')
      return val > bestVal ? n : best
    }, notas[0])

    const peor = notas.reduce((worst, n) => {
      const val = parseFloat(n.valoracion || '0')
      const worstVal = parseFloat(worst.valoracion || '0')
      return val < worstVal && val > 0 ? n : worst
    }, notas[0])

    const totalInasistencias = notas.reduce((a, n) => a + (parseInt(n.cantidadInasistencias) || 0), 0)

    const excellentes = promedios.filter(v => v >= 4.5).length
    const buenos = promedios.filter(v => v >= 3.5 && v < 4.5).length
    const aceptables = promedios.filter(v => v >= 3.0 && v < 3.5).length
    const bajos = promedios.filter(v => v > 0 && v < 3.0).length

    const positivos = convivencia.filter(c => c.tipoFalta === 'POSITIVO').length
    const negativos = convivencia.filter(c => c.tipoFalta !== 'POSITIVO').length

    return {
      promedioGeneral: promedioGeneral.toFixed(1),
      mejor: { asignatura: mejor.asignatura, valoracion: parseFloat(mejor.valoracion || '0').toFixed(1) },
      peor: { asignatura: peor.asignatura, valoracion: parseFloat(peor.valoracion || '0').toFixed(1) },
      totalInasistencias,
      excellentes, buenos, aceptables, bajos,
      positivos, negativos,
      totalMaterias: notas.length,
    }
  })

  function destroyCharts() {
    if (barChart) { barChart.destroy(); barChart = null }
    if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null }
    if (radarChart) { radarChart.destroy(); radarChart = null }
  }

  function buildCharts() {
    if (!barCanvas || !notas || notas.length === 0) return

    destroyCharts()

    const labels = notas.map(n => n.asignatura?.length > 12 ? n.asignatura.slice(0, 12) + '…' : n.asignatura)
    const data = notas.map(n => parseFloat(n.valoracion || '0'))

    // Bar chart
    barChart = new Chart(barCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Promedio',
          data,
          backgroundColor: data.map(v =>
            v >= 4.5 ? 'rgba(52, 211, 153, 0.7)' :
            v >= 3.5 ? 'rgba(56, 189, 248, 0.7)' :
            v >= 3.0 ? 'rgba(251, 191, 36, 0.7)' :
            'rgba(251, 113, 133, 0.7)'
          ),
          borderColor: data.map(v =>
            v >= 4.5 ? 'rgba(52, 211, 153, 1)' :
            v >= 3.5 ? 'rgba(56, 189, 248, 1)' :
            v >= 3.0 ? 'rgba(251, 191, 36, 1)' :
            'rgba(251, 113, 133, 1)'
          ),
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 40,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            borderWidth: 1,
            cornerRadius: 12,
            padding: 10,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: { color: 'rgba(148, 163, 184, 0.7)', stepSize: 1, font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          x: {
            ticks: { color: 'rgba(148, 163, 184, 0.7)', font: { size: 9 }, maxRotation: 45 },
            grid: { display: false },
          },
        },
      },
    })

    // Doughnut chart
    if (doughnutCanvas) {
      doughnutChart = new Chart(doughnutCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Excelente (≥4.5)', 'Bueno (3.5-4.4)', 'Aceptable (3.0-3.4)', 'Bajo (<3.0)'],
          datasets: [{
            data: [
              stats?.excellentes || 0,
              stats?.buenos || 0,
              stats?.aceptables || 0,
              stats?.bajos || 0,
            ],
            backgroundColor: [
              'rgba(52, 211, 153, 0.75)',
              'rgba(56, 189, 248, 0.75)',
              'rgba(251, 191, 36, 0.75)',
              'rgba(251, 113, 133, 0.75)',
            ],
            borderColor: 'rgba(15, 23, 42, 0.8)',
            borderWidth: 3,
            hoverOffset: 8,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          animation: { duration: 600 },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'rgba(203, 213, 225, 0.8)', font: { size: 10 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 },
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              cornerRadius: 12,
              padding: 10,
            },
          },
        },
      })
    }

    // Radar chart
    if (radarCanvas && notas.length >= 3) {
      radarChart = new Chart(radarCanvas, {
        type: 'radar',
        data: {
          labels,
          datasets: [{
            label: 'Desempeño',
            data,
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderColor: 'rgba(99, 102, 241, 0.8)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(99, 102, 241, 1)',
            pointBorderColor: 'rgba(99, 102, 241, 1)',
            pointRadius: 3,
            pointHoverRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 600 },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              cornerRadius: 12,
            },
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 5,
              ticks: { display: false, stepSize: 1 },
              grid: { color: 'rgba(255,255,255,0.06)' },
              angleLines: { color: 'rgba(255,255,255,0.06)' },
              pointLabels: { color: 'rgba(203, 213, 225, 0.7)', font: { size: 9 } },
            },
          },
        },
      })
    }

    chartReady = true
  }

  onMount(() => {
    Chart.register(...registerables)
    trackStatisticsView(notas.length)
    // Build charts once after mount, with a delay to ensure canvases are ready
    if (notas.length > 0) {
      setTimeout(buildCharts, 150)
    }
    return () => destroyCharts()
  })

  // Watch for data changes and rebuild charts only when data actually changes
  $effect(() => {
    const currentKey = notas.map(n => `${n.asignatura}:${n.valoracion}`).join('|')
    if (currentKey && currentKey !== lastDataKey && barCanvas && chartReady) {
      lastDataKey = currentKey
      setTimeout(buildCharts, 50)
    }
  })

  const nivelLabel: Record<string, string> = {
    '4.5 - 5.0': 'Excelente',
    '3.5 - 4.4': 'Bueno',
    '3.0 - 3.4': 'Aceptable',
    '0.0 - 2.9': 'Bajo',
  }
</script>

<div class="space-y-4">
  {#if !stats}
    <div class="glass rounded-2xl p-8 text-center border border-white/5">
      <svg class="w-12 h-12 mx-auto text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p class="text-sm text-slate-400">No hay datos disponibles para estadísticas</p>
    </div>
  {:else}
    <!-- Tarjetas resumen -->
    <div class="grid grid-cols-2 gap-3">
      <div class="glass rounded-2xl p-4 border border-white/5 animate-slide-up">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 uppercase tracking-wider">Promedio</p>
            <p class="text-xl font-bold {parseFloat(stats.promedioGeneral) >= 3 ? 'text-emerald-400' : 'text-red-400'}">{stats.promedioGeneral}</p>
          </div>
        </div>
      </div>

      <div class="glass rounded-2xl p-4 border border-white/5 animate-slide-up" style="animation-delay: 50ms">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 uppercase tracking-wider">Inasistencias</p>
            <p class="text-xl font-bold text-rose-400">{stats.totalInasistencias}</p>
          </div>
        </div>
      </div>

      <div class="glass rounded-2xl p-4 border border-white/5 animate-slide-up" style="animation-delay: 100ms">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 uppercase tracking-wider">Mejor</p>
            <p class="text-xs font-bold text-emerald-300 truncate">{stats.mejor.asignatura}</p>
            <p class="text-[10px] text-emerald-400">{stats.mejor.valoracion}</p>
          </div>
        </div>
      </div>

      <div class="glass rounded-2xl p-4 border border-white/5 animate-slide-up" style="animation-delay: 150ms">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 uppercase tracking-wider">Por mejorar</p>
            <p class="text-xs font-bold text-amber-300 truncate">{stats.peor.asignatura}</p>
            <p class="text-[10px] text-amber-400">{stats.peor.valoracion}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Convivencia resumen -->
    {#if convivencia.length > 0}
      <div class="glass rounded-2xl p-4 border border-white/5 animate-slide-up" style="animation-delay: 200ms">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 uppercase tracking-wider">Convivencia</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs font-bold text-emerald-400">+{stats.positivos}</span>
                <span class="text-slate-600">·</span>
                <span class="text-xs font-bold text-red-400">-{stats.negativos}</span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs font-semibold {stats.positivos >= stats.negativos ? 'text-emerald-400' : 'text-red-400'}">
              {stats.positivos >= stats.negativos ? '👍 conducta positiva' : '⚠️ mejorar conducta'}
            </span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Gráfica de barras -->
    <div class="glass rounded-2xl p-4 border border-white/5 animate-slide-up" style="animation-delay: 250ms">
      <h3 class="text-xs font-bold text-white mb-3 flex items-center gap-2">
        <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        Promedio por materia
      </h3>
      <div class="h-52">
        <canvas bind:this={barCanvas}></canvas>
      </div>
      <div class="flex items-center justify-center gap-4 mt-3">
        {#each Object.entries(nivelLabel) as [range, label]}
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full {label === 'Excelente' ? 'bg-emerald-400' : label === 'Bueno' ? 'bg-sky-400' : label === 'Aceptable' ? 'bg-amber-400' : 'bg-rose-400'}"></div>
            <span class="text-[9px] text-slate-500">{label}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Dos gráficas lado a lado -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Dona -->
      <div class="glass rounded-2xl p-4 border border-white/5 animate-slide-up" style="animation-delay: 300ms">
        <h3 class="text-xs font-bold text-white mb-3">Distribución</h3>
        <div class="h-44">
          <canvas bind:this={doughnutCanvas}></canvas>
        </div>
      </div>

      <!-- Radar -->
      <div class="glass rounded-2xl p-4 border border-white/5 animate-slide-up" style="animation-delay: 350ms">
        <h3 class="text-xs font-bold text-white mb-3">Rendimiento</h3>
        <div class="h-44">
          <canvas bind:this={radarCanvas}></canvas>
        </div>
      </div>
    </div>

    <!-- Leyenda de desempeño -->
    <div class="glass rounded-2xl p-4 border border-white/5 animate-slide-up" style="animation-delay: 400ms">
      <h3 class="text-xs font-bold text-white mb-3">Clasificación de desempeño</h3>
      <div class="space-y-2">
        {#each [
          { rango: '4.5 – 5.0', label: 'Excelente', color: 'bg-emerald-400', count: stats.excellentes },
          { rango: '3.5 – 4.4', label: 'Bueno', color: 'bg-sky-400', count: stats.buenos },
          { rango: '3.0 – 3.4', label: 'Aceptable', color: 'bg-amber-400', count: stats.aceptables },
          { rango: '0.0 – 2.9', label: 'Bajo', color: 'bg-rose-400', count: stats.bajos },
        ] as item}
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full {item.color}"></div>
            <span class="text-[10px] text-slate-400 w-16">{item.rango}</span>
            <span class="text-[10px] text-slate-300 flex-1">{item.label}</span>
            <div class="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div class="h-full {item.color} rounded-full transition-all duration-700" style="width: {stats.totalMaterias > 0 ? (item.count / stats.totalMaterias) * 100 : 0}%"></div>
            </div>
            <span class="text-[10px] text-slate-400 w-4 text-right">{item.count}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
