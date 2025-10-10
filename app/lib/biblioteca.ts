import type { LibroGuardado, Capitulo, ConfiguracionLibro, Outline } from './types';

const BIBLIOTECA_KEY = 'bomkai_biblioteca';

/**
 * Obtiene todos los libros guardados de la biblioteca
 */
export function obtenerLibros(): LibroGuardado[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(BIBLIOTECA_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error obteniendo libros:', error);
    return [];
  }
}

/**
 * Obtiene un libro específico por su ID
 */
export function obtenerLibroPorId(id: string): LibroGuardado | null {
  const libros = obtenerLibros();
  return libros.find(libro => libro.id === id) || null;
}

/**
 * Guarda un nuevo libro en la biblioteca
 */
export function guardarLibro(
  titulo: string,
  sinopsis: string,
  configuracion: ConfiguracionLibro,
  outline: Outline,
  capitulos: Capitulo[]
): LibroGuardado {
  const libros = obtenerLibros();

  const palabrasTotales = capitulos
    .filter(cap => cap.estado === 'completado')
    .reduce((total, cap) => total + cap.palabras, 0);

  const nuevoLibro: LibroGuardado = {
    id: generarId(),
    titulo,
    sinopsis,
    configuracion,
    outline,
    capitulos: capitulos.filter(cap => cap.estado === 'completado'),
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString(),
    palabrasTotales,
  };

  libros.push(nuevoLibro);
  localStorage.setItem(BIBLIOTECA_KEY, JSON.stringify(libros));

  return nuevoLibro;
}

/**
 * Actualiza un libro existente
 */
export function actualizarLibro(id: string, datos: Partial<LibroGuardado>): boolean {
  const libros = obtenerLibros();
  const index = libros.findIndex(libro => libro.id === id);

  if (index === -1) return false;

  libros[index] = {
    ...libros[index],
    ...datos,
    fechaModificacion: new Date().toISOString(),
  };

  localStorage.setItem(BIBLIOTECA_KEY, JSON.stringify(libros));
  return true;
}

/**
 * Elimina un libro de la biblioteca
 */
export function eliminarLibro(id: string): boolean {
  const libros = obtenerLibros();
  const librosFiltrados = libros.filter(libro => libro.id !== id);

  if (libros.length === librosFiltrados.length) return false;

  localStorage.setItem(BIBLIOTECA_KEY, JSON.stringify(librosFiltrados));
  return true;
}

/**
 * Busca libros por título o sinopsis
 */
export function buscarLibros(query: string): LibroGuardado[] {
  const libros = obtenerLibros();
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
export function exportarBiblioteca(): string {
  const libros = obtenerLibros();
  return JSON.stringify(libros, null, 2);
}

/**
 * Importa libros desde un JSON
 */
export function importarBiblioteca(jsonData: string): boolean {
  try {
    const librosImportados = JSON.parse(jsonData) as LibroGuardado[];

    // Validar estructura básica
    if (!Array.isArray(librosImportados)) {
      throw new Error('Formato inválido');
    }

    const librosActuales = obtenerLibros();
    const librosNuevos = librosImportados.filter(
      libroNuevo => !librosActuales.some(libro => libro.id === libroNuevo.id)
    );

    const bibliotecaActualizada = [...librosActuales, ...librosNuevos];
    localStorage.setItem(BIBLIOTECA_KEY, JSON.stringify(bibliotecaActualizada));

    return true;
  } catch (error) {
    console.error('Error importando biblioteca:', error);
    return false;
  }
}

/**
 * Obtiene estadísticas de la biblioteca
 */
export function obtenerEstadisticas() {
  const libros = obtenerLibros();

  const totalLibros = libros.length;
  const totalPalabras = libros.reduce((sum, libro) => sum + libro.palabrasTotales, 0);
  const totalCapitulos = libros.reduce((sum, libro) => sum + libro.capitulos.length, 0);

  const generosCuenta = libros.reduce((acc, libro) => {
    acc[libro.configuracion.genero] = (acc[libro.configuracion.genero] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalLibros,
    totalPalabras,
    totalCapitulos,
    promedioCapitulosPorLibro: totalLibros > 0 ? Math.round(totalCapitulos / totalLibros) : 0,
    promedioPalabrasPorLibro: totalLibros > 0 ? Math.round(totalPalabras / totalLibros) : 0,
    generoMasComun: Object.entries(generosCuenta).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
    distribucionGeneros: generosCuenta,
  };
}

/**
 * Genera un ID único para un libro
 */
function generarId(): string {
  return `libro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Limpia la biblioteca (útil para testing)
 */
export function limpiarBiblioteca(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BIBLIOTECA_KEY);
  }
}
