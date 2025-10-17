import { NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';

/**
 * GET /api/libros/estadisticas
 * Obtiene estadísticas de la biblioteca
 */
export async function GET() {
  try {
    // Intentar inicializar la DB si no existe (primera ejecución)
    try {
      await initDatabase();
    } catch (initError) {
      console.log('ℹ️ Tabla ya existe o error al crear:', initError);
    }

    // Obtener todos los libros y calcular estadísticas en JavaScript
    const libros = await sql`
      SELECT
        palabras_totales,
        capitulos,
        configuracion
      FROM libros
    `;

    const totalLibros = libros.length;
    const totalPalabras = libros.reduce((sum, libro) => sum + (libro.palabras_totales || 0), 0);
    const totalCapitulos = libros.reduce((sum, libro) => {
      const caps = libro.capitulos;
      return sum + (Array.isArray(caps) ? caps.length : 0);
    }, 0);

    // Calcular género más común
    const generos = libros.reduce((acc, libro) => {
      const genero = libro.configuracion?.genero || 'Desconocido';
      acc[genero] = (acc[genero] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const generoMasComun = totalLibros > 0
      ? Object.entries(generos).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
      : 'N/A';

    return NextResponse.json({
      exito: true,
      estadisticas: {
        totalLibros,
        totalPalabras,
        totalCapitulos,
        promedioCapitulosPorLibro: totalLibros > 0 ? Math.round(totalCapitulos / totalLibros) : 0,
        promedioPalabrasPorLibro: totalLibros > 0 ? Math.round(totalPalabras / totalLibros) : 0,
        generoMasComun,
      },
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { exito: false, error: 'Error obteniendo estadísticas' },
      { status: 500 }
    );
  }
}
