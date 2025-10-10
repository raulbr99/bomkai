# Configuración de Neon Database

Este proyecto utiliza **Neon** como base de datos PostgreSQL serverless para almacenar los libros generados.

## 📋 Requisitos Previos

1. Cuenta en [Neon](https://neon.tech)
2. Base de datos creada en Neon
3. Variable de entorno `DATABASE_URL` configurada

---

## 🚀 Paso 1: Crear Proyecto en Neon

1. Ve a [https://neon.tech](https://neon.tech) y crea una cuenta
2. Haz clic en **"Create a project"**
3. Elige un nombre para tu proyecto (ej: `bomkai-books`)
4. Selecciona la región más cercana a tus usuarios
5. Haz clic en **"Create project"**

---

## 🔑 Paso 2: Obtener la Connection String

1. En el dashboard de Neon, ve a tu proyecto
2. Haz clic en **"Connection Details"**
3. Copia la **Connection String** que se ve así:
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
4. Esta será tu `DATABASE_URL`

---

## ⚙️ Paso 3: Configurar Variables de Entorno

### Desarrollo Local

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Neon Database
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require

# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-xxx
```

### Producción en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - **Key**: `DATABASE_URL`
   - **Value**: Tu connection string de Neon
   - **Environments**: Production, Preview, Development

---

## 🗄️ Paso 4: Inicializar la Base de Datos

### Opción A: Automática (Recomendado)

La base de datos se inicializa automáticamente la primera vez que visitas la **Biblioteca** o intentas guardar un libro.

### Opción B: Manual con Endpoint

Visita la siguiente URL después del deployment:

```
https://tu-app.vercel.app/api/init-db
```

Deberías ver un mensaje de éxito:
```json
{
  "exito": true,
  "mensaje": "Base de datos inicializada correctamente"
}
```

### Opción C: Manual con SQL Editor de Neon

Si prefieres hacerlo manualmente, ejecuta este SQL en el **SQL Editor** de Neon:

```sql
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
);

CREATE INDEX IF NOT EXISTS idx_libros_fecha_creacion
ON libros(fecha_creacion DESC);

CREATE INDEX IF NOT EXISTS idx_libros_usuario_id
ON libros(usuario_id);
```

---

## 🔍 Verificar la Configuración

### 1. Verificar que la tabla existe

En el SQL Editor de Neon, ejecuta:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Deberías ver la tabla `libros`.

### 2. Probar la conexión desde la aplicación

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre el navegador en `http://localhost:3000`

3. Ve a la sección **"Biblioteca"**

4. Si ves el mensaje "Tu biblioteca está vacía", ¡la conexión funciona! ✅

---

## 📊 Estructura de Datos

### Tabla `libros`

| Campo                 | Tipo      | Descripción                                        |
| --------------------- | --------- | -------------------------------------------------- |
| `id`                  | TEXT      | ID único del libro (PK)                            |
| `titulo`              | TEXT      | Título del libro                                   |
| `sinopsis`            | TEXT      | Sinopsis del libro                                 |
| `configuracion`       | JSONB     | Configuración (género, estilo, tono, etc.)         |
| `outline`             | JSONB     | Estructura del libro (capítulos, personajes, arco) |
| `capitulos`           | JSONB     | Array de capítulos completos                       |
| `fecha_creacion`      | TIMESTAMP | Fecha de creación                                  |
| `fecha_modificacion`  | TIMESTAMP | Fecha de última modificación                       |
| `palabras_totales`    | INTEGER   | Total de palabras del libro                        |
| `usuario_id`          | TEXT      | ID del usuario (opcional, para multi-usuario)      |
| `portada`             | TEXT      | URL o base64 de la portada (opcional)              |

---

## 🛠️ API Endpoints Disponibles

### `GET /api/libros`
Obtiene todos los libros de la base de datos.

**Respuesta:**
```json
{
  "exito": true,
  "libros": [...]
}
```

### `POST /api/libros`
Guarda un nuevo libro.

**Body:**
```json
{
  "titulo": "Mi Libro",
  "sinopsis": "Una historia...",
  "configuracion": {...},
  "outline": {...},
  "capitulos": [...]
}
```

### `DELETE /api/libros?id={id}`
Elimina un libro por su ID.

**Respuesta:**
```json
{
  "exito": true
}
```

### `GET /api/libros/estadisticas`
Obtiene estadísticas de la biblioteca.

**Respuesta:**
```json
{
  "exito": true,
  "estadisticas": {
    "totalLibros": 5,
    "totalPalabras": 125000,
    "totalCapitulos": 50,
    "generoMasComun": "Fantasía"
  }
}
```

---

## 💰 Costos de Neon

### Free Tier
- **Storage**: 512 MB
- **Compute**: 191.9 horas/mes
- **Branches**: 10

### Estimación de Uso
Un libro promedio ocupa aproximadamente:
- **Metadata**: ~2 KB
- **Capítulos** (10 capítulos × 3000 palabras): ~200 KB
- **Total por libro**: ~202 KB

Con el plan gratuito puedes almacenar aproximadamente **2,500 libros**.

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL no está definida"

**Solución**: Asegúrate de tener el archivo `.env.local` con la variable `DATABASE_URL`.

```bash
# Verifica que el archivo existe
cat .env.local
```

### Error: "relation 'libros' does not exist"

**Solución**: Ejecuta el SQL de inicialización en el SQL Editor de Neon.

### Error: "Connection timeout"

**Soluciones**:
1. Verifica que el connection string es correcto
2. Asegúrate de que incluye `?sslmode=require` al final
3. Verifica que tu IP no esté bloqueada en Neon (el plan Free permite todas las IPs)

### Los libros no aparecen en la biblioteca

**Solución**: Abre las DevTools del navegador (F12) y verifica:
1. Console: ¿Hay errores de red?
2. Network: ¿Las peticiones a `/api/libros` retornan 200?
3. Neon Dashboard: ¿Los datos están en la tabla?

```sql
-- Verifica en el SQL Editor de Neon
SELECT id, titulo, fecha_creacion FROM libros ORDER BY fecha_creacion DESC;
```

---

## 🔒 Seguridad

### Mejores Prácticas

1. **Nunca** commites el archivo `.env.local` al repositorio
2. Rota tu `DATABASE_URL` si se expone accidentalmente
3. En producción, considera usar **Read Replicas** de Neon para mayor rendimiento
4. Implementa autenticación antes de lanzar a producción

### Agregar Autenticación (Opcional)

Para multi-usuario, puedes usar:
- **Clerk**: Integración simple con Next.js
- **NextAuth.js**: Solución open-source
- **Supabase Auth**: Si migras a Supabase

---

## 📚 Recursos Adicionales

- [Neon Documentation](https://neon.tech/docs)
- [@neondatabase/serverless NPM](https://www.npmjs.com/package/@neondatabase/serverless)
- [Vercel + Neon Integration](https://vercel.com/integrations/neon)

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Neon creada
- [ ] Proyecto de Neon creado
- [ ] Connection string copiada
- [ ] `.env.local` creado con `DATABASE_URL`
- [ ] Tabla `libros` inicializada
- [ ] Aplicación corriendo en `localhost:3000`
- [ ] Biblioteca carga correctamente
- [ ] Variables de entorno configuradas en Vercel (si aplica)
- [ ] Primer libro guardado con éxito

---

¡Listo! Ahora tus libros se guardan en Neon y están disponibles para todos los usuarios. 🎉
