<script lang="ts">
  import type { Nota } from '$lib/types'

  let { notas = [], nombres = '', estudiante = '', nivel = '', numero = '', periodo = '' }: {
    notas: Nota[]; nombres: string; estudiante: string; nivel: string; numero: string; periodo: string
  } = $props()

  let capturing = $state(false)

  function gradeColor(v: string) {
    const f = parseFloat(v)
    if (f >= 4.5) return '#10b981'
    if (f >= 3.5) return '#3b82f6'
    if (f >= 3.0) return '#f59e0b'
    return '#ef4444'
  }

  function buildHtml(): string {
    const year = new Date().getFullYear()
    const hasDocente = notas.some(n => n.docente)
    const docenteHeader = hasDocente ? '<th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em">Docente</th>' : ''
    const rows = notas.map(n => {
      const color = gradeColor(n.valoracion)
      const docenteCell = hasDocente ? `<td style="padding:10px 14px;font-size:13px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.06)">${n.docente || ''}</td>` : ''
      return `
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#e2e8f0;border-bottom:1px solid rgba(255,255,255,0.06)">${n.asignatura}</td>
          ${docenteCell}
          <td style="padding:10px 14px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06)">
            <span style="display:inline-block;min-width:42px;padding:4px 10px;border-radius:10px;background:${color}22;color:${color};font-weight:700;font-size:13px">${parseFloat(n.valoracion || '0').toFixed(1)}</span>
          </td>
          <td style="padding:10px 14px;text-align:center;font-size:13px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.06)">${n.cantidadInasistencias || 0}</td>
        </tr>`
    }).join('')

    return `
      <div style="font-family:system-ui,-apple-system,sans-serif;width:480px;background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%);border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);box-shadow:0 25px 50px rgba(0,0,0,0.5)">
        <div style="padding:28px 28px 0;text-align:center">
          <img src="https://app.iedeoccidente.com/eduadmin/escudohd.png" alt="Escudo" style="width:56px;height:56px;object-fit:contain;margin-bottom:8px" />
          <h2 style="margin:0;font-size:17px;font-weight:800;color:#f8fafc;letter-spacing:-0.02em">I.E. de Occidente</h2>
          <p style="margin:2px 0 0;font-size:10px;color:#64748b;letter-spacing:0.15em;text-transform:uppercase">Reporte Academico ${year}</p>
        </div>
        <div style="padding:20px 28px 0">
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:16px 18px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:14px;font-weight:700;color:#f1f5f9">${nombres}</span>
              ${nivel && numero ? `<span style="font-size:11px;padding:3px 10px;border-radius:8px;background:rgba(99,102,241,0.15);color:#a5b4fc;font-weight:600">${nivel}-${numero}</span>` : ''}
            </div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">ID: ${estudiante} &middot; Periodo: ${periodo}</div>
          </div>
        </div>
        <div style="padding:16px 20px 24px">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em">Asignatura</th>
                ${docenteHeader}
                <th style="padding:8px 14px;text-align:center;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em">Nota</th>
                <th style="padding:8px 14px;text-align:center;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em">Inas.</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="padding:12px 20px;text-align:center;border-top:1px solid rgba(255,255,255,0.05)">
          <span style="font-size:10px;font-weight:600;color:#6366f1">I.E. de Occidente &middot; ${year}</span>
        </div>
      </div>`
  }

  async function captureAndShare() {
    if (capturing) return
    capturing = true
    try {
      const html2canvas = (await import('html2canvas')).default
      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;'
      wrapper.innerHTML = buildHtml()
      document.body.appendChild(wrapper)

      const canvas = await html2canvas(wrapper.firstElementChild as HTMLElement, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
      })
      document.body.removeChild(wrapper)

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob(b => resolve(b!), 'image/png', 1)
      )
      const file = new File([blob], 'reporte-notas.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Reporte de Notas - ${nombres}`,
          text: `Calificaciones ${periodo} - ${nivel}-${numero}`,
          files: [file],
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte-notas-${estudiante}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error('Error al generar imagen:', e)
    } finally {
      capturing = false
    }
  }

  function printReport() {
    const hasDocentePrint = notas.some(n => n.docente)
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Reporte - ${nombres}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:system-ui,-apple-system,sans-serif; background:#0f172a; color:#f8fafc; padding:24px; }
  .card { max-width:560px; margin:0 auto; background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%); border-radius:20px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; }
  .header { text-align:center; padding:28px 24px 0; }
  .header img { width:52px; height:52px; margin-bottom:8px; }
  .header h1 { font-size:18px; font-weight:800; letter-spacing:-0.02em; }
  .header p { font-size:10px; color:#64748b; letter-spacing:0.15em; text-transform:uppercase; margin-top:2px; }
  .info { padding:16px 24px 0; }
  .info-box { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; }
  .student-name { font-size:14px; font-weight:700; }
  .student-id { font-size:11px; color:#64748b; margin-top:2px; }
  .badge { font-size:11px; padding:3px 10px; border-radius:8px; background:rgba(99,102,241,0.15); color:#a5b4fc; font-weight:600; }
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  th { padding:8px 14px; text-align:left; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.1em; }
  th:nth-child(3), th:nth-child(4) { text-align:center; }
  td { padding:10px 14px; font-size:13px; color:#e2e8f0; border-bottom:1px solid rgba(255,255,255,0.06); }
  td:nth-child(3), td:nth-child(4) { text-align:center; }
  .grade { display:inline-block; min-width:42px; padding:4px 10px; border-radius:10px; font-weight:700; font-size:13px; }
  .footer { padding:12px 20px; text-align:center; border-top:1px solid rgba(255,255,255,0.05); }
  .footer span { font-size:10px; font-weight:600; color:#6366f1; }
  @media print {
    body { background:#fff; padding:12px; }
    .card { border:1px solid #e2e8f0; background:#fff; }
    .header h1, .student-name { color:#0f172a; }
    .info-box { background:#f8fafc; border-color:#e2e8f0; }
    .student-id { color:#64748b; }
    .badge { background:#e0e7ff; color:#4338ca; }
    th { color:#64748b; }
    td { color:#1e293b; border-bottom-color:#e2e8f0; }
    .footer span { color:#4338ca; }
  }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <img src="https://app.iedeoccidente.com/eduadmin/escudohd.png" alt="Escudo" />
      <h1>I.E. de Occidente</h1>
      <p>Reporte Academico ${new Date().getFullYear()}</p>
    </div>
    <div class="info">
      <div class="info-box">
        <div>
          <div class="student-name">${nombres}</div>
          <div class="student-id">ID: ${estudiante} &middot; Periodo: ${periodo}</div>
        </div>
        ${nivel && numero ? `<span class="badge">${nivel}-${numero}</span>` : ''}
      </div>
    </div>
    <div style="padding:16px 20px 24px">
      <table>
        <thead>
          <tr><th>Asignatura</th>${hasDocentePrint ? '<th>Docente</th>' : ''}<th>Nota</th><th>Inas.</th></tr>
        </thead>
        <tbody>
          ${notas.map(n => {
            const c = gradeColor(n.valoracion)
            const docenteTd = hasDocentePrint ? `<td style="color:#64748b">${n.docente || ''}</td>` : ''
            return `<tr>
              <td>${n.asignatura}</td>
              ${docenteTd}
              <td><span class="grade" style="background:${c}22;color:${c}">${parseFloat(n.valoracion || '0').toFixed(1)}</span></td>
              <td style="color:#64748b">${n.cantidadInasistencias || 0}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="footer"><span>I.E. de Occidente &middot; ${new Date().getFullYear()}</span></div>
  </div>
</body>
</html>`

    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      setTimeout(() => w.print(), 400)
    }
  }
</script>

<div class="flex gap-2">
  <button
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50 glass text-indigo-300 hover:bg-indigo-500/20 border border-white/5"
    disabled={capturing}
    onclick={captureAndShare}
  >
    {#if capturing}
      <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      Generando...
    {:else}
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
      Compartir
    {/if}
  </button>
  <button
    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 glass text-emerald-300 hover:bg-emerald-500/20 border border-white/5"
    onclick={printReport}
  >
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
    Imprimir
  </button>
</div>
