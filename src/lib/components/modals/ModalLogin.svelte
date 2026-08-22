<script lang="ts">
  import { authApi } from '$lib/services/api'
  import Swal from 'sweetalert2'
  import ListaRegistrados from '../auth/ListaRegistrados.svelte'

  let { open = true, onLogin, onCancel, onRegister }: {
    open?: boolean; onLogin?: (d: any) => void; onCancel?: () => void; onRegister?: () => void
  } = $props()

  let ingresando = $state(false)
  let listado = $state(false)
  let listadoT = $state(false)
  let openListado = $state(false)
  let openListadoT = $state(false)
  let listaRegistrados = $state<any[]>([])
  let listaRegistradosT = $state<any[]>([])
  let spnlt = $state(false)
  let user = $state({ identificacion: '', pass: '' })

  async function aceptar() {
    if (!user.identificacion || !user.pass) return
    ingresando = true
    try {
      const result = await authApi.login(user)
      if (result.acceso === 'si') {
        const y = new Date().getFullYear()
        const [dr, drT] = await Promise.all([
          authApi.getRegister(user.identificacion),
          authApi.getRegisterT(user.identificacion),
        ])
        open = false
        ingresando = false
        onLogin?.({ text: 'Aceptar', result: true, data: result,
          dataRegistro: dr.filter((d: any) => d.year == y),
          dataRegistroT: drT.filter((d: any) => d.year == y) })
      } else {
        ingresando = false
        await Swal.fire({ title: 'Acceso Denegado', text: 'Credenciales incorrectas', icon: 'error', background: '#1e293b', color: '#f8fafc', iconColor: '#ef4444', confirmButtonColor: '#6366f1' })
      }
    } catch {
      ingresando = false
      await Swal.fire({ title: 'Error de conexion', text: 'Intenta de nuevo', icon: 'error', background: '#1e293b', color: '#f8fafc', iconColor: '#ef4444', confirmButtonColor: '#6366f1' })
    }
  }

  const detectRegister = async () => {
    if (user.identificacion !== '') {
      const r = await authApi.detectRegister(user.identificacion)
      if (r.registrado === 'no' && !user.identificacion.includes('00000000000') && !user.identificacion.includes('11111111111') && !listado && !listadoT) {
        await Swal.fire({ title: 'No registrado', text: 'Por favor registrese', icon: 'info', confirmButtonText: 'Aceptar', background: '#1e293b', color: '#f8fafc', iconColor: '#3b82f6', confirmButtonColor: '#6366f1' })
        user.identificacion = ''
      }
    }
  }

  const openL = async () => { spnlt = true; openListado = true; listaRegistrados = await authApi.getRegisters(); spnlt = false }
  const openLT = async () => {
    spnlt = true
    const l = await authApi.getRegisterT('0')
    listaRegistradosT = l.map((x: any) => ({ identificacion: x.estudiante, nombres: x.nombres, photoURL: './estudiante1.png', year: x.year })).sort((a: any, b: any) => a.nombres > b.nombres ? 1 : -1)
    openListadoT = true; spnlt = false
  }

  const selectStudent = (id: string, pass: string) => { openListado = false; user.identificacion = id; user.pass = pass; aceptar() }
  const selectTeacher = (id: string, pass: string) => { openListadoT = false; user.identificacion = id; user.pass = pass; aceptar() }

  const keypp = (e: KeyboardEvent) => {
    openListado = false; openListadoT = false
    if (e.key === 'F4') openL()
    if (e.key === 'F2') openLT()
  }

  $effect(() => { listado = user.identificacion.includes('0000000000') })
  $effect(() => { listadoT = user.identificacion.includes('11111111111') })
</script>

<svelte:window onkeydown={keypp} />

{#if openListado}
  <ListaRegistrados {listaRegistrados} onClose={() => openListado = false} onSelect={(id, p) => selectStudent(id, p)} />
{/if}
{#if openListadoT}
  <ListaRegistrados listaRegistrados={listaRegistradosT} onClose={() => openListadoT = false} onSelect={(id, p) => selectTeacher(id, p)} />
{/if}

{#if ingresando}
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
    <div class="flex flex-col items-center gap-4">
      <div class="relative">
        <div class="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <div class="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-b-purple-500 animate-spin" style="animation-duration: 1.5s; animation-direction: reverse;"></div>
      </div>
      <p class="text-sm text-slate-300 font-medium">Verificando credenciales...</p>
    </div>
  </div>
{/if}

{#if open && !ingresando}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick={() => onCancel?.()} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && onCancel?.()}></div>
    <div class="relative w-full max-w-sm animate-scale-in">
      <div class="absolute -inset-1 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/30 rounded-[2rem] blur-xl opacity-60"></div>
      <div class="relative glass-strong rounded-[2rem] overflow-hidden border border-white/10">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full"></div>
        <div class="p-8 text-center">
          <div class="w-20 h-20 mx-auto mb-5 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 rotate-3 hover:rotate-0 transition-transform duration-500">
            <svg class="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <h2 class="text-xl font-bold text-white mb-1">Bienvenido</h2>
          <p class="text-xs text-slate-400">Ingresa tus credenciales para continuar</p>
        </div>
        <form class="px-6 pb-6 space-y-4" onsubmit={(e) => { e.preventDefault(); aceptar() }}>
          <div class="space-y-2">
            <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Identificacion
              {#if listado}<button type="button" class="text-indigo-400 text-[10px] underline hover:text-indigo-300" onclick={openL}>Listado</button>{/if}
              {#if listadoT}<button type="button" class="text-indigo-400 text-[10px] underline hover:text-indigo-300" onclick={openLT}>Listado</button>{/if}
              {#if spnlt}<div class="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>{/if}
            </label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <input type="text" inputmode="numeric" placeholder="Numero de documento" class="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-white/8 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-300" required bind:value={user.identificacion} onblur={detectRegister} autocomplete="off" />
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Contrasena</label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <input type="password" placeholder="Tu contrasena" class="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-white/8 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-300" required bind:value={user.pass} />
            </div>
          </div>
          <div class="flex flex-col gap-2.5 pt-3">
            <button type="submit" class="w-full py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white disabled:opacity-40 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.97] transition-all duration-300 disabled:cursor-not-allowed" disabled={user.identificacion === '' || user.pass === ''}>
              Iniciar Sesion
            </button>
            <div class="flex gap-2">
              <button type="button" class="flex-1 py-2.5 rounded-2xl text-xs font-semibold glass text-slate-400 hover:text-white hover:bg-white/10 active:scale-[0.97] transition-all" onclick={() => { onCancel?.(); onRegister?.() }}>Registrarse</button>
              <button type="button" class="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-400 active:scale-[0.97] transition-all" onclick={() => onCancel?.()}>Cancelar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
