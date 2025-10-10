import type { LibroGuardado, Capitulo, ConfiguracionLibro, Outline } from './types';

/**
 * Obtiene todos los libros guardados de la biblioteca
 */
export async function obtenerLibros(): Promise<LibroGuardado[]> {
  try {
    const response = await fetch('/api/libros');
    const data = await response.json();

    if (!data.exito) {
      console.error('Error obteniendo libros:', data.error);
      return [];
    }

    return data.libros;
  } catch (error) {
    console.error('Error obteniendo libros:', error);
    return [];
  }
}

/**
 * Obtiene un libro específico por su ID
 */
export async function obtenerLibroPorId(id: string): Promise<LibroGuardado | null> {
  const libros = await obtenerLibros();
  return libros.find(libro => libro.id === id) || null;
}

/**
 * Guarda un nuevo libro en la biblioteca
 */
export async function guardarLibro(
  titulo: string,
  sinopsis: string,
  configuracion: ConfiguracionLibro,
  outline: Outline,
  capitulos: Capitulo[]
): Promise<LibroGuardado | null> {
  try {
    const response = await fetch('/api/libros', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        titulo,
        sinopsis,
        configuracion,
        outline,
        capitulos,
      }),
    });

    const data = await response.json();

    if (!data.exito) {
      console.error('Error guardando libro:', data.error);
      return null;
    }

    return data.libro;
  } catch (error) {
    console.error('Error guardando libro:', error);
    return null;
  }
}

/**
 * Actualiza un libro existente
 * (Nota: Esta funcionalidad requiere endpoint PUT en /api/libros - no implementado aún)
 */
export async function actualizarLibro(id: string, datos: Partial<LibroGuardado>): Promise<boolean> {
  console.warn('actualizarLibro no está implementado con API');
  return false;
}

/**
 * Elimina un libro de la biblioteca
 */
export async function eliminarLibro(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/libros?id=${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    return data.exito;
  } catch (error) {
    console.error('Error eliminando libro:', error);
    return false;
  }
}

/**
 * Busca libros por título o sinopsis (búsqueda en cliente)
 */
export function buscarLibros(libros: LibroGuardado[], query: string): LibroGuardado[] {
  const queryLower = query.toLowerCase();

  return libros.filter(libro =>
    libro.titulo.toLowerCase().includes(queryLower) ||
    libro.sinopsis.toLowerCase().includes(queryLower) ||
    libro.configuracion.genero.toLowerCase().includes(queryLower)
  );
}

/**
 * Ordena libros por diferentes criterios
 */
export function ordenarLibros(
  libros: LibroGuardado[],
  criterio: 'fecha' | 'titulo' | 'palabras'
): LibroGuardado[] {
  const copia = [...libros];

  switch (criterio) {
    case 'fecha':
      return copia.sort((a, b) =>
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );
    case 'titulo':
      return copia.sort((a, b) => a.titulo.localeCompare(b.titulo));
    case 'palabras':
      return copia.sort((a, b) => b.palabrasTotales - a.palabrasTotales);
    default:
      return copia;
  }
}

/**
 * Exporta la biblioteca completa como JSON
 */
export async function exportarBiblioteca(): Promise<string> {
  const libros = await obtenerLibros();
  return JSON.stringify(libros, null, 2);
}

/**
 * Importa libros desde un JSON (no implementado con API - requiere bulk insert)
 */
export async function importarBiblioteca(jsonData: string): Promise<boolean> {
  console.warn('importarBiblioteca no está implementado con API');
  return false;
}

/**
 * Obtiene estadísticas de la biblioteca
 */
export async function obtenerEstadisticas() {
  try {
    const response = await fetch('/api/libros/estadisticas');
    const data = await response.json();

    if (!data.exito) {
      console.error('Error obteniendo estadísticas:', data.error);
      return {
        totalLibros: 0,
        totalPalabras: 0,
        totalCapitulos: 0,
        promedioCapitulosPorLibro: 0,
        promedioPalabrasPorLibro: 0,
        generoMasComun: 'N/A',
      };
    }

    return data.estadisticas;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalLibros: 0,
      totalPalabras: 0,
      totalCapitulos: 0,
      promedioCapitulosPorLibro: 0,
      promedioPalabrasPorLibro: 0,
      generoMasComun: 'N/A',
    };
  }
}

/**
 * Limpia la biblioteca (útil para testing - no implementado con API)
 */
export function limpiarBiblioteca(): void {
  console.warn('limpiarBiblioteca no está implementado con API');
}
