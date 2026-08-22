<script lang="ts">
  import type { NotaDetallada } from '$lib/types'
  let { notasDetallado = [], notasDetalladoFull = [] }: {
    notasDetallado: NotaDetallada[]; notasDetalladoFull: NotaDetallada[]
  } = $props()

  const competencias = [
    { label: 'SABER', pct: 35, start: 0, end: 2, color: 'emerald', desc: 'Conocimientos' },
    { label: 'HACER', pct: 35, start: 3, end: 5, color: 'orange', desc: 'Habilidades' },
    { label: 'SER', pct: 20, start: 6, end: 8, color: 'blue', desc: 'Actitudes' },
    { label: 'AE', pct: 5, start: 9, end: 9, color: 'purple', desc: 'Autoevaluacion' },
    { label: 'CE', pct: 5, start: 10, end: 10, color: 'pink', desc: 'Coevaluacion' },
  ]

  const colorClass = (c: string) => ({
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    pink: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  }[c])

  const colorBar = (c: string) => ({
    emerald: 'from-emerald-500 to-green-400',
    orange: 'from-orange-500 to-amber-400',
    blue: 'from-blue-500 to-cyan-400',
    purple: 'from-purple-500 to-violet-400',
    pink: 'from-pink-500 to-rose-400',
  }[c])

  const fullIdx = (aspecto: string, nota: string) => {
    const i = notasDetalladoFull.findIndex((v) => v.Aspecto === aspecto && v.Nota === nota)
    return i >= 0 ? i : 0
  }

  const getComp = (i: number) => competencias.find(c => i >= c.start && i <= c.end) ?? competencias[0]
</script>

<div class="overflow-x-auto -mx-4 px-4">
  <table class="w-full text-xs">
    <thead>
      <tr class="bg-white/5 border-b border-white/5">
        <th class="px-2 py-2 text-center font-semibold text-slate-400">#</th>
        <th class="px-2 py-2 text-left font-semibold text-slate-400">Aspecto</th>
        <th class="px-2 py-2 text-center font-semibold text-slate-400">Nota</th>
        <th class="px-2 py-2 text-center font-semibold text-slate-400">Fecha</th>
        <th class="px-2 py-2 text-center font-semibold text-slate-400">Tipo</th>
      </tr>
    </thead>
    <tbody>
      {#each notasDetallado as { Aspecto, Nota, FechaNota, Porcentaje }, i}
        {@const idx = fullIdx(Aspecto, Nota)}
        {@const comp = getComp(idx)}
        {#if comp && i === comp.start}
          <tr>
            <td colspan="5" class="px-2 pt-3 pb-1">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-extrabold {colorClass(comp.color).split(' ')[1]} tracking-wider">{comp.label}</span>
                <span class="text-[9px] text-slate-500">{comp.desc}</span>
                <div class="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r {colorBar(comp.color)}" style="width: {comp.pct}%"></div>
                </div>
                <span class="text-[10px] font-bold text-slate-400">{comp.pct}%</span>
              </div>
            </td>
          </tr>
        {/if}
        <tr class="border-b border-white/5 active:bg-white/5">
          <td class="px-2 py-1.5 text-center text-slate-500">{i + 1}</td>
          <td class="px-2 py-1.5 text-slate-300">{Aspecto || 'Sin Aspecto'}</td>
          <td class="px-2 py-1.5 text-center font-bold {parseFloat(Nota) < 3 ? 'text-red-400' : 'text-white'}">{Nota ? parseFloat(Nota).toFixed(1) : '-'}</td>
          <td class="px-2 py-1.5 text-center text-slate-500">{FechaNota ?? '-'}</td>
          <td class="px-2 py-1.5 text-center">
            <span class="text-[9px] px-1.5 py-0.5 rounded-md border {colorClass(comp.color)}">{comp.label} {comp.pct}%</span>
          </td>
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <tr class="border-t border-white/10 bg-white/5">
        <td colspan="4" class="px-2 py-2 text-right text-[10px] font-bold text-slate-400">TOTAL</td>
        <td class="px-2 py-2 text-center text-[10px] font-extrabold text-emerald-400">100%</td>
      </tr>
    </tfoot>
  </table>
  <p class="text-[10px] text-slate-500 mt-2 text-center">Profesor: {notasDetallado[0]?.profesor}</p>
</div>
