import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

/**
 * GET /api/init-db
 * Inicializa la base de datos creando las tablas necesarias
 * Este endpoint debe ejecutarse una sola vez después del deployment
 */
export async function GET() {
  try {
    console.log('🚀 Iniciando inicialización de base de datos...');

    await initDatabase();

    console.log('✅ Base de datos inicializada exitosamente');

    return NextResponse.json({
      exito: true,
      mensaje: 'Base de datos inicializada correctamente',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);

    return NextResponse.json(
      {
        exito: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        detalles: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
