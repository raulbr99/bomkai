import type { Capitulo, ConfiguracionLibro, ExportacionLibro, FormatoExportacion } from './types';

/**
 * Estima la cantidad de tokens en un texto
 * Usa una aproximación: ~4 caracteres por token
 */
export function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 4);
}

/**
 * Cuenta el número de palabras en un texto
 */
export function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(palabra => palabra.length > 0).length;
}

/**
 * Genera un resumen corto de un capítulo (últimos 500 caracteres)
 */
export function generarResumen(capitulo: string): string {
  const limite = 500;
  if (capitulo.length <= limite) {
    return capitulo;
  }
  return '...' + capitulo.slice(-limite);
}

/**
 * Formatea un capítulo para exportación
 */
export function formatearCapitulo(capitulo: Capitulo): string {
  return `# Capítulo ${capitulo.numero}: ${capitulo.titulo}\n\n${capitulo.contenido}\n\n`;
}

/**
 * Valida la configuración del libro
 */
export function validarConfiguracion(config: ConfiguracionLibro): { valido: boolean; error?: string } {
  if (!config.tema || config.tema.trim().length === 0) {
    return { valido: false, error: 'El tema es requerido' };
  }

  if (config.numeroCapitulos < 1 || config.numeroCapitulos > 50) {
    return { valido: false, error: 'El número de capítulos debe estar entre 1 y 50' };
  }

  return { valido: true };
}

/**
 * Exporta el libro en diferentes formatos
 */
export function exportarLibro(
  titulo: string,
  sinopsis: string,
  capitulos: Capitulo[],
  formato: FormatoExportacion,
  configuracion: ConfiguracionLibro
): string {
  const capitulosCompletados = capitulos.filter(cap => cap.estado === 'completado');
  
  const palabrasTotales = capitulosCompletados.reduce((total, cap) => total + cap.palabras, 0);
  
  switch (formato) {
    case 'txt':
      return exportarTXT(titulo, sinopsis, capitulosCompletados);
    case 'md':
      return exportarMarkdown(titulo, sinopsis, capitulosCompletados, configuracion);
    case 'json':
      return exportarJSON(titulo, sinopsis, capitulosCompletados, configuracion, palabrasTotales);
    case 'epub':
      // EPUB se maneja a través del endpoint API
      throw new Error('La exportación a EPUB se maneja a través del endpoint /api/exportar-epub');
    default:
      throw new Error(`Formato de exportación no soportado: ${formato}`);
  }
}

/**
 * Exporta a formato TXT plano
 */
function exportarTXT(titulo: string, sinopsis: string, capitulos: Capitulo[]): string {
  let contenido = '';

  contenido += '='.repeat(60) + '\n';
  contenido += titulo.toUpperCase() + '\n';
  contenido += '='.repeat(60) + '\n\n';
  contenido += sinopsis + '\n\n';
  contenido += '='.repeat(60) + '\n\n\n';

  for (const capitulo of capitulos) {
    contenido += '-'.repeat(60) + '\n';
    contenido += `CAPÍTULO ${capitulo.numero}: ${capitulo.titulo.toUpperCase()}\n`;
    contenido += '-'.repeat(60) + '\n\n';
    contenido += capitulo.contenido + '\n\n\n';
  }

  return contenido;
}

/**
 * Exporta a formato Markdown
 */
function exportarMarkdown(
  titulo: string,
  sinopsis: string,
  capitulos: Capitulo[],
  configuracion: ConfiguracionLibro
): string {
  let contenido = '';

  contenido += `# ${titulo}\n\n`;
  contenido += `**Género:** ${configuracion.genero} | `;
  contenido += `**Estilo:** ${configuracion.estiloEscritura} | `;
  contenido += `**Tono:** ${configuracion.tono}\n\n`;
  contenido += `## Sinopsis\n\n${sinopsis}\n\n`;
  contenido += `---\n\n`;

  for (const capitulo of capitulos) {
    contenido += `## Capítulo ${capitulo.numero}: ${capitulo.titulo}\n\n`;
    contenido += `${capitulo.contenido}\n\n`;
    contenido += `---\n\n`;
  }

  return contenido;
}

/**
 * Exporta a formato JSON
 */
function exportarJSON(
  titulo: string,
  sinopsis: string,
  capitulos: Capitulo[],
  configuracion: ConfiguracionLibro,
  palabrasTotales: number
): string {
  const exportacion: ExportacionLibro = {
    titulo,
    sinopsis,
    capitulos: capitulos.map(cap => ({
      numero: cap.numero,
      titulo: cap.titulo,
      contenido: cap.contenido
    })),
    metadata: {
      genero: configuracion.genero,
      estilo: configuracion.estiloEscritura,
      tono: configuracion.tono,
      audiencia: configuracion.audienciaObjetivo,
      palabrasTotales,
      fechaGeneracion: new Date().toISOString()
    }
  };

  return JSON.stringify(exportacion, null, 2);
}

/**
 * Descarga un archivo en el navegador
 */
export function descargarArchivo(contenido: string, nombreArchivo: string, tipoMIME: string) {
  const blob = new Blob([contenido], { type: tipoMIME });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

export async function exportarEPUB(
  titulo: string,
  sinopsis: string,
  capitulos: Capitulo[],
  configuracion: ConfiguracionLibro
): Promise<void> {
  try {
    const response = await fetch('/api/exportar-epub', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        titulo,
        sinopsis,
        capitulos,
        configuracion,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al generar EPUB');
    }

    // Obtener el blob del archivo EPUB
    const blob = await response.blob();
    
    // Crear URL para descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exportando EPUB:', error);
    throw error;
  }
}

/**
 * Calcula el progreso general de la generación
 */
export function calcularProgreso(capituloActual: number, totalCapitulos: number): number {
  if (totalCapitulos === 0) return 0;
  return Math.round((capituloActual / totalCapitulos) * 100);
}

/**
 * Formatea el tiempo estimado restante
 */
export function formatearTiempoEstimado(minutosRestantes: number): string {
  if (minutosRestantes < 1) {
    return 'Menos de 1 minuto';
  } else if (minutosRestantes === 1) {
    return '1 minuto';
  } else if (minutosRestantes < 60) {
    return `${Math.round(minutosRestantes)} minutos`;
  } else {
    const horas = Math.floor(minutosRestantes / 60);
    const mins = Math.round(minutosRestantes % 60);
    return `${horas}h ${mins}m`;
  }
}
