import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Inicializar cliente de Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      contenidoCapitulo,
      instruccionesRevision,
    }: {
      contenidoCapitulo: string;
      instruccionesRevision: string;
    } = body;

    // Validar que tenemos la API key
    if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { exito: false, error: 'NEXT_PUBLIC_ANTHROPIC_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Validar inputs
    if (!contenidoCapitulo || contenidoCapitulo.trim().length === 0) {
      return NextResponse.json(
        { exito: false, error: 'El contenido del capítulo es requerido' },
        { status: 400 }
      );
    }

    if (!instruccionesRevision || instruccionesRevision.trim().length === 0) {
      return NextResponse.json(
        { exito: false, error: 'Las instrucciones de revisión son requeridas' },
        { status: 400 }
      );
    }

    // Construir el prompt para revisar el capítulo
    const prompt = construirPromptRevision(contenidoCapitulo, instruccionesRevision);

    // Llamar a Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
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

    return NextResponse.json({
      exito: true,
      contenido: contenido.text,
    });
  } catch (error) {
    console.error('Error revisando capítulo:', error);
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
 * Construye el prompt para revisar y mejorar un capítulo
 */
function construirPromptRevision(contenidoCapitulo: string, instrucciones: string): string {
  return `Eres un editor profesional de libros. Tu tarea es revisar y mejorar el siguiente capítulo según las instrucciones específicas proporcionadas.

CAPÍTULO ORIGINAL:
${contenidoCapitulo}

INSTRUCCIONES DE REVISIÓN:
${instrucciones}

Por favor, revisa el capítulo aplicando las mejoras solicitadas. Mantén la esencia y estructura general del capítulo mientras implementas los cambios necesarios. Asegúrate de:

1. Mantener la coherencia narrativa
2. Preservar el tono y estilo del texto original
3. Aplicar las mejoras específicas solicitadas
4. Mantener o mejorar la calidad literaria

Proporciona ÚNICAMENTE el capítulo revisado y mejorado, sin explicaciones adicionales, comentarios o introducciones. Comienza directamente con el contenido revisado:`;
}
