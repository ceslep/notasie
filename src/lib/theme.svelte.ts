/**
 * Gestión de tema visual (modo claro por defecto).
 *
 * El tema se aplica con la clase `dark` sobre <html>; en ausencia de la clase
 * rige el modo claro. La preferencia del usuario se guarda en localStorage.
 */
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'notasie_theme'

function isTheme(v: unknown): v is Theme {
  return v === 'light' || v === 'dark'
}

function readStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (isTheme(v)) return v
  } catch {
    /* localStorage no disponible */
  }
  // Modo claro por defecto
  return 'light'
}

export const theme = $state({ current: 'light' as Theme })

function syncMetaMeta(t: Theme) {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', t === 'dark' ? '#0f172a' : '#f8fafc')
}

export function applyTheme(t: Theme) {
  theme.current = t
  const root = document.documentElement
  root.classList.toggle('dark', t === 'dark')
  root.dataset.theme = t
  root.style.colorScheme = t
  syncMetaMeta(t)
}

/** Lee la preferencia guardada y la aplica. Debe llamarse antes de montar la app. */
export function initTheme() {
  applyTheme(readStored())
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && isTheme(e.newValue)) applyTheme(e.newValue)
  })
}

export function setTheme(t: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, t)
  } catch {
    /* ignorar */
  }
  applyTheme(t)
}

export function toggleTheme() {
  setTheme(theme.current === 'dark' ? 'light' : 'dark')
}

/** Colores base para los diálogos de SweetAlert2 según el tema activo. */
export function swalTheme() {
  return theme.current === 'dark'
    ? { background: '#1e293b', color: '#f8fafc' }
    : { background: '#ffffff', color: '#0f172a' }
}
