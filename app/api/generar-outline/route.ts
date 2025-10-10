import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { ConfiguracionLibro, Outline } from '@/lib/types';

// Inicializar cliente de Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const configuracion: ConfiguracionLibro = await request.json();

    // Validar que tenemos la API key
    if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { exito: false, error: 'ANTHROPIC_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Construir el prompt para generar el outline
    const prompt = construirPromptOutline(configuracion);

    // Llamar a Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 1.0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extraer el contenido de la respuesta
    const contenido = message.content[0];
    if (contenido.type !== 'text') {
      throw new Error('Respuesta inesperada de la API');
    }

    // Parsear el JSON del outline
    const textoRespuesta = contenido.text;
    const outline: Outline = parsearOutline(textoRespuesta);

    return NextResponse.json({
      exito: true,
      outline,
    });
  } catch (error) {
    console.error('Error generando outline:', error);
    return NextResponse.json(
      {
        exito: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * Construye el prompt para generar el outline del libro
 */
function construirPromptOutline(config: ConfiguracionLibro): string {
  return `Eres un profesional creador de esquemas de libros y guionista experto. Vas a crear un esquema detallado para un libro basado en la siguiente descripción del usuario.

DESCRIPCIÓN/HISTORIA DEL USUARIO:
"${config.tema}"

ESPECIFICACIONES TÉCNICAS:
- Género: ${config.genero}
- Estilo de escritura: ${config.estiloEscritura}
- Tono: ${config.tono}
- Audiencia objetivo: ${config.audienciaObjetivo}
- Número de capítulos: ${config.numeroCapitulos}

INSTRUCCIONES:
1. Analiza cuidadosamente la descripción proporcionada por el usuario
2. Extrae personajes, trama, conflictos y elementos clave mencionados
3. Usa estos elementos como base fundamental para crear el esquema
4. Si el usuario menciona nombres específicos, úsalos exactamente como se proporcionaron
5. Respeta cualquier detalle específico mencionado (lugares, objetos, eventos, relaciones)
6. Si falta información, complétala de manera coherente con lo descrito

Genera un esquema completo que incluya:
1. **Título del libro**: Creativo, atractivo y que refleje la esencia de la historia descrita
2. **Sinopsis**: 200-250 palabras que capturen fielmente la descripción del usuario
3. **Capítulos**: Exactamente ${config.numeroCapitulos} capítulos con:
   - Títulos descriptivos y atractivos
   - Descripciones de 2-4 oraciones sobre eventos clave, desarrollo de personajes y avance de la trama
   - Progresión lógica de la historia desde inicio hasta desenlace
4. **Personajes principales**: (si aplica) Incluye TODOS los personajes mencionados en la descripción + otros necesarios:
   - Nombre (usa los nombres exactos proporcionados)
   - Descripción detallada (personalidad, motivaciones, rol en la historia)
5. **Arco narrativo**: Estructura general del libro que refleje la historia descrita (150-200 palabras)

IMPORTANTE: Responde ÚNICAMENTE con JSON válido en este formato exacto:
{
  "titulo": "string",
  "sinopsis": "string",
  "capitulos": [
    {
      "numero": 1,
      "titulo": "string",
      "descripcion": "string"
    }
  ],
  "personajes": [
    {
      "nombre": "string",
      "descripcion": "string"
    }
  ],
  "arcoNarrativo": "string"
}

No incluyas ningún texto adicional fuera del JSON. El array de capítulos debe tener exactamente ${config.numeroCapitulos} elementos. Si el género no requiere personajes (como no ficción), deja el array de personajes vacío.`;
}

/**
 * Parsea la respuesta de Claude y extrae el JSON del outline
 */
function parsearOutline(textoRespuesta: string): Outline {
  try {
    // Intentar encontrar JSON en la respuesta
    const inicioJSON = textoRespuesta.indexOf('{');
    const finJSON = textoRespuesta.lastIndexOf('}') + 1;

    if (inicioJSON === -1 || finJSON === 0) {
      throw new Error('No se encontró JSON en la respuesta');
    }

    const jsonTexto = textoRespuesta.slice(inicioJSON, finJSON);
    const outline: Outline = JSON.parse(jsonTexto);

    // Validar estructura básica
    if (!outline.titulo || !outline.sinopsis || !Array.isArray(outline.capitulos)) {
      throw new Error('Estructura de outline inválida');
    }

    // Asegurar que personajes sea un array
    if (!Array.isArray(outline.personajes)) {
      outline.personajes = [];
    }

    return outline;
  } catch (error) {
    console.error('Error parseando outline:', error);
    throw new Error('No se pudo parsear el outline generado');
  }
}
