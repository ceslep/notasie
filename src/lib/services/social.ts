/**
 * Cliente de la Red Social Escolar.
 *
 * Todo el contenido nace en estado 'pendiente' y solo es visible para el resto
 * de estudiantes cuando el moderador lo aprueba desde el panel de moderación.
 *
 * El endpoint es relativo para respetar el `base` de Vite (/est/).
 */

/**
 * Ubicacion del backend de la red social. Se resuelve UNA vez desde
 * location.pathname (no desde una ruta relativa del documento).
 *
 * Por que asi: una ruta relativa depende de la barra final del documento.
 * Con la app en /est/, si alguien abriera /est (sin barra) el navegador
 * resolveria 'php/api.php' contra la raiz del dominio y daria 404.
 * Construido desde la ruta de la app, el destino siempre es el mismo.
 *
 * Se puede sobreescribir con VITE_SOCIAL_API en .env si el backend se sube
 * a otra ubicacion (por ejemplo junto al index.html, sin la carpeta php/).
 */
function construirEndpoint(): string {
  const configurado = import.meta.env.VITE_SOCIAL_API as string | undefined
  if (configurado) return configurado

  // Se corta desde la posicion del ULTIMO segmento 'est' hasta el final del
  // pathname, y se recompone. Funciona en los tres casos:
  //   /est                -> /est/
  //   /est/               -> /est/
  //   /est/index.html     -> /est/
  const ruta = window.location.pathname
  const marca = '/est'
  const inicio = ruta.lastIndexOf(marca)

  const esElSegmento =
    inicio !== -1 &&
    (inicio === 0 || ruta.charAt(inicio - 1) === '/') &&
    (inicio + marca.length === ruta.length || ruta.charAt(inicio + marca.length) === '/')

  if (!esElSegmento) {
    // Fuera de /est/ (por ejemplo en desarrollo con vite a secas) se mantiene
    // el comportamiento relativo clasico.
    return 'php/api.php'
  }

  return ruta.substring(0, inicio) + '/est/php/api.php'
}

const ENDPOINT = construirEndpoint()

export interface SocialPost {
  id: number
  autor_nombre: string
  nivel: string
  numero: string
  contenido: string
  imagen: string | null
  estado?: string
  motivo_rechazo?: string | null
  reportes?: number
  /** Solo en el panel de moderacion de comentarios: texto de la publicacion padre. */
  post_contenido?: string | null
  created_at: string
  likes?: number
  comentarios?: number
  yo_like?: number | boolean
  /** Desglose { tipo_reaccion: conteo } de las reacciones de esta publicacion. */
  reacciones?: Record<string, number>
  total_reacciones?: number
  /** Reaccion del estudiante actual, o null si no ha reaccionado. */
  yo_reaccion?: string | null
  /** Trazabilidad de ediciones. */
  editado?: number | boolean
  editado_por?: string | null
  editado_en?: string | null
  /** true cuando la publicacion la creo el docente. */
  es_docente?: number | boolean
}

export interface SocialComentario {
  id: number
  autor_nombre: string
  contenido: string
  created_at: string
  editado?: number | boolean
  editado_por?: string | null
}

export interface SocialSesion {
  estudiante: string
  nombres: string
  nivel: string
  numero: string
  token: string
}

interface ApiRespuesta {
  ok: boolean
  error?: string
  [k: string]: unknown
}

/** Tiempo maximo de espera para una peticion normal, en milisegundos. */
const TIMEOUT_MS = 12000

/** El login consulta la tabla de estudiantes y puede tardar algo mas. */
const TIMEOUT_LOGIN_MS = 20000

/**
 * Peticion al backend con limite de tiempo.
 *
 * Sin este limite, una conexion que se queda a medias deja la promesa sin
 * resolver para siempre: la vista se queda en el indicador de carga y el
 * bloque que lo apaga nunca se ejecuta.
 */
async function request<T extends ApiRespuesta>(
  payload: Record<string, unknown>,
  timeoutMs = TIMEOUT_MS,
): Promise<T> {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controlador.signal,
    })
  } catch {
    if (controlador.signal.aborted) {
      throw new Error(
        `El servidor no respondio en ${Math.round(timeoutMs / 1000)} segundos. ` +
          'Revisa la conexion o que el backend este disponible.',
      )
    }
    throw new Error(
      'No se pudo conectar con el servidor. Revisa tu conexion a internet.',
    )
  } finally {
    clearTimeout(temporizador)
  }

  // Se lee como texto para poder distinguir un JSON valido de una pagina HTML
  // (por ejemplo, cuando api.php no esta desplegado y el servidor devuelve 404).
  const crudo = await res.text()

  let data: T | null = null
  try {
    const parsed = JSON.parse(crudo)
    if (parsed && typeof parsed === 'object') data = parsed as T
  } catch {
    data = null
  }

  // Traza de diagnostico: cualquier respuesta que no sea correcta deja en la
  // consola a que endpoint se llamo y que contesto el servidor.
  if (!res.ok || data === null || !data.ok) {
    console.warn('[red social] respuesta no valida', {
      endpoint: ENDPOINT,
      status: res.status,
      accion: payload.action,
      respuesta: crudo.slice(0, 300),
    })
  }

  if (data === null) {
    if (res.status === 404) {
      throw new Error(
        'No se encontro el servidor de la red social (api.php). Falta subir el backend al servidor.',
      )
    }
    if (res.status >= 500) {
      throw new Error(
        `El servidor de la red social fallo (error ${res.status}). Revisa la conexion a la base de datos.`,
      )
    }
    if (res.status === 403) {
      throw new Error('El servidor rechazo la peticion (403). Revisa la configuracion de CORS.')
    }
    const pareceHtml = /^\s*</.test(crudo)
    throw new Error(
      pareceHtml
        ? `El servidor respondio con una pagina en vez de datos (error ${res.status}). La red social no esta bien desplegada.`
        : `Respuesta inesperada del servidor (error ${res.status}).`,
    )
  }

  if (!data.ok) {
    const mensaje = data.error || 'Ocurrio un error'
    // Estos mensajes solo los devuelve una version ANTERIOR del backend: el
    // sintoma tipico de que api.php no se ha vuelto a subir tras actualizarlo.
    if (
      mensaje === 'Estudiante requerido' ||
      mensaje === 'Accion desconocida' ||
      mensaje === 'Publicacion no disponible'
    ) {
      throw new Error(
        `${mensaje}. El backend del servidor parece ser una version anterior: ` +
          'sube de nuevo api.php a /est/php/.',
      )
    }
    throw new Error(mensaje)
  }
  return data
}

/** Diagnostico de despliegue: util para saber si el backend esta bien instalado. */
export async function diagnosticarSocial(): Promise<Record<string, unknown>> {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'diagnostico' }),
      signal: controlador.signal,
    })
    const texto = await res.text()
    try {
      return { alcanzable: true, ...(JSON.parse(texto) as Record<string, unknown>) }
    } catch {
      return {
        alcanzable: true,
        respuestaNoJson: true,
        status: res.status,
        primerosCaracteres: texto.slice(0, 200),
      }
    }
  } catch (e) {
    return {
      alcanzable: false,
      motivo: controlador.signal.aborted
        ? `Sin respuesta en ${Math.round(TIMEOUT_MS / 1000)} segundos`
        : e instanceof Error
          ? e.message
          : 'No se pudo conectar',
    }
  } finally {
    clearTimeout(temporizador)
  }
}

/** Nombre corto y amigable: "ACEVEDO JARAMILLO MARIANGEL" -> "Mariangel Acevedo". */
export function nombreCorto(nombreCompleto: string): string {
  const partes = (nombreCompleto || '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return 'Estudiante'
  if (partes.length === 1) return capitalizar(partes[0])

  // El formato del colegio es APELLIDO1 APELLIDO2 NOMBRES...
  const nombre = partes.length >= 3 ? partes.slice(2).join(' ') : partes[1]
  const apellido = partes[0]
  return capitalizar(nombre) + ' ' + capitalizar(apellido)
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/** "2026-09-14 20:08:09" -> "hace 5 min" */
export function tiempoRelativo(fecha: string): string {
  const t = new Date((fecha || '').replace(' ', 'T')).getTime()
  if (!Number.isFinite(t)) return ''

  const seg = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (seg < 60) return 'hace un momento'
  const min = Math.floor(seg / 60)
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ayer'
  if (d < 7) return `hace ${d} dias`
  return new Date(t).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

/**
 * Reduce y comprime la imagen antes de subirla.
 * El servidor no tiene GD, asi que el trabajo pesado se hace aqui.
 */
export async function comprimirImagen(
  file: File,
  maxLado = 1600,
  calidad = 0.82,
): Promise<string> {
  const dataUrl = await leerArchivo(file)
  const img = await cargarImagen(dataUrl)

  let { width, height } = img
  const escala = Math.min(1, maxLado / Math.max(width, height))
  width = Math.round(width * escala)
  height = Math.round(height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, width, height)

  const jpeg = canvas.toDataURL('image/jpeg', calidad)
  // Si el JPEG pesa mas que el original (png pequeno), conservamos el original.
  return jpeg.length < dataUrl.length ? jpeg : dataUrl
}

function leerArchivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(new Error('No se pudo leer la imagen'))
    fr.readAsDataURL(file)
  })
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo procesar la imagen'))
    img.src = src
  })
}

export const socialApi = {
  // -- Estudiante ----------------------------------------------------------
  login: (identificacion: string, pass: string) =>
    request<ApiRespuesta & SocialSesion>(
      { action: 'login', identificacion, pass },
      TIMEOUT_LOGIN_MS,
    ),

  feed: (estudiante?: string) =>
    request<ApiRespuesta & { posts: SocialPost[]; reacciones: Record<string, string> }>({
      action: 'feed',
      estudiante: estudiante ?? '',
    }),

  misPendientes: (estudiante: string, token: string) =>
    request<ApiRespuesta & { posts: SocialPost[]; comentarios: SocialPost[] }>({
      action: 'mis_pendientes',
      estudiante,
      token,
    }),

  crearPost: (
    estudiante: string,
    token: string,
    contenido: string,
    imagen: string | null,
    modCode?: string,
  ) =>
    request<ApiRespuesta & { id: number; mensaje: string; estado: string; auto_aprobado: boolean }>({
      action: 'crear_post',
      estudiante,
      token,
      contenido,
      imagen,
      ...(modCode ? { mod_code: modCode } : {}),
    }),

  borrarPropio: (estudiante: string, token: string, postId: number) =>
    request<ApiRespuesta>({ action: 'borrar_propio', estudiante, token, post_id: postId }),

  /**
   * Edita el texto de una publicacion.
   * El docente puede editar cualquiera (correcciones); el estudiante solo la
   * suya y mientras siga pendiente.
   */
  editarPost: (
    contenido: string,
    postId: number,
    quien: { estudiante?: string; token?: string; modCode?: string },
  ) =>
    request<ApiRespuesta & { contenido: string; editado_por: string; por_docente: boolean }>({
      action: 'editar_post',
      estudiante: quien.estudiante ?? '',
      token: quien.token ?? '',
      post_id: postId,
      contenido,
      ...(quien.modCode ? { mod_code: quien.modCode } : {}),
    }),

  /** Edita un comentario. Mismo criterio que editarPost. */
  editarComentario: (
    contenido: string,
    id: number,
    quien: { estudiante?: string; token?: string; modCode?: string },
  ) =>
    request<ApiRespuesta & { contenido: string; editado_por: string; por_docente: boolean }>({
      action: 'editar_comentario',
      estudiante: quien.estudiante ?? '',
      token: quien.token ?? '',
      id,
      contenido,
      ...(quien.modCode ? { mod_code: quien.modCode } : {}),
    }),

  like: (estudiante: string, token: string, postId: number) =>
    request<ApiRespuesta & { activo: boolean; likes: number }>({
      action: 'like',
      estudiante,
      token,
      post_id: postId,
    }),

  /**
   * Pone, cambia o quita una reaccion.
   * Volver a enviar la misma reaccion que ya estaba la elimina.
   */
  reaccionar: (
    estudiante: string,
    token: string,
    postId: number,
    tipo: string,
    modCode?: string,
  ) =>
    request<
      ApiRespuesta & {
        mi_reaccion: string | null
        reacciones: Record<string, number>
        total: number
      }
    >({
      action: 'reaccion',
      estudiante,
      token,
      post_id: postId,
      tipo,
      ...(modCode ? { mod_code: modCode } : {}),
    }),

  comentarios: (postId: number) =>
    request<ApiRespuesta & { comentarios: SocialComentario[] }>({
      action: 'comentarios',
      post_id: postId,
    }),

  comentar: (
    estudiante: string,
    token: string,
    postId: number,
    contenido: string,
    modCode?: string,
  ) =>
    request<ApiRespuesta & { mensaje: string; auto_aprobado: boolean }>({
      action: 'comentar',
      estudiante,
      token,
      post_id: postId,
      contenido,
      ...(modCode ? { mod_code: modCode } : {}),
    }),

  reportar: (estudiante: string, token: string, postId: number, motivo: string) =>
    request<ApiRespuesta & { mensaje: string }>({
      action: 'reportar',
      estudiante,
      token,
      post_id: postId,
      motivo,
    }),

  // -- Moderador -----------------------------------------------------------
  modLogin: (modCode: string) =>
    request<ApiRespuesta & { pendientes: number }>({ action: 'mod_login', mod_code: modCode }),

  modListar: (modCode: string, tipo: 'posts' | 'comentarios', estado = 'pendiente') =>
    request<ApiRespuesta & { items: SocialPost[] }>({
      action: 'mod_listar',
      mod_code: modCode,
      tipo,
      estado,
    }),

  modAprobar: (modCode: string, id: number, tipo: 'post' | 'comentario') =>
    request<ApiRespuesta>({ action: 'mod_aprobar', mod_code: modCode, id, tipo }),

  modRechazar: (modCode: string, id: number, tipo: 'post' | 'comentario', motivo: string) =>
    request<ApiRespuesta>({ action: 'mod_rechazar', mod_code: modCode, id, tipo, motivo }),

  modBorrar: (modCode: string, id: number) =>
    request<ApiRespuesta>({ action: 'mod_borrar', mod_code: modCode, id }),
}
