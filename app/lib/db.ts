import { neon } from '@neondatabase/serverless';

if (!process.env.NEXT_PUBLIC_DATABASE_URL) {
  throw new Error('NEXT_PUBLIC_DATABASE_URL no está definida en las variables de entorno');
}

// Cliente SQL de Neon
export const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL);

/**
 * Inicializa la base de datos creando las tablas necesarias
 */
export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS libros (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      sinopsis TEXT NOT NULL,
      configuracion JSONB NOT NULL,
      outline JSONB NOT NULL,
      capitulos JSONB NOT NULL,
      fecha_creacion TIMESTAMP DEFAULT NOW(),
      fecha_modificacion TIMESTAMP DEFAULT NOW(),
      palabras_totales INTEGER NOT NULL,
      usuario_id TEXT,
      portada TEXT
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_libros_fecha_creacion
    ON libros(fecha_creacion DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_libros_usuario_id
    ON libros(usuario_id)
  `;

  console.log('✅ Base de datos inicializada');
}
