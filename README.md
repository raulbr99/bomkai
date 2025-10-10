# Generador de Libros con IA - Claude

Una aplicación completa de Next.js 14+ que genera libros completos usando la API de Claude (Anthropic). Crea historias estructuradas, bien escritas y coherentes con control total sobre el género, estilo, tono y audiencia objetivo.

## ✨ Características

- **Generación Completa de Libros**: Crea libros de 1-50 capítulos con narrativa coherente
- **Streaming en Tiempo Real**: Ve cómo se genera cada capítulo palabra por palabra
- **Control Total**: Configura género, estilo de escritura, tono y audiencia objetivo
- **Gestión de Contexto**: Mantiene coherencia narrativa a través de todos los capítulos
- **Edición con IA**: Mejora capítulos con instrucciones específicas usando Claude
- **Múltiples Formatos de Exportación**: Descarga en TXT, Markdown o JSON
- **Interfaz Moderna**: UI responsiva con Tailwind CSS y modo oscuro
- **Seguimiento de Progreso**: Visualización en tiempo real del estado de generación

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- Una API key de Anthropic ([obtén una aquí](https://console.anthropic.com/))

### Pasos

1. **Clona el repositorio**
```bash
git clone <url-repositorio>
cd bomkai
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` y añade tu API key de Anthropic:
```
ANTHROPIC_API_KEY=tu_api_key_aqui
```

4. **Inicia el servidor de desarrollo**
```bash
npm run dev
```

5. **Abre tu navegador**
```
http://localhost:3000
```

## 📖 Uso

### 1. Configurar el Libro

Completa el formulario con:
- **Tema/Tópico**: De qué trata el libro (ej: "Una aventura épica en un mundo de fantasía")
- **Género**: Ficción, No Ficción, Fantasía, Ciencia Ficción, Misterio, Romance, Autoayuda, Biografía
- **Número de Capítulos**: De 1 a 50
- **Estilo de Escritura**: Descriptivo, Conciso, Poético, Periodístico, Académico, Conversacional
- **Tono**: Formal, Casual, Humorístico, Serio, Inspiracional, Oscuro
- **Audiencia Objetivo**: Niños, Jóvenes Adultos, Adultos, Académico

### 2. Generación Automática

1. **Outline**: La IA genera primero un esquema completo del libro
2. **Capítulos**: Cada capítulo se genera secuencialmente con streaming en vivo
3. **Contexto**: Cada capítulo usa el contexto de los anteriores para mantener coherencia

### 3. Edición y Mejora

- **Editar**: Haz clic en "Editar" para modificar cualquier capítulo manualmente
- **Mejorar con IA**: Usa instrucciones específicas para que Claude mejore el capítulo
- **Regenerar**: (Próximamente) Regenera capítulos individuales

### 4. Exportación

Descarga tu libro completo en:
- **TXT**: Texto plano simple
- **Markdown**: Con formato y metadata
- **JSON**: Datos estructurados con metadata completa

## 🏗️ Arquitectura

### Estructura del Proyecto

```
bomkai/
├── app/
│   ├── api/
│   │   ├── generar-outline/route.ts    # Genera esquema del libro
│   │   ├── generar-capitulo/route.ts   # Genera capítulos con streaming
│   │   └── revisar-capitulo/route.ts   # Mejora capítulos con IA
│   ├── components/
│   │   ├── FormularioConfiguracion.tsx # Formulario inicial
│   │   ├── VisualizadorProgreso.tsx    # Progreso en tiempo real
│   │   ├── PreviewCapitulos.tsx        # Lista de capítulos
│   │   ├── EditorCapitulo.tsx          # Editor modal
│   │   └── ExportadorLibro.tsx         # Exportación múltiples formatos
│   ├── lib/
│   │   ├── types.ts                    # TypeScript types
│   │   └── utils.ts                    # Funciones auxiliares
│   ├── layout.tsx                      # Layout raíz
│   ├── page.tsx                        # Página principal
│   └── globals.css                     # Estilos globales
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

### Flujo de Datos

1. **Configuración** → Usuario completa formulario
2. **Outline** → POST `/api/generar-outline` → Genera estructura del libro
3. **Capítulos** → Loop: Para cada capítulo
   - POST `/api/generar-capitulo` con streaming
   - Actualiza UI en tiempo real
   - Genera resumen para contexto
4. **Completado** → Permite edición y exportación

### API Routes

#### POST `/api/generar-outline`
Genera el esquema completo del libro.

**Request:**
```json
{
  "tema": "string",
  "genero": "Ficción",
  "numeroCapitulos": 5,
  "estiloEscritura": "Descriptivo",
  "tono": "Casual",
  "audienciaObjetivo": "Adultos"
}
```

**Response:**
```json
{
  "exito": true,
  "outline": {
    "titulo": "string",
    "sinopsis": "string",
    "capitulos": [...],
    "personajes": [...],
    "arcoNarrativo": "string"
  }
}
```

#### POST `/api/generar-capitulo`
Genera un capítulo con Server-Sent Events streaming.

**Request:**
```json
{
  "numeroCapitulo": 1,
  "outline": {...},
  "configuracion": {...},
  "resumenesAnteriores": [...]
}
```

**Response (SSE):**
```
data: {"tipo":"chunk","contenido":"..."}

data: {"tipo":"completo","contenido":"..."}
```

#### POST `/api/revisar-capitulo`
Mejora un capítulo existente.

**Request:**
```json
{
  "contenidoCapitulo": "string",
  "instruccionesRevision": "string"
}
```

**Response:**
```json
{
  "exito": true,
  "contenido": "string mejorado"
}
```

## 💰 Estimación de Costos

Basado en los precios de Claude Sonnet 4 (a enero 2025):

### Por Capítulo
- **Input**: ~2,000 tokens (contexto) = $0.006
- **Output**: ~3,000 tokens (contenido) = $0.045
- **Total por capítulo**: ~$0.051

### Por Libro
- **5 capítulos**: ~$0.25
- **10 capítulos**: ~$0.51
- **20 capítulos**: ~$1.02
- **50 capítulos**: ~$2.55

**Nota**: Los costos reales varían según:
- Longitud del contexto acumulado
- Longitud de los capítulos generados
- Número de iteraciones de mejora con IA

## 🛠️ Stack Tecnológico

- **Next.js 14.2+** - App Router
- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 3.4** - Estilos
- **Anthropic SDK** - Claude API integration
- **Lucide React** - Iconos

## 🔧 Desarrollo

### Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```

### Personalización

#### Modelos de Claude
Edita los archivos de API routes para cambiar el modelo:
```typescript
model: 'claude-sonnet-4-20250514'  // Cambia según necesites
```

#### Límites de Tokens
Ajusta `max_tokens` en los endpoints:
```typescript
max_tokens: 8000  // Aumenta para capítulos más largos
```

#### Estilos
Modifica `tailwind.config.ts` para personalizar colores, fuentes y más.

## 🐛 Solución de Problemas

### Error: ANTHROPIC_API_KEY no está configurada
- Asegúrate de que el archivo `.env` existe
- Verifica que la variable `ANTHROPIC_API_KEY` está configurada correctamente
- Reinicia el servidor de desarrollo después de cambiar `.env`

### El streaming no funciona
- Verifica que estás usando Next.js 14.2+
- Comprueba la consola del navegador para errores
- Asegúrate de que el endpoint retorna `text/event-stream`

### Errores de TypeScript
- Ejecuta `npm install` para asegurar todas las dependencias
- Verifica que `tsconfig.json` tiene las rutas correctas
- Reinicia el servidor TypeScript en tu editor

### Capítulos inconsistentes
- Reduce el número de capítulos para pruebas
- Revisa que los resúmenes se generan correctamente
- Ajusta los prompts en los API routes si es necesario

## 🚧 Mejoras Futuras

- [ ] Regeneración de capítulos individuales
- [ ] Guardado y carga de proyectos
- [ ] Múltiples idiomas de generación
- [ ] Exportación a EPUB/PDF
- [ ] Colaboración en tiempo real
- [ ] Templates de géneros predefinidos
- [ ] Análisis de calidad narrativa
- [ ] Integración con servicios de publicación
- [ ] Modo de revisión completa del libro
- [ ] Generación de portadas con IA

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

Para preguntas, sugerencias o reportar bugs, abre un issue en GitHub.

---

**Hecho con Claude AI y Next.js** 🚀
