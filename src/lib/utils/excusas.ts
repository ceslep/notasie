import type { Excusa, Inasistencia } from '$lib/types'

/**
 * Cruce entre las inasistencias y la tabla `excusas`.
 *
 * El servidor arma el texto de la excusa dentro de GetInasistencias.php con
 * este join:
 *
 *   left join excusas on inasistencia.estudiante = excusas.estudiante
 *                     and inasistencia.fecha      = excusas.fecha
 *   ... if(excusas.hora_salida = 'Permiso por todo el dia',
 *          concat_ws(' ', excusas.motivo, excusas.motivo_permiso),
 *       if(inasistencia.hora_clase = excusas.hora_salida,
 *          concat_ws(' ', excusas.motivo, excusas.motivo_permiso), 'No'))
 *
 * Ese join tiene dos fugas: no compara el año (una excusa de otro año se pega
 * a la inasistencia del mismo dia y mes) y falla en silencio cuando
 * `hora_salida` viene vacio o 'NO APLICA', devolviendo 'No' aunque la excusa
 * exista. Estas funciones hacen el mismo cruce pero comparando fechas reales y
 * sin perder las excusas validas.
 */

/** Permiso que cubre todas las clases de ese dia. */
const PERMISO_TODO_EL_DIA = 'permiso por todo el dia'
/** Permiso que cubre varios dias seguidos: aplica a cualquier hora de esas fechas. */
const PERMISO_VARIOS_DIAS = 'permiso por varios dias'
/** Valores de `hora_salida` que NO identifican una hora de clase. */
const HORA_SALIDA_SIN_HORA = ['no aplica', 'ninguna', 'no']

/**
 * Normaliza una fecha a `YYYY-MM-DD` para poder comparar fechas que vienen de
 * tablas distintas (inasistencias y excusas) con formatos distintos
 * (`2026-09-22`, `2026/09/22`, `22/09/2026`, con hora, con ISO completo).
 * Devuelve '' cuando no se puede interpretar.
 */
export function normalizarFecha(valor: unknown): string {
  const texto = String(valor ?? '').trim()
  if (texto === '') return ''
  const digitos = texto.replace(/[^0-9]/g, '')
  if (digitos.length < 8) return ''

  // Formatos con año de 4 cifras al inicio: 2026-09-22, 2026/09/22T10:00.
  let m = texto.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`

  // Formatos con año de 4 cifras al final: 22/09/2026, 22-09-2026 16:33.
  m = texto.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`

  return ''
}

/**
 * Normaliza un texto corto para compararlo entre tablas: minusculas, sin
 * acentos y con espacios colapsados. Se usa para horas de clase, materias y
 * motivos escritos a mano ('Septima Hora' vs 'Séptima Hora').
 */
export function normalizarTexto(valor: unknown): string {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Alias historico: comparar asignaturas usa la misma normalizacion. */
export const normalizarAsignatura = normalizarTexto

/** Texto de la excusa tal como lo arma el servidor: `motivo motivo_permiso`. */
export function textoExcusa(excusa: Excusa): string {
  // Si el backend ya lo resolvio (campo `texto` de backend/GetExcusas.php), se
  // respeta tal cual para que no haya dos criterios distintos.
  const delServidor = String(excusa.texto ?? '').trim()
  if (delServidor !== '') return delServidor

  const motivo = String(excusa.motivo ?? '').trim()
  const permiso = String(excusa.motivo_permiso ?? '').trim()
  const causa = String((excusa as any).causa ?? '').trim()

  // El servidor usa concat_ws(' ', motivo, motivo_permiso): ambos, sin duplicar.
  const partes = [motivo, permiso].filter((p) => p !== '')
  const visto = new Set<string>()
  const unicas = partes.filter((p) => {
    const clave = normalizarTexto(p)
    if (clave === '' || visto.has(clave)) return false
    visto.add(clave)
    return true
  })
  if (unicas.length > 0) return unicas.join(' ')

  // Ultimo recurso: la causa escrita a mano, si existe y no es el placeholder.
  if (causa !== '' && normalizarTexto(causa) !== 'no aplica') return causa
  return ''
}

/**
 * Una excusa cubre una inasistencia cuando:
 *  - coinciden el estudiante (lo garantiza la consulta) y la fecha completa,
 *  - la excusa es 'Permiso por todo el dia' o 'Permiso por varios dias', o
 *  - `hora_salida` coincide con la `hora_clase` de la inasistencia, o
 *  - ninguna de las dos trae hora (permiso sin hora puntual), o
 *  - las dos tablas traen asignatura y coinciden.
 */
export function excusaCorresponde(excusa: Excusa, inasistencia: Inasistencia): boolean {
  const fechaExcusa = normalizarFecha(excusa.fecha)
  if (fechaExcusa === '') return false
  if (fechaExcusa !== normalizarFecha(inasistencia.fecha)) return false

  // Una excusa sin motivo ni permiso no aporta nada (evita marcar filas vacias).
  if (textoExcusa(excusa) === '') return false

  const horaSalida = normalizarTexto((excusa as any).hora_salida)
  if (horaSalida === PERMISO_TODO_EL_DIA || horaSalida === PERMISO_VARIOS_DIAS) return true

  // La asignatura solo se exige cuando las dos tablas la traen: `excusas` no
  // guarda materia, pero el frontend puede recibirla de otro despliegue.
  const asignaturaExcusa = normalizarTexto((excusa as any).asignatura ?? (excusa as any).materia)
  const asignaturaInas = normalizarTexto(inasistencia.materia ?? (inasistencia as any).asignatura)
  if (asignaturaExcusa !== '' && asignaturaInas !== '' && asignaturaExcusa !== asignaturaInas) {
    return false
  }

  const horaClase = normalizarTexto(inasistencia.hora_clase)
  if (horaClase !== '' && horaSalida !== '' && !HORA_SALIDA_SIN_HORA.includes(horaSalida)) {
    return horaClase === horaSalida
  }

  // Sin horas comparables (una de las dos vacia o 'NO APLICA'): la excusa de esa
  // fecha aplica. El servidor devolvia 'No' en este caso y se perdia la excusa.
  return true
}

/** Todas las excusas del estudiante que concuerdan con una inasistencia concreta. */
export function excusasDeInasistencia(excusas: Excusa[], inasistencia: Inasistencia): Excusa[] {
  return excusas.filter((e) => excusaCorresponde(e, inasistencia))
}

/**
 * Toma la respuesta cruda de GetExcusas.php (`{ total, excusas: [...] }`) y
 * devuelve siempre una lista. Tambien acepta una lista directa o envuelta en
 * `data`/`items` por si otro despliegue responde distinto.
 */
export function normalizarRespuestaExcusas(respuesta: unknown): Excusa[] {
  if (Array.isArray(respuesta)) return respuesta as Excusa[]
  if (respuesta && typeof respuesta === 'object') {
    const candidatos = [
      (respuesta as any).excusas,
      (respuesta as any).data,
      (respuesta as any).items,
      (respuesta as any).detalle,
    ]
    for (const c of candidatos) {
      if (Array.isArray(c)) return c as Excusa[]
    }
  }
  return []
}

/**
 * Toma la respuesta cruda de GetInasistencias.php (`{ total, inasistencias }`)
 * y devuelve siempre una lista. Soporta tambien la lista directa.
 */
export function normalizarRespuestaInasistencias(respuesta: unknown): Inasistencia[] {
  if (Array.isArray(respuesta)) return respuesta as Inasistencia[]
  if (respuesta && typeof respuesta === 'object') {
    const candidatos = [
      (respuesta as any).inasistencias,
      (respuesta as any).inas,
      (respuesta as any).data,
      (respuesta as any).items,
    ]
    for (const c of candidatos) {
      if (Array.isArray(c)) return c as Inasistencia[]
    }
  }
  return []
}
