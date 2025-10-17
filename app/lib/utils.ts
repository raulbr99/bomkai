import type { Capitulo, ConfiguracionLibro, ExportacionLibro, FormatoExportacion, ModeloIA } from './types';

/**
 * Formatea el nombre del modelo para mostrarlo de forma legible
 */
export function formatearNombreModelo(modelo?: ModeloIA | string): string {
  if (!modelo) return 'Modelo no especificado';

  const nombresModelos: Record<string, string> = {
    'deepseek/deepseek-chat-v3.1:free': 'DeepSeek Chat V3.1',
    'openai/gpt-oss-20b:free': 'GPT OSS 20B',
    'tngtech/deepseek-r1t2-chimera:free': 'DeepSeek R1T2 Chimera',
    'meituan/longcat-flash-chat:free': 'LongCat Flash Chat',
    'z-ai/glm-4.5-air:free': 'GLM-4.5 Air',
  };

  return nombresModelos[modelo] || modelo;
}

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
 * Exporta el libro en formato TXT
 */
export function exportarLibro(
  titulo: string,
  sinopsis: string,
  capitulos: Capitulo[],
  formato: FormatoExportacion,
  configuracion: ConfiguracionLibro
): string {
  const capitulosCompletados = capitulos.filter(cap => cap.estado === 'completado');

  if (formato !== 'txt') {
    throw new Error('Solo se soporta formato TXT en esta función. Usa exportarEPUB o exportarPDF para otros formatos.');
  }

  return exportarTXT(titulo, sinopsis, capitulosCompletados);
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

/**
 * Exporta el libro a formato EPUB
 */
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
 * Exporta el libro a formato PDF
 */
export async function exportarPDF(
  titulo: string,
  sinopsis: string,
  capitulos: Capitulo[],
  configuracion: ConfiguracionLibro
): Promise<void> {
  try {
    const response = await fetch('/api/exportar-pdf', {
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
      throw new Error(errorData.error || 'Error al generar PDF');
    }

    // Obtener el blob del archivo PDF
    const blob = await response.blob();

    // Crear URL para descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exportando PDF:', error);
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
