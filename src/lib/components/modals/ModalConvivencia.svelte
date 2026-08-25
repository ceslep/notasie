<script lang="ts">
  import type { ConvivenciaDetalle } from '$lib/types'

  let { positivo = false, info, onClose }: {
    positivo?: boolean; info: ConvivenciaDetalle; onClose?: (t?: string) => void
  } = $props()

  function fixLabel(text: string): string {
    if (!text) return text
    return decodeHtml(text)
      .replace(/Falta/gi, 'Situacion')
      .replace(/Faltas/gi, 'Situaciones')
  }

  function decodeHtml(text: string): string {
    if (!text) return text
    const el = document.createElement('textarea')
    return text.replace(/&([a-z]+);/gi, (_, entity) => {
      el.innerHTML = `&${entity};`
      return el.value
    })
  }

  function isBase64(val: string): boolean {
    return val && val.startsWith('data:image')
  }

  function resolveInfo(text: string): string {
    if (!text) return text
    return text.replace(/%(\w+)%/g, (_, key) => {
      if (info && key in info) return String((info as any)[key])
      return `%${key}%`
    })
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" role="button" tabindex="-1" onclick={() => onClose?.()} onkeydown={(e) => e.key === 'Escape' && onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-300">
    <div class="px-5 py-4 rounded-t-3xl flex items-center justify-between {positivo ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20' : 'bg-gradient-to-r from-red-500/20 to-orange-500/20'} border-b border-white/5">
      <div class="flex items-center gap-2">
        {#if positivo}
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {:else}
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
        {/if}
        <h3 class="text-base font-bold text-white">Detalle Convivencia</h3>
      </div>
      <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
    </div>

    <div class="p-5 max-h-[70vh] overflow-y-auto space-y-4">
      {#if info}
        <div class="flex items-center gap-3 p-3 rounded-xl glass border border-white/5">
          <div class="w-10 h-10 rounded-full {positivo ? 'bg-emerald-500/20' : 'bg-red-500/20'} flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 {positivo ? 'text-emerald-400' : 'text-red-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-white truncate">{decodeHtml(info.nombres)}</p>
            <p class="text-xs text-slate-400 truncate">{decodeHtml(info.cv_docente)} - {decodeHtml(info.cv_asignatura)}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-xl glass border border-white/5">
            <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Tipo</p>
            <p class="text-xs font-semibold {info.cv_tipoFalta?.toUpperCase().includes('TIPO') ? 'text-red-400' : 'text-emerald-400'}">{fixLabel(info.cv_tipoFalta)}</p>
          </div>
          <div class="p-3 rounded-xl glass border border-white/5">
            <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Fecha</p>
            <p class="text-xs font-semibold text-white">{info.cv_fecha}</p>
          </div>
        </div>

        {#if info.cv_hora}
          <div class="p-3 rounded-xl glass border border-white/5">
            <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Hora</p>
            <p class="text-xs font-semibold text-white">{info.cv_hora}</p>
          </div>
        {/if}

        {#if info.cv_faltas}
          <div class="p-4 rounded-xl glass border border-white/5">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider">Situaciones</p>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">{fixLabel(info.cv_faltas)}</p>
          </div>
        {/if}

        {#if info.cv_descripcionSituacion}
          <div class="p-4 rounded-xl glass border border-white/5">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider">Situacion</p>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">{decodeHtml(info.cv_descripcionSituacion)}</p>
          </div>
        {/if}

        {#if info.cv_descargosEstudiante}
          <div class="p-4 rounded-xl glass border border-white/5">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider">Descargos del Estudiante</p>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed italic">{decodeHtml(info.cv_descargosEstudiante)}</p>
          </div>
        {/if}

        {#if info.cv_positivos}
          <div class="p-4 rounded-xl {positivo ? 'bg-emerald-500/10 border border-emerald-500/20' : 'glass border border-white/5'}">
            <div class="flex items-center gap-2 mb-2">
              {#if positivo}
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
              {:else}
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              {/if}
              <p class="text-[10px] {positivo ? 'text-emerald-400' : 'text-slate-500'} uppercase tracking-wider">{positivo ? 'Observaciones Positivas' : 'Observaciones'}</p>
            </div>
            <p class="text-xs {positivo ? 'text-emerald-200' : 'text-slate-300'} leading-relaxed">{decodeHtml(info.cv_positivos)}</p>
          </div>
        {/if}

        {#if info.cv_firma && isBase64(info.cv_firma)}
          <div class="p-4 rounded-xl glass border border-white/5">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider">Firma Docente</p>
            </div>
            <img src={info.cv_firma} alt="Firma docente" class="max-h-24 bg-white rounded-lg p-2" />
          </div>
        {/if}

        {#if info.firmaAcudiente && isBase64(info.firmaAcudiente)}
          <div class="p-4 rounded-xl glass border border-white/5">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              <p class="text-[10px] text-slate-500 uppercase tracking-wider">Firma Acudiente</p>
            </div>
            <img src={info.firmaAcudiente} alt="Firma acudiente" class="max-h-24 bg-white rounded-lg p-2" />
          </div>
        {/if}

        {#if info.infoFirmaAcudiente}
          <div class="p-3 rounded-xl glass border border-white/5">
            <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Info Firma Acudiente</p>
            <p class="text-xs text-slate-400">{decodeHtml(resolveInfo(info.infoFirmaAcudiente))}</p>
          </div>
        {/if}
      {/if}
    </div>

    <div class="px-5 pb-5">
      <button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cerrar</button>
    </div>
  </div>
</div>
