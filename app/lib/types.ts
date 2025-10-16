// Configuración del libro
export type Genero =
  | 'Ficción'
  | 'No Ficción'
  | 'Fantasía'
  | 'Ciencia Ficción'
  | 'Misterio'
  | 'Romance'
  | 'Autoayuda'
  | 'Biografía';

export type EstiloEscritura =
  | 'Descriptivo'
  | 'Conciso'
  | 'Poético'
  | 'Periodístico'
  | 'Académico'
  | 'Conversacional';

export type Tono =
  | 'Formal'
  | 'Casual'
  | 'Humorístico'
  | 'Serio'
  | 'Inspiracional'
  | 'Oscuro';

export type AudienciaObjetivo =
  | 'Niños'
  | 'Jóvenes Adultos'
  | 'Adultos'
  | 'Académico';

export type ModeloIA =
  | 'tngtech/deepseek-r1t2-chimera:free';

export interface ConfiguracionLibro {
  tema: string;
  genero: Genero;
  numeroCapitulos: number;
  estiloEscritura: EstiloEscritura;
  tono: Tono;
  audienciaObjetivo: AudienciaObjetivo;
  modelo: ModeloIA;
}

// Estructura del outline
export interface Personaje {
  nombre: string;
  descripcion: string;
}

export interface InfoCapitulo {
  numero: number;
  titulo: string;
  descripcion: string;
}

export interface Outline {
  titulo: string;
  sinopsis: string;
  capitulos: InfoCapitulo[];
  personajes: Personaje[];
  arcoNarrativo: string;
}

// Capítulo generado
export interface Capitulo {
  numero: number;
  titulo: string;
  contenido: string;
  palabras: number;
  resumen: string;
  estado: 'pendiente' | 'generando' | 'completado' | 'error';
}

// Estado de la aplicación
export type Etapa =
  | 'configuracion'
  | 'generando-outline'
  | 'generando-capitulos'
  | 'completado';

export interface Estado {
  etapa: Etapa;
  configuracion: ConfiguracionLibro | null;
  outline: Outline | null;
  capitulos: Capitulo[];
  capituloActual: number;
  progreso: number;
  error: string | null;
  generando: boolean;
}

// Acciones del reducer
export type Accion =
  | { tipo: 'INICIAR_OUTLINE'; configuracion: ConfiguracionLibro }
  | { tipo: 'OUTLINE_COMPLETADO'; outline: Outline }
  | { tipo: 'INICIAR_CAPITULO'; numero: number }
  | { tipo: 'ACTUALIZAR_CONTENIDO_CAPITULO'; numero: number; contenido: string }
  | { tipo: 'ACTUALIZAR_PROGRESO'; progreso: number }
  | { tipo: 'CAPITULO_COMPLETADO'; numero: number; contenido: string; resumen: string }
  | { tipo: 'EDITAR_CAPITULO'; numero: number; contenido: string }
  | { tipo: 'ERROR'; error: string }
  | { tipo: 'REINICIAR' };

// Respuestas de API
export interface RespuestaOutline {
  exito: boolean;
  outline?: Outline;
  error?: string;
}

export interface ChunkCapitulo {
  tipo: 'chunk' | 'completo' | 'error';
  contenido: string;
  progreso?: number;
}

export interface RespuestaRevision {
  exito: boolean;
  contenido?: string;
  error?: string;
}

// Formato de exportación
export type FormatoExportacion = 'txt' | 'epub' | 'pdf';

export interface ExportacionLibro {
  titulo: string;
  sinopsis: string;
  capitulos: {
    numero: number;
    titulo: string;
    contenido: string;
  }[];
  metadata: {
    genero: string;
    estilo: string;
    tono: string;
    audiencia: string;
    palabrasTotales: number;
    fechaGeneracion: string;
  };
}

// Biblioteca de libros guardados
export interface LibroGuardado {
  id: string;
  titulo: string;
  sinopsis: string;
  configuracion: ConfiguracionLibro;
  outline: Outline;
  capitulos: Capitulo[];
  fechaCreacion: string;
  fechaModificacion: string;
  palabrasTotales: number;
  portada?: string; // URL o base64 de imagen de portada
}
