<script lang="ts">
  import type { ConvivenciaDetalle } from '$lib/types'

  let { positivo = false, info, onClose }: {
    positivo?: boolean; info: ConvivenciaDetalle; onClose?: (t?: string) => void
  } = $props()
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10">
  <div class="px-5 py-3 rounded-t-3xl flex items-center justify-between {positivo ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-yellow-300'}">
    <h3 class="text-base font-bold">Convivencia</h3>
    <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
  </div>
  <div class="p-4 max-h-[75vh] overflow-y-auto space-y-3">
    {#if info}
      <div class="grid grid-cols-1 gap-3">
        {#each [{l: 'Docente', v: info.cv_docente}, {l: 'Asignatura', v: info.cv_asignatura}, {l: info.cv_tipoFalta?.includes('POSITIVO') ? 'Reporte' : 'Tipo Falta', v: info.cv_tipoFalta}, {l: 'Fecha', v: info.cv_fecha}, {l: 'Hora', v: info.cv_hora}] as item}
          <div class="space-y-0.5">
            <label class="text-[10px] font-bold text-slate-500 uppercase">{item.l}</label>
            <input type="text" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" readonly value={item.v} />
          </div>
        {/each}
      </div>
      {#if info.cv_faltas}<div><label class="text-[10px] font-bold text-slate-500 uppercase">Faltas</label><textarea readonly class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs italic" rows="3" value={info.cv_faltas}></textarea></div>{/if}
      {#if info.cv_descripcionSituacion}<div><label class="text-[10px] font-bold text-slate-500 uppercase">Situacion</label><textarea readonly class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs italic" rows="3" value={info.cv_descripcionSituacion}></textarea></div>{/if}
      {#if info.cv_descargosEstudiante}<div><label class="text-[10px] font-bold text-slate-500 uppercase">Descargos</label><textarea readonly class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs italic" rows="3" value={info.cv_descargosEstudiante}></textarea></div>{/if}
      {#if info.cv_firma}<img src={info.cv_firma} alt="firma" class="w-32 h-auto mt-2" />{/if}
      {#if info.cv_positivos}<div><label class="text-[10px] font-bold text-slate-500 uppercase">Observaciones</label><textarea readonly class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs italic" rows="2" value={info.cv_positivos}></textarea></div>{/if}
    {/if}
  </div>
  <div class="px-5 pb-5"><button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cerrar</button></div>
</div></div>


