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
  return `Eres un profesional creador de esquemas de libros. Crea un esquema detallado para un libro con las siguientes especificaciones:

- Tema: ${config.tema}
- Género: ${config.genero}
- Estilo de escritura: ${config.estiloEscritura}
- Tono: ${config.tono}
- Audiencia objetivo: ${config.audienciaObjetivo}
- Número de capítulos: ${config.numeroCapitulos}

Genera un esquema completo que incluya:
1. Título del libro (creativo y atractivo)
2. Sinopsis breve (aproximadamente 200 palabras)
3. Para cada capítulo: título descriptivo, descripción de 2-3 oraciones sobre eventos clave o temas
4. Personajes principales (si aplica para ficción) con descripciones detalladas
5. Arco narrativo general o estructura del libro

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
