<script lang="ts">
  import { onMount } from 'svelte'
  import NavBar from './lib/components/NavBar.svelte'
  import Register from './lib/components/auth/Register.svelte'
  import Periodos from './lib/components/grades/Periodos.svelte'
  import ThreeBackground from './lib/components/ui/ThreeBackground.svelte'
  import { authApi, gradesApi, convivenciaApi } from './lib/services/api'
  import { setUser, updateUserFull } from './lib/stores.svelte'
  import Swal from 'sweetalert2'

  let block = $state('')
  let appLoading = $state(false)
  let usu = $state('')
  let cla = $state('')
  let loging = $state(false)

  let estudiante = $state('')
  let nombres = $state('')
  let nivel = $state('')
  let numero = $state('')
  let periodo = $state('')
  let asignacion = $state('')
  let photoURL = $state('')
  let email = $state('')

  let dataEstudiante = $state<any>(null)
  let notas = $state<any[]>([])
  let convivencia = $state<any[]>([])

  let showPeriodTabs = $state('UNO')

  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  async function getIP() {
    const r = await fetch('https://api.ipify.org?format=json')
    return (await r.json()).ip
  }

  async function getCoords() {
    if (navigator.geolocation) {
      return new Promise<any>((resolve) => {
        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null))
      })
    }
    return null
  }

  async function saveLog(data: any) {
    try {
      const position = await getCoords()
      await authApi.saveLog({
        estudiante: data.estudiante ?? data.identificacion,
        nombres: data.nombres, nivel: data.nivel, numero: data.numero,
        movil: isMobile() ? 'si' : 'no', userAgent: navigator.userAgent,
        ip: await getIP(),
        coords: position ? `${position.coords.latitude},${position.coords.longitude}` : '',
      })
    } catch {}
  }

  async function loadNotas(p: string) {
    notas = await gradesApi.getNotas(p, estudiante)
  }

  async function loadConvivencia() {
    convivencia = await convivenciaApi.getConvivencia(estudiante)
  }

  async function loginSubmit() {
    if (!usu || !cla) return
    loging = true
    try {
      const result = await authApi.login({ identificacion: usu, pass: cla })
      if (result.acceso === 'si') {
        const y = new Date().getFullYear()
        const [dr, drT] = await Promise.all([
          authApi.getRegister(usu),
          authApi.getRegisterT(usu),
        ])
        const dataRegistro = dr.filter((d: any) => d.year == y)
        const dataRegistroT = drT.filter((d: any) => d.year == y)
        handleLogin({ text: 'Aceptar', result: true, data: result, dataRegistro, dataRegistroT })
      } else {
        loging = false
        Swal.fire({ title: 'Acceso Denegado', text: 'Credenciales incorrectas', icon: 'error', background: '#1e293b', color: '#f8fafc', iconColor: '#ef4444', confirmButtonColor: '#6366f1' })
      }
    } catch {
      loging = false
      Swal.fire({ title: 'Error de conexion', text: 'Intenta de nuevo', icon: 'error', background: '#1e293b', color: '#f8fafc', iconColor: '#ef4444', confirmButtonColor: '#6366f1' })
    }
  }

  async function handleLogin(detail: any) {
    if (detail.text === 'Aceptar' && detail.result) {
      appLoading = true
      const loginData = detail.data
      const drT = detail.dataRegistroT
      const data = drT.length > 0 ? drT[0] : {}
      await saveLog(data.nombres ? data : loginData)
      nombres = loginData.nombres
      nivel = data.nivel || ''
      numero = data.numero || ''
      dataEstudiante = { ...data }
      estudiante = loginData.estudiante
      periodo = loginData.periodo
      asignacion = loginData.asignacion || '1'
      photoURL = data.photoURL || ''
      email = data.email || ''
      setUser({ displayName: loginData.nombres, email: data.email || '', photoURL: data.photoURL || '', phoneNumber: data.movil || '' })
      updateUserFull({ ...data })
      block = 'periodos'
      showPeriodTabs = loginData.periodo || 'UNO'
      await loadNotas(showPeriodTabs)
      await loadConvivencia()
      appLoading = false
      Swal.fire({
        title: 'Bienvenido',
        text: loginData.nombres,
        icon: 'success',
        timer: 1200,
        showConfirmButton: false,
        background: '#1e293b',
        color: '#f8fafc',
        iconColor: '#10b981',
      })
    } else if (detail.text === 'Aceptar' && !detail.result) {
      Swal.fire({ title: 'Acceso Denegado', icon: 'error', background: '#1e293b', color: '#f8fafc', iconColor: '#ef4444' })
    } else if (detail.text === 'Registrarse') {
      block = 'register'
    }
  }

  async function handleTabChange(p: string) {
    showPeriodTabs = p
    if (p === 'Concentrador') {
      notas = await gradesApi.getNotas('UNO', estudiante)
    } else if (p !== 'Convivencia') {
      await loadNotas(p)
    }
  }

  function handleLogout() {
    block = ''
    notas = []
    convivencia = []
    estudiante = ''
    nombres = ''
  }

  function handleRegisterClose() {
    block = ''
  }
</script>

<ThreeBackground />
<main class="relative min-h-screen z-10">
  {#if appLoading}
    <div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div class="flex flex-col items-center gap-5">
        <div class="relative">
          <div class="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
          <div class="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-b-purple-500 animate-spin" style="animation-duration: 1.5s; animation-direction: reverse;"></div>
          <div class="absolute inset-2 w-16 h-16 rounded-full border-4 border-transparent border-t-pink-500 animate-spin" style="animation-duration: 2s;"></div>
        </div>
        <div class="text-center">
          <p class="text-sm text-white font-semibold">Cargando datos academico</p>
          <p class="text-xs text-slate-400 mt-1">Un momento por favor...</p>
        </div>
      </div>
    </div>
  {/if}

  {#if block === 'periodos'}
    <NavBar
      {photoURL}
      {nombres}
      title={nivel && numero ? `${nivel}-${numero}` : ''}
      onLogout={handleLogout}
    />
  {/if}

  {#if block === ''}
    <div class="flex flex-col items-center justify-center min-h-[90vh] px-6 py-12">
      <div class="animate-in zoom-in duration-700 delay-200">
        <h1 class="text-3xl sm:text-4xl font-extrabold gradient-text text-center mb-2 tracking-tight leading-tight">I.E. de Occidente</h1>
        <p class="text-slate-500 text-[10px] text-center mb-8 tracking-[0.3em] uppercase">Plataforma Academica</p>
      </div>

      <div class="w-full max-w-sm mx-auto animate-in slide-in-from-bottom-8 duration-700 delay-300">
        <div class="glass-strong rounded-3xl p-6 sm:p-8 glow-card">
          <div class="text-center mb-6">
            <div class="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-2xl glow-indigo animate-in zoom-in duration-500 delay-500">
              <img src="https://app.iedeoccidente.com/eduadmin/escudohd.png" alt="I.E. de Occidente" class="w-full h-full object-contain" />
            </div>
            <h2 class="text-xl font-bold text-white animate-in fade-in duration-500 delay-700">Bienvenido</h2>
            <p class="text-xs text-slate-400 mt-1 animate-in fade-in duration-500 delay-700">Ingresa tus credenciales para continuar</p>
          </div>

          <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); loginSubmit() }}>
            <div class="animate-in slide-in-from-left-4 duration-500 delay-700">
              <div class="relative group">
                <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                </div>
                <input type="text" bind:value={usu} placeholder="Documento de identidad" class="w-full pl-12 pr-4 py-3.5 rounded-2xl glass border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" />
              </div>
            </div>
            <div class="animate-in slide-in-from-right-4 duration-500 delay-[800ms]">
              <div class="relative group">
                <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                </div>
                <input type="password" bind:value={cla} placeholder="Contrasena" class="w-full pl-12 pr-4 py-3.5 rounded-2xl glass border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all" />
              </div>
            </div>
            {#if loging}
              <div class="flex items-center justify-center gap-3 py-3 animate-in fade-in duration-300">
                <div class="w-5 h-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                <span class="text-xs text-slate-400">Verificando credenciales...</span>
              </div>
            {:else}
              <div class="animate-in slide-in-from-bottom-4 duration-500 delay-[900ms]">
                <button type="submit" class="group relative w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white transition-all duration-300 active:scale-[0.98] shadow-lg shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/50 overflow-hidden">
                  <span class="relative z-10 flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Entrar
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            {/if}
          </form>

          <div class="mt-6 text-center animate-in fade-in duration-500 delay-1000">
            <button class="text-xs text-slate-500 hover:text-indigo-400 transition-colors" onclick={() => block = 'register'}>
              No tienes cuenta? <span class="font-semibold text-indigo-400">Registrate</span>
            </button>
          </div>
        </div>
      </div>

      <div class="mt-10 flex items-center gap-3 text-slate-600 animate-in fade-in duration-500 delay-1000">
        <div class="flex gap-1">
          <div class="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></div>
          <div class="w-1 h-1 rounded-full bg-purple-500 animate-pulse" style="animation-delay: 0.2s"></div>
          <div class="w-1 h-1 rounded-full bg-pink-500 animate-pulse" style="animation-delay: 0.4s"></div>
        </div>
        <span class="text-[10px] tracking-widest">SISTEMA EN LINEA</span>
      </div>
    </div>
  {/if}

  {#if block === 'register'}
    <Register onClose={handleRegisterClose} />
  {/if}

  {#if block === 'periodos'}
    <Periodos
      {estudiante}
      {nivel}
      {numero}
      {asignacion}
      {nombres}
      {notas}
      {showPeriodTabs}
      onTabChange={handleTabChange}
      {convivencia}
    />
  {/if}
</main>
