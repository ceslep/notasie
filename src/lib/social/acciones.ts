/**
 * Reacciones de la red social (estilo Facebook).
 *
 * Las claves coinciden con lo que guarda el backend en social_reacciones.tipo.
 * Los emoji se usan como icono porque funcionan en cualquier dispositivo sin
 * cargar imagenes ni depender de librerias externas.
 */
export type TipoReaccion =
  | 'me_gusta'
  | 'me_encanta'
  | 'me_importa'
  | 'me_divierte'
  | 'me_asombra'
  | 'me_entristece'
  | 'me_enoja'

export interface DefinicionReaccion {
  tipo: TipoReaccion
  etiqueta: string
  icono: string
  color: string
}

export const REACCIONES: DefinicionReaccion[] = [
  { tipo: 'me_gusta', etiqueta: 'Me gusta', icono: '👍', color: '#0866ff' },
  { tipo: 'me_encanta', etiqueta: 'Me encanta', icono: '❤️', color: '#f33e58' },
  { tipo: 'me_importa', etiqueta: 'Me importa', icono: '🤗', color: '#f7b125' },
  { tipo: 'me_divierte', etiqueta: 'Me divierte', icono: '😆', color: '#f7b125' },
  { tipo: 'me_asombra', etiqueta: 'Me asombra', icono: '😮', color: '#f7b125' },
  { tipo: 'me_entristece', etiqueta: 'Me entristece', icono: '😢', color: '#f7b125' },
  { tipo: 'me_enoja', etiqueta: 'Me enoja', icono: '😡', color: '#e9710f' },
]

const POR_TIPO = new Map<string, DefinicionReaccion>(
  REACCIONES.map((r) => [r.tipo, r]),
)

export function definicion(tipo: string | null | undefined): DefinicionReaccion | null {
  if (!tipo) return null
  return POR_TIPO.get(tipo) ?? null
}

/** Ordena un desglose { tipo: conteo } de mayor a menor reaccion. */
export function desgloseOrdenado(
  reacciones: Record<string, number> | undefined | null,
): Array<{ tipo: string; conteo: number; def: DefinicionReaccion | null }> {
  if (!reacciones) return []
  return Object.entries(reacciones)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([tipo, conteo]) => ({ tipo, conteo, def: definicion(tipo) }))
}

/**
 * Resumen legible de las reacciones, al estilo de Facebook:
 * un solo tipo -> "Me gusta"; dos -> "Me gusta y Me encanta";
 * tres o mas -> "Me gusta, Me encanta y 2 mas".
 */
export function resumenReacciones(
  desglose: Array<{ tipo: string; conteo: number; def: DefinicionReaccion | null }>,
  total: number,
): string {
  const nombres = desglose
    .map((d) => d.def?.etiqueta ?? d.tipo)
    .filter((n): n is string => Boolean(n))

  if (nombres.length === 0) return ''
  if (nombres.length === 1) return nombres[0]
  if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]}`

  const restantes = nombres.length - 2
  return `${nombres[0]}, ${nombres[1]} y ${restantes} mas`
}

/** "1 me gusta" / "3 me gusta" segun la cantidad. */
export function pluralizar(conteo: number, singular: string, plural: string): string {
  return `${conteo} ${conteo === 1 ? singular : plural}`
}

/**
 * Frase completa con los conteos, siempre visible aunque sean cero:
 *   0 reacciones · 0 comentarios
 *   1 reaccion · 2 comentarios
 *   2 reacciones · 1 comentario
 */
export function resumenConteos(reacciones: number, comentarios: number): string {
  return (
    pluralizar(reacciones, 'reaccion', 'reacciones') +
    ' · ' +
    pluralizar(comentarios, 'comentario', 'comentarios')
  )
}

/**
 * Suma los conteos de todas las publicaciones cargadas.
 * Sirve para mostrar los totales en la cabecera de la red social.
 */
export function totalesDe(
  posts: Array<{
    total_reacciones?: number
    comentarios?: number
    reacciones?: Record<string, number>
  }>,
): { reacciones: number; comentarios: number; porTipo: Record<string, number> } {
  let reacciones = 0
  let comentarios = 0
  const porTipo: Record<string, number> = {}

  for (const p of posts) {
    // Se prefiere el desglose, que es la fuente exacta; si no viene, se usa el total.
    const desglose = p.reacciones ?? {}
    const sumaDesglose = Object.values(desglose).reduce((a, b) => a + b, 0)
    reacciones += sumaDesglose > 0 ? sumaDesglose : Number(p.total_reacciones ?? 0)
    comentarios += Number(p.comentarios ?? 0)

    for (const [tipo, n] of Object.entries(desglose)) {
      porTipo[tipo] = (porTipo[tipo] ?? 0) + n
    }
  }

  return { reacciones, comentarios, porTipo }
}


