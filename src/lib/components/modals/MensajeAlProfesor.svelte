<script lang="ts">
  import { reclamoApi, getIP } from '$lib/services/api'
  import Swal from 'sweetalert2'

  let { docente = '', asignatura = '', onClose }: { docente?: string; asignatura?: string; onClose?: () => void } = $props()

  let masclaV = $state(false)
  let asigV = $state(false)
  let mensaje = $state('')

  const validInput = (s: string) => s !== '' && s.length >= 5 && s.includes(' ')

  async function send() {
    const ip = await getIP()
    const { value } = await Swal.fire({
      title: 'Enviar Mensaje',
      text: 'Usted estara enviando un mensaje a la institucion',
      input: 'text',
      showCancelButton: true,
      icon: 'question',
    })
    if (value) {
      const r = await reclamoApi.guardar({ tipo: 'reclamo', usuario: '', asunto: 'Mensaje estudiante', pass: 'e*' + mensaje + '*', ip })
      if (r.mensaje) {
        await Swal.fire({ title: 'Mensaje enviado', text: r.mensaje, icon: 'success', timer: 3000 })
        mensaje = ''; masclaV = false; asigV = false
        onClose?.()
      }
    }
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" role="button" tabindex="-1" onclick={() => onClose?.()} onkeydown={(e) => e.key === 'Escape' && onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10">
  <div class="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-white px-5 py-3 rounded-t-3xl flex items-center justify-between">
    <div class="flex items-center gap-2">
      <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-lp9vjuXTCqeB9yhVXBoBmyqdy8e9jv.png" alt="" class="w-6 h-6 object-contain" />
      <h3 class="text-base font-bold">Mensaje al Profesor</h3>
    </div>
    <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
  </div>
  <div class="p-5 space-y-3">
    <label class="text-xs font-semibold text-slate-600" for="msg-text">Mensaje</label>
    <textarea id="msg-text" rows="4" bind:value={mensaje} class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"></textarea>
    <div class="space-y-1">
      <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input type="checkbox" bind:checked={masclaV} class="rounded text-emerald-500" /> El nombre del docente es correcto?
      </label>
      <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
        <input type="checkbox" bind:checked={asigV} class="rounded text-emerald-500" /> La asignatura es correcta?
      </label>
    </div>
  </div>
  <div class="px-5 pb-5 flex gap-2">
    <button class="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cerrar</button>
    <button class="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-white disabled:opacity-50 active:scale-[0.98] transition-transform" disabled={!validInput(mensaje) || !masclaV || !asigV} onclick={send}>Enviar</button>
  </div>
</div></div>


