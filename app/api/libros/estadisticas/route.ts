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

    const result = await sql`
      SELECT
        COUNT(*)::int as total_libros,
        COALESCE(SUM(palabras_totales), 0)::int as total_palabras,
        COALESCE(SUM(jsonb_array_length(capitulos)), 0)::int as total_capitulos
      FROM libros
    `;

    const generosResult = await sql`
      SELECT configuracion->>'genero' as genero, COUNT(*)::int as count
      FROM libros
      GROUP BY configuracion->>'genero'
      ORDER BY count DESC
      LIMIT 1
    `;

    const stats = result[0];
    const generoMasComun = generosResult.length > 0 ? generosResult[0].genero : 'N/A';

    const totalLibros = stats.total_libros || 0;
    const totalCapitulos = stats.total_capitulos || 0;

    return NextResponse.json({
      exito: true,
      estadisticas: {
        totalLibros,
        totalPalabras: stats.total_palabras || 0,
        totalCapitulos,
        promedioCapitulosPorLibro: totalLibros > 0 ? Math.round(totalCapitulos / totalLibros) : 0,
        promedioPalabrasPorLibro: totalLibros > 0 ? Math.round((stats.total_palabras || 0) / totalLibros) : 0,
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
