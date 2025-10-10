import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Inicializar cliente de Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt }: { prompt: string } = body;

    // Validar que tenemos la API key
    if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { exito: false, error: 'NEXT_PUBLIC_ANTHROPIC_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Validar input
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { exito: false, error: 'El prompt es requerido' },
        { status: 400 }
      );
    }

    // Construir el prompt para mejorar la descripción
    const systemPrompt = construirPromptMejora(prompt);

    // Llamar a Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 1.0,
      messages: [
        {
          role: 'user',
          content: systemPrompt,
        },
      ],
    });

    // Extraer el contenido de la respuesta
    const contenido = message.content[0];
    if (contenido.type !== 'text') {
      throw new Error('Respuesta inesperada de la API');
    }

    return NextResponse.json({
      exito: true,
      promptMejorado: contenido.text,
    });
  } catch (error) {
    console.error('Error mejorando prompt:', error);
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
 * Construye el prompt para mejorar la descripción del usuario
 */
function construirPromptMejora(promptUsuario: string): string {
  return `Eres un asistente experto en desarrollo de historias y conceptos narrativos. Tu tarea es tomar la descripción inicial de un usuario para un libro y mejorarla, haciéndola más detallada, coherente y atractiva.

DESCRIPCIÓN ORIGINAL DEL USUARIO:
${promptUsuario}

Por favor, mejora esta descripción siguiendo estas pautas:

1. **Mantén la idea central**: No cambies la esencia de lo que el usuario quiere escribir
2. **Añade detalles específicos**: Profundiza en personajes, ambientación, conflictos, y motivaciones
3. **Estructura narrativa clara**: Asegúrate de que haya un inicio, desarrollo y conflicto bien definidos
4. **Elementos literarios**: Incluye detalles sobre el tono, atmósfera y temas que podrían explorarse
5. **Personajes más ricos**: Si hay personajes mencionados, añade rasgos de personalidad, motivaciones y arcos potenciales
6. **Ambientación vívida**: Describe el mundo o contexto con más detalle
7. **Conflicto central claro**: Define bien qué está en juego y qué obstáculos enfrentarán los personajes
8. **Longitud apropiada**: Expande la descripción a 3-5 párrafos bien desarrollados

IMPORTANTE:
- Proporciona ÚNICAMENTE la descripción mejorada, sin introducciones, explicaciones o comentarios meta
- No uses frases como "Aquí está la descripción mejorada" o "He mejorado tu descripción"
- Comienza directamente con la descripción mejorada del libro

Descripción mejorada:`;
}
