import type { LoginResult, StudentData } from '$lib/types'

const BASE_URL = 'https://app.iedeoccidente.com'

async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
  return response.json()
}

export const authApi = {
  login: (user: { identificacion: string; pass: string }) =>
    apiPost<LoginResult>('/est/php/login.php', user),
  detectRegister: (identificacion: string) =>
    apiPost<{ registrado: string }>('/est/php/detectRegister.php', { identificacion }),
  getRegister: (estudiante: string) =>
    apiPost<StudentData[]>('/est/php/getRegister.php', { estudiante }),
  getRegisterT: (estudiante: string) =>
    apiPost<StudentData[]>('/est/php/getRegisterT.php', { estudiante }),
  getRegisters: () =>
    apiPost<Record<string, unknown>[]>('/est/php/GetRegisters.php', {}),
  getRegistersT: () =>
    apiPost<Record<string, unknown>[]>('/est/php/GetRegistersT.php', {}),
  register: (data: Record<string, unknown>) =>
    apiPost<{ msj: string }>('/est/php/register.php', data),
  verificarId: (identificacion: string) =>
    apiPost<{ verificado: boolean }>('/est/php/verificarId.php', { identificacion }),
  saveLog: (data: Record<string, unknown>) =>
    apiPost<unknown>('/est/php/saveLog.php', data),
}

export const gradesApi = {
  getNotas: (periodo: string, estudiante: string) =>
    apiPost<any[]>('/est/php/getNotas.php', { periodo, estudiante }),
  getNotasDetallado: (estudiante: string, asignatura: string, periodo: string) =>
    apiPost<any[]>('/est/php/GetNotasDetallado.php', { estudiante, asignatura, periodo }),
  getInasistencias: (estudiante: string, asignatura: string, periodo: string) =>
    apiPost<any[]>('/est/php/GetInasistencias.php', { estudiante, asignatura, periodo }),
  getExcusas: (estudiante: string, periodo: string) =>
    apiPost<{ excusas: any[]; total: number }>('/est/php/GetExcusas.php', { estudiante, periodo }),
  getDescripcion: (estudiante: string, asignatura: string, valoracion: string, periodo: string, docente: string) =>
    apiPost<any[]>('/est/php/GetDescripcion.php', { estudiante, asignatura, valoracion, periodo, docente }),
  getPromedios: (estudiante: string, periodo: string, asignacion: string) =>
    apiPost<any[]>('/est/php/GetPromedios.php', { estudiante, periodo, asignacion }),
  getPromedioGeneral: (estudiante: string, periodo: string, asignacion: string) =>
    apiPost<any[]>('/est/php/GetPromedioGeneral.php', { estudiante, periodo, asignacion }),
  getInfoAcad: (asignacion: string, nivel: number, valoract: number, asignatura: string, periodo: string, HED: string, grado: string) =>
    apiPost<{ desempeno: string; descripcion: string }>('/est/php/getInfoAcad.php', { asignacion, nivel, valoract, asignatura, periodo, HED, grado }),
}

export const puestosApi = {
  getIE: (asignacion: string, year: string, periodo: string) =>
    apiPost<any[]>('/generaPuestos2.php', { asignacion, year, periodo }),
  getGrupo: (estudiante: string, year: string, periodo: string, asignacion: string) =>
    apiPost<any[]>('/generaPuestosGrupo2.php', { estudiante, year, periodo, asignacion }),
}

export const convivenciaApi = {
  getConvivencia: (estudiante: string) =>
    apiPost<any[]>('/est/php/getConvivencia.php', { estudiante }),
  getConsolidado: (estudiante: string, year: number) =>
    apiPost<any[]>('/consolidadoConvivenciaEstudiante.php', { estudiante, year }),
  getDetallado: (ind: string, year: number) =>
    apiPost<any[]>('/convivenciaDetallado.php', { ind, year }),
}

export const reclamoApi = {
  guardar: (data: Record<string, unknown>) =>
    apiPost<{ mensaje: string }>('/est/php/GuardarReclamo.php', data),
}

export async function getIP(): Promise<string> {
  const response = await fetch('https://api.ipify.org?format=json')
  const data = await response.json()
  return data.ip
}
