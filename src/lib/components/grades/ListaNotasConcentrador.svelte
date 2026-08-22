<script lang="ts">
  let { notas = [] }: { notas?: any[] } = $props()

  let data = $derived.by(() => {
    const asignaturas = new Set(notas.map((n) => n.asignatura))
    const result: { asignatura: string; valoraciones: string[] }[] = []
    asignaturas.forEach((asig) => {
      const datos = notas.filter((n) => n.asignatura === asig)
      let vs = datos.map((v) => v.valoracion)
      while (vs.length < 4) vs.push('0')
      result.push({ asignatura: asig, valoraciones: vs })
    })
    return result
  })

  let overallTrend = $derived.by(() => {
    if (data.length === 0) return '→'
    const p1Total = data.reduce((sum, d) => sum + parseFloat(d.valoraciones[0] || '0'), 0)
    const p4Total = data.reduce((sum, d) => sum + parseFloat(d.valoraciones[3] || '0'), 0)
    if (p4Total > p1Total) return '↗'
    if (p4Total < p1Total) return '↘'
    return '→'
  })

  const trendColor = (p1: string, p4: string) => {
    const a = parseFloat(p1 || '0'), b = parseFloat(p4 || '0')
    return b > a ? 'text-green-400' : b < a ? 'text-red-400' : 'text-yellow-400'
  }
  const trendArrow = (p1: string, p4: string) => {
    const a = parseFloat(p1 || '0'), b = parseFloat(p4 || '0')
    return b > a ? '↗' : b < a ? '↘' : '→'
  }
</script>
<div class="overflow-x-auto -mx-4 px-4">
  <table class="w-full text-xs">
    <thead><tr class="bg-white/5 border-b border-white/5">
      <th class="px-2 py-2 text-center font-semibold text-slate-400">Asig</th>
      <th class="px-2 py-2 text-center font-semibold text-slate-400">P1</th>
      <th class="px-2 py-2 text-center font-semibold text-slate-400">P2</th>
      <th class="px-2 py-2 text-center font-semibold text-slate-400">P3</th>
      <th class="px-2 py-2 text-center font-semibold text-slate-400">P4</th>
      <th class="px-2 py-2 text-center font-semibold text-slate-400">Fin</th>
      <th class="px-2 py-2 text-center font-semibold text-slate-400">Tendencia</th>
    </tr></thead>
    <tbody>
      {#each data as { asignatura, valoraciones }}
        <tr class="border-b border-white/5 active:bg-white/5">
          <td class="px-2 py-2 text-center font-medium">{asignatura}</td>
          {#each valoraciones as v}
            <td class="px-2 py-2 text-center font-semibold {parseFloat(v) < 3 ? 'text-red-400' : 'text-white'}">{parseFloat(v || '0').toFixed(1)}</td>
          {/each}
          <td class="px-2 py-2 text-center font-bold text-emerald-400">
            {(valoraciones.reduce((a, b) => a + parseFloat(b || '0'), 0) / valoraciones.length).toFixed(1)}
          </td>
          <td class="px-2 py-2 text-center font-bold text-lg {trendColor(valoraciones[0], valoraciones[3])}">
            {trendArrow(valoraciones[0], valoraciones[3])}
          </td>
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <tr class="bg-white/5 border-t border-white/10">
        <td class="px-2 py-2 text-center font-bold text-slate-300" colspan="6">Promedio General</td>
        <td class="px-2 py-2 text-center font-bold text-lg {overallTrend === '↗' ? 'text-green-400' : overallTrend === '↘' ? 'text-red-400' : 'text-yellow-400'}">
          {overallTrend}
        </td>
      </tr>
    </tfoot>
  </table>
</div>
