import { gradesApi } from '$lib/services/api'
import type { AreaAsignatura } from '$lib/types'

const PERIODOS = ['UNO', 'DOS', 'TRES', 'CUATRO'] as const

export interface FilaAreaConcentrador {
  area: string
  valoraciones: (number | null)[]
  final: number
}

export interface FilaAreaFinal {
  area: string
  final: number
}

type MapaArea = Map<string, { area: string; porcentaje: number }>

export function normalizarAsignatura(valor: unknown): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .toUpperCase()
}

function claveExacta(valor: unknown): string {
  return String(valor ?? '').trim().toUpperCase()
}

const cacheAreas = new Map<string, Promise<AreaAsignatura[]>>()

export function cargarAreasNivel(nivel: string | number): Promise<AreaAsignatura[]> {
  const nivelNum = Number.parseInt(String(nivel), 10)
  if (!Number.isFinite(nivelNum) || nivelNum <= 0) return Promise.resolve([])

  const clave = String(nivelNum)
  let peticion = cacheAreas.get(clave)
  if (!peticion) {
    peticion = gradesApi
      .getAreasNivel(nivelNum)
      .then((respuesta) => {
        if (!Array.isArray(respuesta?.areas)) {
          throw new Error('Respuesta de areas invalida')
        }
        return respuesta.areas
      })
      .catch((error) => {
        cacheAreas.delete(clave)
        throw error
      })
    cacheAreas.set(clave, peticion)
  }
  return peticion
}

function construirMapa(areas: AreaAsignatura[]): MapaArea {
  const mapa: MapaArea = new Map()
  for (const item of areas ?? []) {
    const clave = normalizarAsignatura(item?.asignatura)
    if (!clave || mapa.has(clave)) continue
    const porcentaje = Number(item?.porcentaje)
    mapa.set(clave, {
      area: String(item?.area ?? '').trim() || 'SIN ÁREA',
      porcentaje: Number.isFinite(porcentaje) ? porcentaje : 0,
    })
  }
  return mapa
}

function promedio(valores: number[]): number {
  if (valores.length === 0) return 0
  return valores.reduce((a, b) => a + b, 0) / valores.length
}

function ordenesPorArea(areas: AreaAsignatura[]): Map<string, number> {
  const ordenes = new Map<string, number>()
  for (const item of areas ?? []) {
    const area = String(item?.area ?? '').trim()
    if (!area) continue
    if (item?.orden === null || item?.orden === undefined) continue
    const orden = Number(item.orden)
    if (!Number.isFinite(orden)) continue
    const actual = ordenes.get(area)
    if (actual === undefined || orden < actual) ordenes.set(area, orden)
  }
  return ordenes
}

function ordenarFilas<T extends { area: string }>(
  filas: T[],
  ordenes: Map<string, number>,
): T[] {
  return filas.sort((a, b) => {
    if (a.area === 'SIN ÁREA') return 1
    if (b.area === 'SIN ÁREA') return -1
    const ordenA = ordenes.get(a.area) ?? Number.POSITIVE_INFINITY
    const ordenB = ordenes.get(b.area) ?? Number.POSITIVE_INFINITY
    if (ordenA !== ordenB) return ordenA - ordenB
    return a.area.localeCompare(b.area, 'es')
  })
}

function valoresPorAsignatura(notas: any[]): Map<string, Map<string, number>> {
  const valores: Map<string, Map<string, number>> = new Map()
  for (const nota of notas ?? []) {
    const clave = claveExacta(nota?.asignatura)
    if (!clave) continue
    const valor = Number.parseFloat(String(nota?.valoracion ?? ''))
    if (!Number.isFinite(valor)) continue
    const periodo = String(nota?.periodo ?? '').toUpperCase()
    let porPeriodo = valores.get(clave)
    if (!porPeriodo) {
      porPeriodo = new Map()
      valores.set(clave, porPeriodo)
    }
    porPeriodo.set(periodo, valor)
  }
  return valores
}

export function calcularAreasConcentrador(
  notas: any[],
  areas: AreaAsignatura[],
): FilaAreaConcentrador[] {
  const valores = valoresPorAsignatura(notas)
  const mapaExacto: MapaArea = new Map()
  const mapaNormalizado: MapaArea = new Map()

  for (const item of areas ?? []) {
    const porcentaje = Number(item?.porcentaje)
    const info = {
      area: String(item?.area ?? '').trim() || 'SIN ÁREA',
      porcentaje: Number.isFinite(porcentaje) ? porcentaje : 0,
    }
    const exacta = claveExacta(item?.asignatura)
    const normalizada = normalizarAsignatura(item?.asignatura)
    if (exacta && !mapaExacto.has(exacta)) mapaExacto.set(exacta, info)
    if (normalizada && !mapaNormalizado.has(normalizada)) mapaNormalizado.set(normalizada, info)
  }

  const grupos: Map<string, { clave: string; porcentaje: number }[]> = new Map()
  for (const [clave, info] of mapaExacto) {
    if (info.porcentaje <= 0 || !valores.has(clave)) continue
    const materias = grupos.get(info.area) ?? []
    materias.push({ clave, porcentaje: info.porcentaje })
    grupos.set(info.area, materias)
  }

  const sinArea: string[] = []
  for (const clave of valores.keys()) {
    if (mapaNormalizado.has(normalizarAsignatura(clave))) continue
    sinArea.push(clave)
  }

  const filas: FilaAreaConcentrador[] = []

  for (const [nombreArea, materias] of grupos) {
    const valoraciones = PERIODOS.map((periodo) => {
      let acumulado = 0
      let hayNota = false
      for (const materia of materias) {
        const valor = valores.get(materia.clave)?.get(periodo)
        if (valor === undefined) continue
        hayNota = true
        acumulado += valor * materia.porcentaje
      }
      return hayNota ? acumulado / 100 : null
    })

    const disponibles = valoraciones.filter((valor): valor is number => valor !== null)

    filas.push({ area: nombreArea, valoraciones, final: promedio(disponibles) })
  }

  if (sinArea.length > 0) {
    const valoraciones = PERIODOS.map((periodo) => {
      const disponibles = sinArea
        .map((clave) => valores.get(clave)?.get(periodo))
        .filter((valor): valor is number => valor !== undefined)
      return disponibles.length > 0 ? promedio(disponibles) : null
    })

    const disponibles = valoraciones.filter((valor): valor is number => valor !== null)

    filas.push({ area: 'SIN ÁREA', valoraciones, final: promedio(disponibles) })
  }

  return ordenarFilas(filas, ordenesPorArea(areas))
}

export function calcularAreasFinal(notas: any[], areas: AreaAsignatura[]): FilaAreaFinal[] {
  const mapa = construirMapa(areas)
  const valores: Map<string, number[]> = new Map()

  for (const nota of notas ?? []) {
    const clave = normalizarAsignatura(nota?.asignatura)
    if (!clave) continue
    const valor = Number.parseFloat(String(nota?.valoracion ?? ''))
    if (!Number.isFinite(valor)) continue
    const lista = valores.get(clave) ?? []
    lista.push(valor)
    valores.set(clave, lista)
  }

  const grupos: Map<string, { ponderado: number; peso: number }> = new Map()
  const sinArea: number[] = []

  for (const [clave, lista] of valores) {
    const area = mapa.get(clave)
    if (!area) {
      sinArea.push(promedio(lista))
      continue
    }
    if (area.porcentaje <= 0) continue
    const grupo = grupos.get(area.area) ?? { ponderado: 0, peso: 0 }
    grupo.ponderado += promedio(lista) * area.porcentaje
    grupo.peso += area.porcentaje
    grupos.set(area.area, grupo)
  }

  const filas: FilaAreaFinal[] = []
  for (const [area, grupo] of grupos) {
    filas.push({ area, final: grupo.peso > 0 ? grupo.ponderado / grupo.peso : 0 })
  }
  if (sinArea.length > 0) {
    filas.push({ area: 'SIN ÁREA', final: promedio(sinArea) })
  }

  return ordenarFilas(filas, ordenesPorArea(areas))
}
