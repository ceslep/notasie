<script lang="ts">
  import { onMount } from 'svelte'
  import NavBar from './lib/components/NavBar.svelte'
  import Register from './lib/components/auth/Register.svelte'
  import Periodos from './lib/components/grades/Periodos.svelte'
  import ThreeBackground from './lib/components/ui/ThreeBackground.svelte'
  import Notifications from './lib/components/ui/Notifications.svelte'
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
  let notasDetalladas = $state<Record<string, any[]>>({})

  let showPeriodTabs = $state('UNO')
  let refreshing = $state(false)

  let linkedStudents = $state<any[]>([])
  let currentStudentIdx = $state(0)

  let touchStartY = $state(0)
  let touchDeltaY = $state(0)
  let isPulling = $state(false)

  const SESSION_KEY = 'notasie_session'

  function saveSession() {
    const data = { estudiante, nombres, nivel, numero, periodo, asignacion, photoURL, email, showPeriodTabs, dataEstudiante, linkedStudents, currentStudentIdx }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  }

  function loadSession(): any {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY)
  }

  onMount(async () => {
    const session = loadSession()
    if (session?.estudiante && session?.nombres) {
      appLoading = true
      estudiante = session.estudiante
      nombres = session.nombres
      nivel = session.nivel || ''
      numero = session.numero || ''
      periodo = session.periodo || ''
      asignacion = session.asignacion || '1'
      photoURL = session.photoURL || ''
      email = session.email || ''
      showPeriodTabs = session.showPeriodTabs || 'UNO'
      dataEstudiante = session.dataEstudiante || null
      linkedStudents = session.linkedStudents || []
      currentStudentIdx = session.currentStudentIdx || 0
      setUser({ displayName: session.nombres, email: session.email || '', photoURL: session.photoURL || '', phoneNumber: '' })
      if (session.dataEstudiante) updateUserFull({ ...session.dataEstudiante })
      block = 'periodos'
      await loadNotas(showPeriodTabs)
      await loadConvivencia()
      appLoading = false
    }
  })

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
    // Cargar notas detalladas de cada materia en paralelo
    const detMap: Record<string, any[]> = {}
    await Promise.all(
      notas.map(async (n: any) => {
        try {
          const det = await gradesApi.getNotasDetallado(estudiante, n.asignatura, p)
          detMap[n.asignatura] = det.filter((d: any) => d.Nota !== null)
        } catch {
          detMap[n.asignatura] = []
        }
      })
    )
    notasDetalladas = detMap
  }

  async function loadConvivencia() {
    convivencia = await convivenciaApi.getConvivencia(estudiante)
  }

  async function refreshData() {
    refreshing = true
    if (showPeriodTabs === 'Estadisticas') {
      await handleTabChange('Estadisticas')
    } else if (showPeriodTabs === 'Concentrador') {
      notas = await gradesApi.getNotas('UNO', estudiante)
    } else {
      await loadNotas(showPeriodTabs)
    }
    await loadConvivencia()
    refreshing = false
  }

  function handleTouchStart(e: TouchEvent) {
    if (window.scrollY === 0) {
      touchStartY = e.touches[0].clientY
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (window.scrollY === 0 && touchStartY > 0) {
      touchDeltaY = Math.max(0, e.touches[0].clientY - touchStartY)
      isPulling = touchDeltaY > 10
    }
  }

  async function handleTouchEnd() {
    if (touchDeltaY > 80 && !refreshing) {
      await refreshData()
    }
    touchStartY = 0
    touchDeltaY = 0
    isPulling = false
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
      linkedStudents = [{ estudiante: loginData.estudiante, nombres: loginData.nombres, nivel: data.nivel, numero: data.numero, photoURL: data.photoURL }]
      currentStudentIdx = 0
      setUser({ displayName: loginData.nombres, email: data.email || '', photoURL: data.photoURL || '', phoneNumber: data.movil || '' })
      updateUserFull({ ...data })
      block = 'periodos'
      showPeriodTabs = loginData.periodo || 'UNO'
      await loadNotas(showPeriodTabs)
      await loadConvivencia()
      saveSession()
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
    } else if (p === 'Estadisticas') {
      // Cargar notas de todos los periodos para estadísticas completas
      const periodos = ['UNO', 'DOS', 'TRES', 'CUATRO', 'FINAL']
      const todas: any[] = []
      for (const per of periodos) {
        const n = await gradesApi.getNotas(per, estudiante)
        if (n.length > 0) todas.push(...n)
      }
      // Deduplicar por asignatura, manteniendo el último valor encontrado
      const seen = new Map<string, any>()
      for (const t of todas) seen.set(t.asignatura, t)
      notas = Array.from(seen.values())
    } else if (p !== 'Convivencia') {
      await loadNotas(p)
    }
  }

  async function switchStudent(idx: number) {
    if (idx === currentStudentIdx || idx < 0 || idx >= linkedStudents.length) return
    const s = linkedStudents[idx]
    currentStudentIdx = idx
    estudiante = s.estudiante
    nombres = s.nombres
    nivel = s.nivel
    numero = s.numero
    photoURL = s.photoURL || ''
    await loadNotas(showPeriodTabs)
    await loadConvivencia()
    saveSession()
  }

  function handleLogout() {
    clearSession()
    block = ''
    notas = []
    convivencia = []
    estudiante = ''
    nombres = ''
    linkedStudents = []
    currentStudentIdx = 0
  }

  function handleRegisterClose() {
    block = ''
  }
</script>

<ThreeBackground />
<main
  class="relative min-h-screen z-10"
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
>
  {#if refreshing || isPulling}
    <div class="fixed top-0 left-0 right-0 z-[80] flex items-center justify-center transition-all duration-200" style="height: {Math.min(touchDeltaY, 100)}px; opacity: {Math.min(touchDeltaY / 80, 1)}">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-indigo-400 {refreshing ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={!refreshing ? `transform: rotate(${Math.min(touchDeltaY * 2, 180)}deg)` : ''}>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span class="text-xs text-slate-400">{refreshing ? 'Actualizando...' : 'Suelta para actualizar'}</span>
      </div>
    </div>
  {/if}
  {#if appLoading}
    <div class="fixed inset-0 z-[70] flex items-center justify-center" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);">
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
      </div>
      <div class="relative flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
        <div class="relative">
          <img src="https://app.iedeoccidente.com/eduadmin/escudohd.png" alt="Escudo" class="w-24 h-24 object-contain drop-shadow-2xl" style="filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.4));" />
          <div class="absolute -inset-4 rounded-full border border-indigo-500/20 animate-ping" style="animation-duration: 3s;"></div>
        </div>
        <div class="text-center">
          <h1 class="text-2xl font-extrabold tracking-tight" style="background: linear-gradient(135deg, #f8fafc, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">I.E. de Occidente</h1>
          <p class="text-xs text-slate-500 mt-1 tracking-widest uppercase">Plataforma Academica</p>
        </div>
        <div class="flex gap-1.5">
          <div class="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 0ms;"></div>
          <div class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 150ms;"></div>
          <div class="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style="animation-delay: 300ms;"></div>
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
      {refreshing}
      onRefresh={refreshData}
      {linkedStudents}
      {currentStudentIdx}
      onSwitchStudent={switchStudent}
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
                <div class="absolute left-3 top-1/2 -translate-y-1/2">
                  <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-dae1lHATNY8hkh3GxeAnScrtd34Ii5.png" alt="" class="w-6 h-6 object-contain" />
                </div>
                <input type="text" bind:value={usu} placeholder="Documento de identidad" class="w-full pl-11 pr-4 py-3.5 rounded-2xl glass border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" />
              </div>
            </div>
            <div class="animate-in slide-in-from-right-4 duration-500 delay-[800ms]">
              <div class="relative group">
                <div class="absolute left-3 top-1/2 -translate-y-1/2">
                  <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-1ZcsBwwKPF9lpnaWTFwUAmxkHIeKXD.png" alt="" class="w-6 h-6 object-contain" />
                </div>
                <input type="password" bind:value={cla} placeholder="Contrasena" class="w-full pl-11 pr-4 py-3.5 rounded-2xl glass border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all" />
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
                    <img src="https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-TL7loecwMkvBVppFbrNBWhOuzhKwtB.png" alt="" class="w-5 h-5 object-contain" />
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

  {#if block === 'periodos'}      <Periodos
      {estudiante}
      {nivel}
      {numero}
      {asignacion}
      {nombres}
      {notas}
      {notasDetalladas}
      {showPeriodTabs}
      onTabChange={handleTabChange}
      {convivencia}
      {refreshing}
      onRefresh={refreshData}
    />
  {/if}

  {#if block === 'periodos'}
    <Notifications {notas} {convivencia} {estudiante} />
  {/if}
</main>
