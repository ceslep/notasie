<script lang="ts">
  let { tipoFalta, fecha, descripcionSituacion, descargos, firma, faltas, hora }: {
    tipoFalta: string; fecha: string; descripcionSituacion: string; descargos: string; firma: string; faltas: string; hora: string
  } = $props()
</script>
<div class="glass rounded-2xl border border-white/5 overflow-hidden mb-4">
  <div class="bg-white/5 px-4 py-3 border-b border-white/5">
    <h4 class="font-semibold text-sm text-white">
      {tipoFalta !== 'POSITIVO' ? 'Tipo de Falta: ' + tipoFalta : 'Felicitaciones'}
    </h4>
  </div>
  <div class="p-4 space-y-3">
    <p class="text-xs text-slate-400">Fecha: {fecha} {hora}</p>
    {#if tipoFalta !== 'POSITIVO'}
      <p class="text-xs text-slate-400">Descripcion de la(s) falta(s) segun el manual de convivencia</p>
    {:else}
      <p class="text-xs text-slate-400">Se ha registrado una felicitacion</p>
      <div class="flex justify-center"><img class="w-20 h-auto" src="./medalla.png" alt="Medalla" /></div>
    {/if}
    <p class="text-xs">{faltas}</p>
    <p class="text-xs font-semibold text-emerald-600">
      {tipoFalta !== 'POSITIVO' ? 'Descripcion de la situacion' : 'Observacion positiva para el futuro del estudiante'}
    </p>
    <p class="text-xs text-blue-600">{descripcionSituacion}</p>
    <div class="rounded-xl p-3 {tipoFalta === 'POSITIVO' ? 'bg-blue-500/10 text-blue-300' : 'bg-red-500/10 text-red-300'}">
      <p class="font-semibold text-xs mb-1">{tipoFalta !== 'POSITIVO' ? 'Descargos del Estudiante' : 'Convivencia Positiva'}</p>
      <p class="text-xs">{descargos}</p>
    </div>
    <div><span class="text-xs font-medium text-slate-300">Firma:</span>
      <img class="w-32 h-auto mt-1" src={firma} alt="firma" />
    </div>
  </div>
  <div class="bg-white/5 px-4 py-2 border-t border-white/5 text-center">
    <span class="text-xs font-semibold text-emerald-600">Comite de convivencia I.E. de Occidente {new Date().getFullYear()}</span>
  </div>
</div>

