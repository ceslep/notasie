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
  excusa: string
  horas: string
}

export interface Excusa {
  fecha: string
  motivo: string
  motivo_permiso: string
  periodo: string
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
