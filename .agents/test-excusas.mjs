import {
  normalizarFecha,
  normalizarTexto,
  excusaCorresponde,
  excusasDeInasistencia,
  normalizarRespuestaExcusas,
  normalizarRespuestaInasistencias,
  textoExcusa,
} from '../src/lib/utils/excusas.ts'

let fallos = 0
function eq(etiqueta, obtenido, esperado) {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado)
  if (!ok) fallos++
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${etiqueta} -> ${JSON.stringify(obtenido)}${ok ? '' : ` (esperado ${JSON.stringify(esperado)})`}`)
}
function ok(etiqueta, condicion) {
  if (!condicion) fallos++
  console.log(`${condicion ? 'ok   ' : 'FALLA'} ${etiqueta}`)
}

// --- normalizarFecha: formatos distintos entre inasistencia.fecha y excusas.fecha
eq('iso', normalizarFecha('2026-09-22'), '2026-09-22')
eq('iso con hora', normalizarFecha('2026-09-22 16:33:46'), '2026-09-22')
eq('iso completa', normalizarFecha('2026-09-22T16:33:46.000Z'), '2026-09-22')
eq('dd/mm/yyyy', normalizarFecha('22/09/2026'), '2026-09-22')
eq('dd-mm-yyyy hh:mm', normalizarFecha('22-09-2026 16:33'), '2026-09-22')
eq('vacia', normalizarFecha(''), '')
eq('sin año', normalizarFecha('22/09'), '')

// --- normalizarTexto: horas escritas a mano ('Séptima Hora' vs 'Septima Hora')
eq('acentos', normalizarTexto('Séptima Hora'), 'septima hora')
eq('puntos', normalizarTexto('ED.FÍSICA'), 'ed fisica')
eq('espacios', normalizarTexto('  C. NATURA '), 'c natura')
eq('vacio', normalizarTexto(null), '')

// --- textoExcusa: replica concat_ws(' ', motivo, motivo_permiso) sin duplicar
eq('motivo y permiso iguales no se duplican', textoExcusa({ fecha: '', motivo: 'ENFERMEDAD', motivo_permiso: 'ENFERMEDAD', periodo: '' }), 'ENFERMEDAD')
eq('motivo + permiso distintos', textoExcusa({ fecha: '', motivo: 'CITA MEDICA', motivo_permiso: 'EPS', periodo: '' }), 'CITA MEDICA EPS')
eq('solo motivo', textoExcusa({ fecha: '', motivo: 'Gripa', motivo_permiso: '', periodo: '' }), 'Gripa')
eq('causa como ultimo recurso', textoExcusa({ fecha: '', motivo: '', motivo_permiso: '', causa: 'Viaje familiar', periodo: '' }), 'Viaje familiar')
eq('texto resuelto por el backend tiene prioridad', textoExcusa({ fecha: '', motivo: 'ENFERMEDAD', motivo_permiso: 'X', texto: 'ENFERMEDAD', periodo: '' }), 'ENFERMEDAD')
eq('sin nada util', textoExcusa({ fecha: '', motivo: '', motivo_permiso: '', causa: 'NO APLICA', periodo: '' }), '')

// --- excusaCorresponde: casos reales de la tabla excusas
const inasConHora = { fecha: '2026-09-22', hora_clase: 'Cuarta Hora', excusa: 'No', horas: '1', materia: 'C. NATURA' }
const inasSinHora = { fecha: '2026-09-22', hora_clase: '', excusa: 'No', horas: '2', materia: 'C. NATURA' }

ok('permiso todo el día cubre cualquier hora',
  excusaCorresponde({ fecha: '2026-09-22', motivo: 'ENFERMEDAD', motivo_permiso: 'ENFERMEDAD', hora_salida: 'Permiso por todo el día', periodo: 'TRES' }, inasConHora))
ok('permiso varios días cubre cualquier hora',
  excusaCorresponde({ fecha: '2026-09-22', motivo: 'VIAJE', motivo_permiso: '', hora_salida: 'Permiso por varios días', periodo: 'TRES' }, inasConHora))
ok('misma hora de salida y de clase',
  excusaCorresponde({ fecha: '2026-09-22', motivo: 'CITA', motivo_permiso: 'EPS', hora_salida: 'Cuarta Hora', periodo: 'TRES' }, inasConHora))
ok('misma hora con acento distinto (Séptima/Septima)',
  excusaCorresponde({ fecha: '2026-09-22', motivo: 'CITA', motivo_permiso: '', hora_salida: 'Septima Hora', periodo: 'TRES' }, { ...inasConHora, hora_clase: 'Séptima Hora' }))
ok('hora distinta no cubre la clase',
  !excusaCorresponde({ fecha: '2026-09-22', motivo: 'CITA', motivo_permiso: '', hora_salida: 'Segunda Hora', periodo: 'TRES' }, inasConHora))
ok('hora_salida NO APLICA sigue aplicando por fecha',
  excusaCorresponde({ fecha: '2026-09-22', motivo: 'ENFERMEDAD', motivo_permiso: '', hora_salida: 'NO APLICA', periodo: 'TRES' }, inasConHora))
ok('hora_salida vacía aplica (caso que el servidor perdía)',
  excusaCorresponde({ fecha: '2026-09-22', motivo: 'Emfermedad', motivo_permiso: '', hora_salida: '', periodo: 'TRES' }, inasSinHora))
ok('otra fecha no aplica',
  !excusaCorresponde({ fecha: '2026-09-21', motivo: 'ENFERMEDAD', motivo_permiso: '', hora_salida: 'Permiso por todo el día', periodo: 'TRES' }, inasConHora))
ok('excusa sin texto no marca la fila',
  !excusaCorresponde({ fecha: '2026-09-22', motivo: '', motivo_permiso: '', causa: 'NO APLICA', periodo: 'TRES' }, inasConHora))
ok('asignatura distinta descarta cuando ambas la traen',
  !excusaCorresponde({ fecha: '2026-09-22', motivo: 'X', motivo_permiso: '', asignatura: 'MATEMATI', periodo: 'TRES' }, inasConHora))
ok('excusa sin asignatura aplica a la materia de la fila',
  excusaCorresponde({ fecha: '2026-09-22', motivo: 'X', motivo_permiso: '', periodo: 'TRES' }, inasConHora))

// --- respuestas del API
eq('respuesta excusas {total, excusas}', normalizarRespuestaExcusas({ total: '2', excusas: [{ fecha: 'a' }, { fecha: 'b' }] }).length, 2)
eq('respuesta excusas lista directa', normalizarRespuestaExcusas([{ fecha: 'a' }]).length, 1)
eq('respuesta excusas nula', normalizarRespuestaExcusas(null), [])
eq('respuesta inasistencias {total, inasistencias}', normalizarRespuestaInasistencias({ total: '1', inasistencias: [{ fecha: 'a' }] }).length, 1)
eq('respuesta inasistencias lista directa', normalizarRespuestaInasistencias([{ fecha: 'a' }, { fecha: 'b' }]).length, 2)
eq('respuesta inasistencias error html', normalizarRespuestaInasistencias('<br />error'), [])

// --- caso real: 1055361433, C. NATURA/TRES, 2026-09-15 sin hora de clase
const excusasReales = [
  { fecha: '2026-09-15', motivo: 'ENFERMEDAD', motivo_permiso: 'ENFERMEDAD', hora_salida: 'Permiso por todo el día', periodo: 'TRES' },
  { fecha: '2026-09-16', motivo: 'ENFERMEDAD', motivo_permiso: 'ENFERMEDAD', hora_salida: 'Permiso por todo el día', periodo: 'TRES' },
  { fecha: '2026-09-21', motivo: 'ENFERMEDAD', motivo_permiso: 'ENFERMEDAD', hora_salida: 'Permiso por todo el día', periodo: 'TRES' },
]
eq('cruza las tres inasistencias reales',
  excusasDeInasistencia(excusasReales, { fecha: '2026-09-16', hora_clase: 'Cuarta Hora', excusa: 'ENFERMEDAD ENFERMEDAD', horas: '1', materia: 'C. NATURA' }).length, 1)

console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} FALLOS`)
process.exit(fallos ? 1 : 0)
