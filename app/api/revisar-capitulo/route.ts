import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

// Inicializar cliente de OpenAI con OpenRouter
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://bomkai.app',
    'X-Title': 'Bomkai',
  },
  dangerouslyAllowBrowser: false,
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
    if (!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
      return NextResponse.json(
        { exito: false, error: 'NEXT_PUBLIC_OPENROUTER_API_KEY no está configurada' },
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

    // Llamar a OpenRouter API
    const completion = await openai.chat.completions.create(
      {
        model: 'tngtech/deepseek-r1t2-chimera:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 8000,
        stream: false,
      },
      {
        headers: {
          'HTTP-Referer': 'https://bomkai.app',
          'X-Title': 'Bomkai',
        },
      }
    );

    // Extraer el contenido de la respuesta
    const textoRespuesta = completion.choices[0]?.message?.content;
    if (!textoRespuesta) {
      throw new Error('No se recibió contenido de la API');
    }

    return NextResponse.json({
      exito: true,
      contenido: textoRespuesta,
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
