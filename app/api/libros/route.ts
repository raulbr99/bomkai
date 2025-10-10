import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { LibroGuardado, ConfiguracionLibro, Outline, Capitulo } from '@/lib/types';

/**
 * GET /api/libros
 * Obtiene todos los libros de la base de datos
 */
export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM libros
      ORDER BY fecha_creacion DESC
    `;

    const libros: LibroGuardado[] = result.map((row: any) => ({
      id: row.id,
      titulo: row.titulo,
      sinopsis: row.sinopsis,
      configuracion: row.configuracion as ConfiguracionLibro,
      outline: row.outline as Outline,
      capitulos: row.capitulos as Capitulo[],
      fechaCreacion: row.fecha_creacion,
      fechaModificacion: row.fecha_modificacion,
      palabrasTotales: row.palabras_totales,
      portada: row.portada,
    }));

    return NextResponse.json({ exito: true, libros });
  } catch (error) {
    console.error('Error obteniendo libros:', error);
    return NextResponse.json(
      { exito: false, error: 'Error obteniendo libros de la base de datos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/libros
 * Guarda un nuevo libro en la base de datos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, sinopsis, configuracion, outline, capitulos } = body;

    // Validación básica
    if (!titulo || !sinopsis || !configuracion || !outline || !capitulos) {
      return NextResponse.json(
        { exito: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Calcular palabras totales
    const palabrasTotales = capitulos
      .filter((cap: Capitulo) => cap.estado === 'completado')
      .reduce((total: number, cap: Capitulo) => total + cap.palabras, 0);

    // Generar ID único
    const id = `libro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insertar en la base de datos
    await sql`
      INSERT INTO libros (
        id,
        titulo,
        sinopsis,
        configuracion,
        outline,
        capitulos,
        palabras_totales
      ) VALUES (
        ${id},
        ${titulo},
        ${sinopsis},
        ${JSON.stringify(configuracion)},
        ${JSON.stringify(outline)},
        ${JSON.stringify(capitulos.filter((cap: Capitulo) => cap.estado === 'completado'))},
        ${palabrasTotales}
      )
    `;

    const nuevoLibro: LibroGuardado = {
      id,
      titulo,
      sinopsis,
      configuracion,
      outline,
      capitulos: capitulos.filter((cap: Capitulo) => cap.estado === 'completado'),
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
      palabrasTotales,
    };

    return NextResponse.json({ exito: true, libro: nuevoLibro });
  } catch (error) {
    console.error('Error guardando libro:', error);
    return NextResponse.json(
      { exito: false, error: 'Error guardando libro en la base de datos' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/libros
 * Elimina un libro de la base de datos
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { exito: false, error: 'ID de libro no proporcionado' },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM libros
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { exito: false, error: 'Libro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ exito: true });
  } catch (error) {
    console.error('Error eliminando libro:', error);
    return NextResponse.json(
      { exito: false, error: 'Error eliminando libro de la base de datos' },
      { status: 500 }
    );
  }
}
