import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { ConfiguracionLibro, Outline } from '@/lib/types';

// Inicializar cliente de Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🚀 [generar-capitulo] Iniciando endpoint');
  
  try {
    // Log de headers para debugging
    console.log('📋 [generar-capitulo] Headers recibidos:', {
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent'),
    });

    console.log('📥 [generar-capitulo] Parseando body de la request...');
    const body = await request.json();
    console.log('✅ [generar-capitulo] Body parseado exitosamente');
    
    const {
      numeroCapitulo,
      outline,
      configuracion,
      resumenesAnteriores,
    }: {
      numeroCapitulo: number;
      outline: Outline;
      configuracion: ConfiguracionLibro;
      resumenesAnteriores: string[];
    } = body;

    // Log de parámetros recibidos
    console.log('📊 [generar-capitulo] Parámetros recibidos:', {
      numeroCapitulo,
      tituloLibro: outline?.titulo,
      genero: configuracion?.genero,
      cantidadCapitulos: outline?.capitulos?.length,
      resumenesAnteriores: resumenesAnteriores?.length || 0,
    });

    // Validar parámetros requeridos
    if (!numeroCapitulo || !outline || !configuracion) {
      console.error('❌ [generar-capitulo] Parámetros faltantes:', {
        numeroCapitulo: !!numeroCapitulo,
        outline: !!outline,
        configuracion: !!configuracion,
      });
      return new Response(
        JSON.stringify({ 
          tipo: 'error', 
          contenido: 'Parámetros requeridos faltantes: numeroCapitulo, outline, configuracion' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar que tenemos la API key (corregir nombre de variable)
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    console.log('🔑 [generar-capitulo] Verificando API key:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 10) || 'N/A',
    });
    
    if (!apiKey) {
      console.error('❌ [generar-capitulo] API key no configurada');
      return new Response(
        JSON.stringify({ tipo: 'error', contenido: 'ANTHROPIC_API_KEY no está configurada' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Construir el prompt para generar el capítulo
    console.log('📝 [generar-capitulo] Construyendo prompt...');
    let prompt: string;
    try {
      prompt = construirPromptCapitulo(
        numeroCapitulo,
        outline,
        configuracion,
        resumenesAnteriores
      );
      console.log('✅ [generar-capitulo] Prompt construido exitosamente:', {
        promptLength: prompt.length,
        numeroCapitulo,
        tituloCapitulo: outline.capitulos.find(cap => cap.numero === numeroCapitulo)?.titulo,
      });
    } catch (promptError) {
      console.error('❌ [generar-capitulo] Error construyendo prompt:', promptError);
      throw promptError;
    }

    // Crear un ReadableStream para streaming
    console.log('🌊 [generar-capitulo] Iniciando streaming...');
    const encoder = new TextEncoder();
    let contenidoCompleto = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🤖 [generar-capitulo] Llamando a Anthropic API...');
          
          // Usar streaming de Anthropic
          const streamResponse = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8000,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          });
          
          console.log('✅ [generar-capitulo] Conexión con Anthropic establecida');

          // Procesar cada chunk del stream
          console.log('📦 [generar-capitulo] Procesando chunks del stream...');
          let chunkCount = 0;
          
          for await (const event of streamResponse) {
            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                chunkCount++;
                const texto = event.delta.text;
                contenidoCompleto += texto;

                // Log cada 50 chunks para no saturar los logs
                if (chunkCount % 50 === 0) {
                  console.log(`📊 [generar-capitulo] Procesados ${chunkCount} chunks, contenido: ${contenidoCompleto.length} caracteres`);
                }

                // Enviar chunk al cliente
                const chunk = {
                  tipo: 'chunk',
                  contenido: texto,
                };
                const data = `data: ${JSON.stringify(chunk)}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
          }

          console.log(`✅ [generar-capitulo] Stream completado. Total chunks: ${chunkCount}, contenido final: ${contenidoCompleto.length} caracteres`);

          // Enviar mensaje de completado
          const mensajeFinal = {
            tipo: 'completo',
            contenido: contenidoCompleto,
          };
          const data = `data: ${JSON.stringify(mensajeFinal)}\n\n`;
          controller.enqueue(encoder.encode(data));

          controller.close();
        } catch (error) {
          console.error('❌ [generar-capitulo] Error en streaming:', {
            error: error instanceof Error ? error.message : 'Error desconocido',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined,
          });
          
          const mensajeError = {
            tipo: 'error',
            contenido: error instanceof Error ? error.message : 'Error desconocido',
          };
          const data = `data: ${JSON.stringify(mensajeError)}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        }
      },
    });

    console.log('🎯 [generar-capitulo] Retornando stream response');
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('❌ [generar-capitulo] Error general en endpoint:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString(),
    });
    
    return new Response(
      JSON.stringify({
        tipo: 'error',
        contenido: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Construye el prompt para generar un capítulo específico
 */
function construirPromptCapitulo(
  numeroCapitulo: number,
  outline: Outline,
  configuracion: ConfiguracionLibro,
  resumenesAnteriores: string[]
): string {
  console.log('🔍 [construirPromptCapitulo] Iniciando construcción de prompt:', {
    numeroCapitulo,
    totalCapitulos: outline.capitulos?.length || 0,
    resumenesCount: resumenesAnteriores?.length || 0,
  });

  const capituloInfo = outline.capitulos.find(cap => cap.numero === numeroCapitulo);

  if (!capituloInfo) {
    console.error('❌ [construirPromptCapitulo] Capítulo no encontrado:', {
      numeroCapitulo,
      capitulosDisponibles: outline.capitulos.map(cap => ({ numero: cap.numero, titulo: cap.titulo })),
    });
    throw new Error(`No se encontró información para el capítulo ${numeroCapitulo}`);
  }

  console.log('✅ [construirPromptCapitulo] Capítulo encontrado:', {
    numero: capituloInfo.numero,
    titulo: capituloInfo.titulo,
    descripcionLength: capituloInfo.descripcion?.length || 0,
  });

  let prompt = `Eres un escritor profesional talentoso escribiendo el Capítulo ${numeroCapitulo} de un libro.

CONTEXTO DEL LIBRO:
- Título: ${outline.titulo}
- Género: ${configuracion.genero}
- Estilo de escritura: ${configuracion.estiloEscritura}
- Tono: ${configuracion.tono}
- Audiencia objetivo: ${configuracion.audienciaObjetivo}
- Sinopsis: ${outline.sinopsis}

ARCO NARRATIVO GENERAL:
${outline.arcoNarrativo}
`;

  // Añadir personajes si existen
  if (outline.personajes && outline.personajes.length > 0) {
    prompt += `\nPERSONAJES PRINCIPALES:\n`;
    for (const personaje of outline.personajes) {
      prompt += `- ${personaje.nombre}: ${personaje.descripcion}\n`;
    }
  }

  // Añadir resúmenes de capítulos anteriores
  if (resumenesAnteriores.length > 0) {
    prompt += `\nRESUMEN DE CAPÍTULOS ANTERIORES:\n`;
    resumenesAnteriores.forEach((resumen, index) => {
      prompt += `\nCapítulo ${index + 1}:\n${resumen}\n`;
    });
  }

  prompt += `\nOBJETIVO DEL CAPÍTULO ${numeroCapitulo}:
Título: "${capituloInfo.titulo}"
Descripción: ${capituloInfo.descripcion}

INSTRUCCIONES:
Escribe el capítulo completo con las siguientes características:
- Apertura atractiva que enganche al lector
- Contenido bien desarrollado (2000-3500 palabras aproximadamente)
- Flujo natural desde los capítulos anteriores (si aplica)
- Diálogos naturales y descripciones inmersivas
- Avance de la trama o desarrollo de temas clave
- Final del capítulo que invite a seguir leyendo
- Mantén consistencia en estilo, tono y voz narrativa

Escribe de manera profesional y apropiada para el género y audiencia especificados. NO incluyas el título del capítulo en tu respuesta, solo el contenido narrativo.

Comienza a escribir el capítulo ahora:`;

  console.log('✅ [construirPromptCapitulo] Prompt construido exitosamente:', {
    promptLength: prompt.length,
    hasPersonajes: outline.personajes && outline.personajes.length > 0,
    hasResumenes: resumenesAnteriores.length > 0,
  });

  return prompt;
}
