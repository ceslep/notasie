export interface StudentData {
  estudiante: string
  nombres: string
  nivel: string
  numero: string
  periodo: string
  year: string
  asignacion: string
}

export interface Nota {
  asignatura: string
  valoracion: string
  desempeno: string
  countNotas: string[]
  cantidadInasistencias: number
  docente: string
}

export interface NotaDetallada {
  estudiante: string
  Asignatura: string
  Nota: string | null
  FechaNota: string
  Aspecto: string
  FechaAspecto: string
  Porcentaje: string
  Periodo: string
  profesor: string
}

export interface Inasistencia {
  fecha: string
  hora_clase: string
  /** Texto de la excusa que ya arma el servidor ('No' cuando no encontro ninguna). */
  excusa: string
  horas: string
  /** Campos extra que devuelve GetInasistencias.php y sirven para cruzar la excusa. */
  materia?: string
  detalle?: string
  periodo?: string
  year?: string
}

export interface Excusa {
  fecha: string
  motivo: string
  motivo_permiso: string
  periodo: string
  /**
   * Hora de clase que cubre la excusa. 'Permiso por todo el dia' y
   * 'Permiso por varios dias' cubren todas las clases de esa fecha;
   * 'NO APLICA' o vacio significa que la excusa no identifica una hora puntual.
   */
  hora_salida?: string
  /** Duracion del permiso (columna TIME de la tabla excusas). */
  horas?: string
  /** Motivo escrito a mano en el formulario del colegio. */
  causa?: string
  /** Texto ya resuelto que devuelve backend/GetExcusas.php (motivo + permiso). */
  texto?: string
  acudiente?: string
  telefono_acudiente?: string
  fechahora?: string
  ind?: string | number
  year?: string | number
  /** La tabla de excusas no guarda materia; se acepta por si otro despliegue la trae. */
  asignatura?: string
  materia?: string
}

/** Respuesta de GetInasistencias.php. */
export interface InasistenciasRespuesta {
  total: number
  inasistencias: Inasistencia[]
}

/** Respuesta de GetExcusas.php. */
export interface ExcusasRespuesta {
  total: number
  excusas: Excusa[]
}

export interface AreaAsignatura {
  area: string
  asignatura: string
  porcentaje: number
  abreviatura: string
  orden?: number | null
}

export interface Puesto {
  nombres: string
  promedio: string
  grupo: string
}

export interface ConvivenciaDetalle {
  nombres: string
  cv_docente: string
  cv_asignatura: string
  cv_tipoFalta: string
  cv_fecha: string
  cv_hora: string
  cv_faltas: string
  cv_descripcionSituacion: string
  cv_descargosEstudiante: string
  cv_positivos: string
  cv_firma: string
  firmaAcudiente: string
  infoFirmaAcudiente: string
  cv_fechahora: string
}

export interface UserFull {
  displayName: string
  email: string
  photoURL: string
  phoneNumber: string
  identificacion: string
  nombres: string
  fechanacimiento: string
  google: string
  genero: string
  direccion: string
}

export interface LoginResult {
  acceso: string
  [key: string]: unknown
}
