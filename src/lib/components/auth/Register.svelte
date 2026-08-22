<script lang="ts">
  import { authApi, getIP } from '$lib/services/api'
  import Swal from 'sweetalert2'

  let { onClose }: { onClose?: () => void } = $props()

  let user = $state({
    email: '', identificacion: '', pass: '', pass2: '', full: '', genero: 'M', fdn: '', movil: '', address: '', foto: '',
  })
  let spn = $state(false)

  const validEmail = (s: string) => s !== '' && s.includes('@')

  async function verify() {
    if (!validEmail(user.email)) return
    const v = await authApi.verificarId(user.identificacion)
    if (v.verificado) {
      await Swal.fire({ title: 'Identificacion verificada', text: 'Usuario Valido', icon: 'success', timer: 2000 })
    } else {
      await Swal.fire({ icon: 'error', title: 'Identificacion incorrecta', text: 'Esa Identificacion no esta registrada en el sistema o el servidor se encuentra apagado' })
    }
  }

  const handleFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => { user.foto = ev.target?.result as string }
      reader.readAsDataURL(file)
    }
  }

  async function accept() {
    spn = true
    const ip = await getIP()
    const data = { ...user, genero: user.genero === 'M' ? '0' : '1', ip }
    try {
      const r = await authApi.register(data)
      if (r.msj) {
        await Swal.fire({ title: 'Registro exitoso', text: r.msj, icon: 'success', timer: 3000 })
        spn = false; onClose?.()
      } else {
        await Swal.fire({ title: 'ERROR', text: 'No se pudo completar el registro', icon: 'error' })
        spn = false
      }
    } catch {
      await Swal.fire({ icon: 'error', text: 'No se pudo completar el registro' })
      spn = false
    }
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10">
  <div class="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-5 py-4 rounded-t-3xl">
    <h3 class="text-lg font-bold">Registro</h3>
  </div>
  <form class="p-5 space-y-3" onsubmit={(e) => { e.preventDefault(); accept() }}>
    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-400">Identificacion</label>
        <input type="text" inputmode="numeric" class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" bind:value={user.identificacion} onblur={verify} required />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-400">Email</label>
        <input type="email" class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" bind:value={user.email} required />
      </div>
    </div>
    <div class="space-y-1">
      <label class="text-xs font-semibold text-slate-400">Nombres</label>
      <input type="text" class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" bind:value={user.full} required />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-400">Genero</label>
        <select class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" bind:value={user.genero}>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
      </div>
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-400">Fecha Nac</label>
        <input type="date" class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" bind:value={user.fdn} required />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-400">Movil</label>
        <input type="tel" class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" bind:value={user.movil} required />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-400">Direccion</label>
        <input type="text" class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" bind:value={user.address} required />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-400">Foto</label>
        <input type="file" accept="image/*" class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm" onchange={handleFileChange} required />
      </div>
      {#if user.foto}
        <img class="w-20 h-20 rounded-2xl object-cover mx-auto" src={user.foto} alt="" />
      {/if}
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-400">ContraseÃ±a</label>
        <input type="password" class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" bind:value={user.pass} required />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-400">Confirmar</label>
        <input type="password" class="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm" bind:value={user.pass2} required />
      </div>
    </div>
    <div class="flex flex-col gap-2 pt-2">
      <button type="submit" class="w-full rounded-2xl px-4 py-3 text-sm font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 disabled:opacity-50 active:scale-[0.98] transition-transform" disabled={spn}>
        Registrarse {#if spn}<span class="inline-block w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin ml-2"></span>{/if}
      </button>
      <button type="button" class="w-full rounded-2xl px-4 py-3 text-sm font-semibold bg-slate-100 text-slate-400 active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cancelar</button>
    </div>
  </form>
</div></div>


