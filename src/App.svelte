<script lang="ts">
  import { onMount } from 'svelte'
  import NavBar from './lib/components/NavBar.svelte'
  import Register from './lib/components/auth/Register.svelte'
  import Periodos from './lib/components/grades/Periodos.svelte'
  import ThreeBackground from './lib/components/ui/ThreeBackground.svelte'
  import Notifications from './lib/components/ui/Notifications.svelte'
  import ThemeToggle from './lib/components/ui/ThemeToggle.svelte'
  import SocialView from './lib/components/social/SocialView.svelte'
  import ModalSocialLogin from './lib/components/social/ModalSocialLogin.svelte'
  import { socialApi, type SocialSesion } from './lib/services/social'
  import { authApi, gradesApi, convivenciaApi } from './lib/services/api'
  import { setUser, updateUserFull } from './lib/stores.svelte'
  import { swalTheme } from './lib/theme.svelte'
  import { identifyStudent, resetAnalytics, trackPageView, trackLogout, trackEvent } from '$lib/analytics'
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

  // Contrasena de la sesion academica. Solo vive en sessionStorage mientras
  // dura la pestana y sirve para emitir el token de la red social sin volver a
  // pedir las credenciales al abrir la pestana Social.
  let pass = $state('')

  let dataEstudiante = $state<any>(null)
  let notas = $state<any[]>([])
  let notasLoaded = $state(false)
  let convivencia = $state<any[]>([])
  let notasDetalladas = $state<Record<string, any[]>>({})

  let showPeriodTabs = $state('UNO')
  let refreshing = $state(false)

  let linkedStudents = $state<any[]>([])
  let currentStudentIdx = $state(0)

  let touchStartY = $state(0)
  let touchDeltaY = $state(0)
  let isPulling = $state(false)
  let sessionStartTime = $state(Date.now())

  const SESSION_KEY = 'notasie_session'
  const SOCIAL_SESSION_KEY = 'notasie_social'

  // Red social
  let modo = $state<'notas' | 'social'>('notas')
  let sesionSocial = $state<SocialSesion | null>(null)
  let mostrarSocialLogin = $state(false)
  /** Desde donde se abrio la red social, para saber a donde volver. */
  let origenSocial = $state<'login' | 'notas'>('login')
  /** Pestana que estaba activa en las notas antes de saltar a la red social. */
  let tabPrevioSocial = $state('UNO')

  function cargarSesionSocial(): SocialSesion | null {
    try {
      const raw = sessionStorage.getItem(SOCIAL_SESSION_KEY)
      if (!raw) return null
      const data = JSON.parse(raw)
      return data?.estudiante && data?.token ? (data as SocialSesion) : null
    } catch {
      return null
    }
  }

  function guardarSesionSocial(s: SocialSesion) {
    sesionSocial = s
    try {
      sessionStorage.setItem(SOCIAL_SESSION_KEY, JSON.stringify(s))
    } catch {
      /* almacenamiento no disponible */
    }
  }

  function abrirRedSocial() {
    // Se entra SIEMPRE en modo lectura: no hace falta cuenta para mirar.
    // El login solo se pide al publicar o comentar (o desde "Entrar").
    origenSocial = 'login'
    modo = 'social'
    trackPageView('social_entrar', { invitado: !sesionSocial })
  }

  /**
   * Abre la red social desde la pestana Social del panel de notas.
   *
   * El token de la red social solo lo emite el servidor al validar la
   * contrasena, asi que se reutiliza la de la sesion academica (que sigue
   * guardada en sessionStorage mientras dure la pestana). Si no hay
   * contrasena disponible se entra en modo lectura, sin obligar a salir.
   */
  async function abrirSocialDesdeNotas() {
    // Se recuerda la pestana actual: al volver, el panel debe reabrirse en ella
    // y no en "Social", que solo es un acceso y no un contenido del panel.
    tabPrevioSocial = showPeriodTabs === 'Social' ? 'UNO' : showPeriodTabs
    origenSocial = 'notas'
    modo = 'social'
    trackPageView('social_desde_notas', { con_credenciales: Boolean(pass) })

    if (sesionSocial || !pass) return

    appLoading = true
    try {
      const r = await socialApi.login(estudiante, pass)
      guardarSesionSocial({
        estudiante: String(r.estudiante),
        nombres: String(r.nombres),
        nivel: String(r.nivel ?? ''),
        numero: String(r.numero ?? ''),
        token: String(r.token),
      })
    } catch {
      // Si el backend de la red social no esta disponible se sigue mostrando
      // el feed publico; no se interrumpe el acceso a las notas.
    } finally {
      appLoading = false
    }
  }

  function accederRedSocial(s: SocialSesion) {
    guardarSesionSocial(s)
    mostrarSocialLogin = false
    modo = 'social'
  }

  /** Vuelve de la red social al panel de notas, restaurando la pestana previa. */
  function volverDeSocial() {
    if (origenSocial === 'notas') {
      showPeriodTabs = tabPrevioSocial
    }
    modo = 'notas'
    trackPageView('social_volver', { origen: origenSocial })
  }

  function salirRedSocial() {
    try {
      sessionStorage.removeItem(SOCIAL_SESSION_KEY)
    } catch {
      /* ignorar */
    }
    sesionSocial = null
    // Si se llego desde el panel de notas, se vuelve ahi en vez de al login.
    modo = origenSocial === 'notas' ? 'notas' : 'social'
    trackPageView('social_logout')
  }

  function saveSession() {
    const data = { estudiante, nombres, nivel, numero, periodo, asignacion, photoURL, email, pass, showPeriodTabs, dataEstudiante, linkedStudents, currentStudentIdx }
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
    // Restaura la sesion de la red social, si el estudiante ya habia entrado.
    sesionSocial = cargarSesionSocial()

    const session = loadSession()
    if (session?.estudiante && session?.nombres) {
      appLoading = true
      try {
        estudiante = session.estudiante
        nombres = session.nombres
        nivel = session.nivel || ''
        numero = session.numero || ''
        periodo = session.periodo || ''
        asignacion = session.asignacion || '1'
        photoURL = session.photoURL || ''
        email = session.email || ''
        pass = session.pass || ''
        showPeriodTabs = session.showPeriodTabs || 'UNO'
        dataEstudiante = session.dataEstudiante || null
        linkedStudents = session.linkedStudents || []
        currentStudentIdx = session.currentStudentIdx || 0
        setUser({ displayName: session.nombres, email: session.email || '', photoURL: session.photoURL || '', phoneNumber: '' })
        if (session.dataEstudiante) updateUserFull({ ...session.dataEstudiante })
        sessionStartTime = Date.now()
        identifyStudent(session.estudiante, { nombre: session.nombres, nivel: session.nivel, email: session.email })
        trackPageView('app_restored', { period: session.showPeriodTabs })
        block = 'periodos'
        await loadNotas(showPeriodTabs)
        await loadConvivencia()
      } catch {
        clearSession()
        block = ''
        notas = []
        convivencia = []
        estudiante = ''
        nombres = ''
      } finally {
        appLoading = false
      }
    } else {
      trackPageView('landing')
    }
  })

  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  async function getIP() {
    const r = await fetch('https://api.ipify.org?format=json')
    return (await r.json()).ip
  }

  async function saveLog(data: any) {
    try {
      await authApi.saveLog({
        estudiante: data.estudiante ?? data.identificacion,
        nombres: data.nombres, nivel: data.nivel, numero: data.numero,
        movil: isMobile() ? 'si' : 'no', userAgent: navigator.userAgent,
        ip: await getIP(),
      })
    } catch {}
  }

  async function loadNotas(p: string) {
    notas = await gradesApi.getNotas(p, estudiante)
    notasLoaded = true
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
        pass = cla
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
        Swal.fire({ title: 'Acceso Denegado', text: 'Credenciales incorrectas', icon: 'error', ...swalTheme(), iconColor: '#ef4444', confirmButtonColor: '#6366f1' })
      }
    } catch {
      loging = false
      Swal.fire({ title: 'Error de conexion', text: 'Intenta de nuevo', icon: 'error', ...swalTheme(), iconColor: '#ef4444', confirmButtonColor: '#6366f1' })
    }
  }

  async function handleLogin(detail: any) {
    if (detail.text === 'Aceptar' && detail.result) {
      appLoading = true
      try {
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
        sessionStartTime = Date.now()
        identifyStudent(loginData.estudiante, { nombre: loginData.nombres, nivel: data.nivel, email: data.email })
        trackPageView('login_success', { student_id: loginData.estudiante, period: loginData.periodo })
        block = 'periodos'
        showPeriodTabs = loginData.periodo || 'UNO'
        await loadNotas(showPeriodTabs)
        await loadConvivencia()
        saveSession()
        Swal.fire({
          title: 'Bienvenido',
          text: loginData.nombres,
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
          ...swalTheme(),
          iconColor: '#10b981',
        })
      } catch {
        clearSession()
        block = ''
        notas = []
        convivencia = []
        estudiante = ''
        nombres = ''
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar los datos', icon: 'error', ...swalTheme(), iconColor: '#ef4444', confirmButtonColor: '#6366f1' })
      } finally {
        appLoading = false
      }
    } else if (detail.text === 'Aceptar' && !detail.result) {
      trackEvent('login_failed')
      Swal.fire({ title: 'Acceso Denegado', icon: 'error', ...swalTheme(), iconColor: '#ef4444' })
    } else if (detail.text === 'Registrarse') {
      block = 'register'
      trackPageView('register')
    }
  }

  async function handleTabChange(p: string) {
    if (p === 'Social') {
      // La pestana Social no carga notas: abre la red social sin salir del panel.
      await abrirSocialDesdeNotas()
      return
    }
    showPeriodTabs = p
    trackPageView('tab_changed', { tab: p })
    if (p === 'Concentrador') {
      const periodos = ['UNO', 'DOS', 'TRES', 'CUATRO']
      const todas: any[] = []
      for (const per of periodos) {
        const n = await gradesApi.getNotas(per, estudiante)
        if (n.length > 0) todas.push(...n)
      }
      notas = todas
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
    trackEvent('student_switched', { from: currentStudentIdx, to: idx, student_id: s.estudiante })
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
    trackLogout(Math.floor((Date.now() - sessionStartTime) / 1000))
    resetAnalytics()
    clearSession()
    block = ''
    loging = false
    trackPageView('login')
    notas = []
    convivencia = []
    estudiante = ''
    nombres = ''
    linkedStudents = []
    currentStudentIdx = 0
  }

  function handleRegisterClose() {
    block = ''
    trackPageView('login')
  }
</script>

<ThreeBackground />
<main
  class="relative min-h-screen z-10"
  ontouchstart={modo === 'social' ? undefined : handleTouchStart}
  ontouchmove={modo === 'social' ? undefined : handleTouchMove}
  ontouchend={modo === 'social' ? undefined : handleTouchEnd}
>
  {#if modo === 'social'}
    <SocialView
      sesion={sesionSocial}
      origen={origenSocial}
      onVolver={volverDeSocial}
      onSalirRed={salirRedSocial}
      onSolicitarLogin={() => {
        mostrarSocialLogin = true
        trackPageView('social_login_visto')
      }}
    />
  {:else}
  {#if block !== 'periodos'}
    <div class="fixed top-4 right-4 z-[90]">
      <ThemeToggle class="glass shadow-lg" />
    </div>
  {/if}
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
    <div class="fixed inset-0 z-[70] flex items-center justify-center app-page-bg">
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
          <h1 class="text-2xl font-extrabold tracking-tight app-loader-title">I.E. de Occidente</h1>
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
      onSocial={abrirSocialDesdeNotas}
    />
  {/if}

  {#if block === ''}
    <div class="flex flex-col items-center justify-center min-h-[90vh] px-6 py-12">
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
            <button class="text-xs text-slate-500 hover:text-indigo-400 transition-colors" onclick={() => { block = 'register'; trackPageView('register') }}>
              No tienes cuenta? <span class="font-semibold text-indigo-400">Registrate</span>
            </button>
          </div>

          <div class="mt-5 pt-5 border-t border-white/10 animate-in fade-in duration-500 delay-1000">
            <button
              type="button"
              onclick={abrirRedSocial}
              class="group w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl glass border-white/10 text-sm font-semibold text-slate-200 hover:border-indigo-500/50 hover:text-indigo-400 transition-all active:scale-[0.98]"
            >
              <span class="relative flex items-center gap-2.5">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                Red Social del Colegio
              </span>
            </button>
            <p class="mt-2 text-[10px] text-slate-500 text-center">
              Ver sin cuenta · para publicar y comentar se pide inicio de sesion
            </p>
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
      {notasLoaded}
      {notasDetalladas}
      {showPeriodTabs}
      onTabChange={handleTabChange}
      {convivencia}
      {refreshing}
      onRefresh={refreshData}
      HED={dataEstudiante?.HED || ''}
    />
  {/if}

  {#if block === 'periodos'}
    <Notifications {notas} {convivencia} {estudiante} />
  {/if}
  {/if}
</main>

{#if mostrarSocialLogin}
  <ModalSocialLogin onAcceso={accederRedSocial} onClose={() => (mostrarSocialLogin = false)} />
{/if}
