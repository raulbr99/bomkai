import OpenAI from 'openai';
import { NextRequest } from 'next/server';
import type { ConfiguracionLibro, Outline } from '@/lib/types';

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

    // Validar que tenemos la API key
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    console.log('🔑 [generar-capitulo] Verificando API key:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 10) || 'N/A',
    });

    if (!apiKey) {
      console.error('❌ [generar-capitulo] API key no configurada');
      return new Response(
        JSON.stringify({
          tipo: 'error',
          contenido: 'OPENROUTER_API_KEY no está configurada. Verifica que NEXT_PUBLIC_OPENROUTER_API_KEY esté configurada en las variables de entorno.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar formato de la API key de OpenRouter
    if (!apiKey.startsWith('sk-or-')) {
      console.error('❌ [generar-capitulo] API key con formato inválido');
      return new Response(
        JSON.stringify({
          tipo: 'error',
          contenido: 'La API key de OpenRouter tiene un formato inválido. Debe comenzar con "sk-or-"'
        }),
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
          console.log('🤖 [generar-capitulo] Llamando a OpenRouter API...');

          // Usar streaming de OpenAI con stream: true y el modelo seleccionado
          const stream = await openai.chat.completions.create(
            {
              model: configuracion.modelo || 'tngtech/deepseek-r1t2-chimera:free',
              messages: [
                {
                  role: 'user',
                  content: prompt,
                },
              ],
              temperature: 0.9,
              max_tokens: 8000,
              stream: true,
            },
            {
              headers: {
                'HTTP-Referer': 'https://bomkai.app',
                'X-Title': 'Bomkai',
              },
            }
          ).catch((streamError: unknown) => {
            console.error('❌ [generar-capitulo] Error iniciando stream:', {
              error: streamError instanceof Error ? streamError.message : 'Error desconocido',
              name: streamError instanceof Error ? streamError.name : undefined,
            });
            throw streamError;
          });

          console.log('✅ [generar-capitulo] Conexión con OpenRouter establecida');

          // Procesar cada chunk del stream
          console.log('📦 [generar-capitulo] Procesando chunks del stream...');
          let chunkCount = 0;

          for await (const chunk of stream) {
            // Extraer el contenido del chunk
            const texto = chunk.choices[0]?.delta?.content || '';

            if (texto) {
              chunkCount++;
              contenidoCompleto += texto;

              // Log cada 50 chunks para no saturar los logs
              if (chunkCount % 50 === 0) {
                console.log(`📊 [generar-capitulo] Procesados ${chunkCount} chunks, contenido: ${contenidoCompleto.length} caracteres`);
              }

              // Enviar chunk al cliente
              try {
                const chunkData = {
                  tipo: 'chunk',
                  contenido: texto,
                };
                const jsonString = JSON.stringify(chunkData);
                const data = `data: ${jsonString}\n\n`;
                controller.enqueue(encoder.encode(data));
              } catch (encodeError) {
                console.error('❌ [generar-capitulo] Error codificando chunk:', {
                  error: encodeError instanceof Error ? encodeError.message : 'Error desconocido',
                  textoLength: texto.length,
                });
              }
            }
          }

          console.log(`✅ [generar-capitulo] Stream completado. Total chunks: ${chunkCount}, contenido final: ${contenidoCompleto.length} caracteres`);

          // Enviar mensaje de completado
          try {
            const mensajeFinal = {
              tipo: 'completo',
              contenido: contenidoCompleto,
            };
            const jsonString = JSON.stringify(mensajeFinal);
            const data = `data: ${jsonString}\n\n`;
            controller.enqueue(encoder.encode(data));
            console.log('✅ [generar-capitulo] Mensaje final enviado exitosamente');
          } catch (finalError) {
            console.error('❌ [generar-capitulo] Error enviando mensaje final:', {
              error: finalError instanceof Error ? finalError.message : 'Error desconocido',
              contenidoLength: contenidoCompleto.length,
            });
          }

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

  // Determinar la posición del capítulo en el arco narrativo
  const totalCapitulos = outline.capitulos.length;
  const porcentajeProgreso = Math.round((numeroCapitulo / totalCapitulos) * 100);
  let etapaArcoNarrativo = '';

  if (porcentajeProgreso <= 25) {
    etapaArcoNarrativo = 'INICIO/EXPOSICIÓN - Establece el mundo, personajes y conflicto inicial';
  } else if (porcentajeProgreso <= 50) {
    etapaArcoNarrativo = 'DESARROLLO ASCENDENTE - Profundiza el conflicto y desarrolla las tramas secundarias';
  } else if (porcentajeProgreso <= 75) {
    etapaArcoNarrativo = 'CLÍMAX - Llega al punto de máxima tensión y decisiones críticas';
  } else {
    etapaArcoNarrativo = 'RESOLUCIÓN - Resuelve conflictos y cierra arcos narrativos';
  }

  let prompt = `Eres un escritor profesional talentoso escribiendo el Capítulo ${numeroCapitulo} de ${totalCapitulos} de un libro.

CONTEXTO DEL LIBRO:
- Título: ${outline.titulo}
- Género: ${configuracion.genero}
- Estilo de escritura: ${configuracion.estiloEscritura}
- Tono: ${configuracion.tono}
- Audiencia objetivo: ${configuracion.audienciaObjetivo}
- Sinopsis: ${outline.sinopsis}

ARCO NARRATIVO GENERAL:
${outline.arcoNarrativo}

POSICIÓN EN EL ARCO NARRATIVO:
Este es el capítulo ${numeroCapitulo} de ${totalCapitulos} (${porcentajeProgreso}% del libro).
Etapa actual: ${etapaArcoNarrativo}
`;

  // Añadir personajes si existen
  if (outline.personajes && outline.personajes.length > 0) {
    prompt += `\nPERSONAJES PRINCIPALES:\n`;
    for (const personaje of outline.personajes) {
      prompt += `- ${personaje.nombre}: ${personaje.descripcion}\n`;
    }
  }

  // Mostrar visión general de todos los capítulos para coherencia
  prompt += `\nESTRUCTURA COMPLETA DEL LIBRO:\n`;
  outline.capitulos.forEach((cap) => {
    const marcador = cap.numero === numeroCapitulo ? '→ [ESTE CAPÍTULO]' : '';
    prompt += `${cap.numero}. ${cap.titulo}${marcador}\n   ${cap.descripcion}\n`;
  });

  // Añadir resúmenes de capítulos anteriores con más detalle
  if (resumenesAnteriores.length > 0) {
    prompt += `\nLO QUE HA SUCEDIDO HASTA AHORA:\n`;
    resumenesAnteriores.forEach((resumen, index) => {
      prompt += `\nCapítulo ${index + 1} - "${outline.capitulos[index]?.titulo}":\n${resumen}\n`;
    });

    // Recordatorio de continuidad
    const ultimoResumen = resumenesAnteriores[resumenesAnteriores.length - 1];
    prompt += `\n⚠️ IMPORTANTE - CONTINUIDAD NARRATIVA:
El capítulo anterior terminó con: "${ultimoResumen.slice(-200)}"
Este capítulo DEBE continuar de manera natural y coherente desde ese punto.
`;
  }

  // Añadir el siguiente capítulo para contexto
  const siguienteCapitulo = outline.capitulos.find(cap => cap.numero === numeroCapitulo + 1);
  if (siguienteCapitulo) {
    prompt += `\nPREPARACIÓN PARA EL SIGUIENTE CAPÍTULO:
El próximo capítulo será: "${siguienteCapitulo.titulo}" - ${siguienteCapitulo.descripcion}
Asegúrate de que este capítulo prepare el terreno para esa continuación.
`;
  }

  prompt += `\nOBJETIVO DE ESTE CAPÍTULO:
Título: "${capituloInfo.titulo}"
Descripción: ${capituloInfo.descripcion}

INSTRUCCIONES CRÍTICAS:
1. COHERENCIA NARRATIVA:
   - Mantén continuidad absoluta con los capítulos anteriores (personajes, eventos, detalles)
   - Referencia sutilmente eventos previos cuando sea natural
   - Los personajes deben recordar y actuar según lo sucedido anteriormente
   - Mantén consistencia en nombres, lugares, fechas y detalles establecidos

2. DESARROLLO DEL CAPÍTULO:
   - Apertura atractiva que conecte con el capítulo anterior
   - Contenido bien desarrollado (2000-3500 palabras aproximadamente)
   - Flujo natural: CADA ESCENA debe conectar lógicamente con la siguiente
   - Diálogos naturales que reflejen la personalidad establecida de los personajes
   - Descripciones inmersivas apropiadas al género y tono

3. PROGRESIÓN DE LA TRAMA:
   - Avanza el arco narrativo principal según la etapa: ${etapaArcoNarrativo}
   - Cumple con el objetivo específico de este capítulo: ${capituloInfo.descripcion}
   - Desarrolla o resuelve sub-tramas según corresponda
   - Final del capítulo que invite a seguir leyendo (pero NO cliffhangers forzados)

4. ESTILO Y CONSISTENCIA:
   - Mantén el mismo estilo de escritura: ${configuracion.estiloEscritura}
   - Conserva el tono establecido: ${configuracion.tono}
   - Voz narrativa consistente con capítulos anteriores
   - Apropiado para: ${configuracion.audienciaObjetivo}

⚠️ ERRORES COMUNES A EVITAR:
- NO repitas información ya establecida en capítulos anteriores
- NO ignores eventos o revelaciones de capítulos previos
- NO cambies personalidades de personajes sin justificación
- NO introduzcas elementos contradictorios con la trama establecida
- NO escribas capítulos aislados; cada uno es parte de un todo coherente

Escribe de manera profesional y apropiada para el género y audiencia especificados. NO incluyas el título del capítulo en tu respuesta, solo el contenido narrativo.

Comienza a escribir el capítulo ahora:`;

  console.log('✅ [construirPromptCapitulo] Prompt construido exitosamente:', {
    promptLength: prompt.length,
    hasPersonajes: outline.personajes && outline.personajes.length > 0,
    hasResumenes: resumenesAnteriores.length > 0,
  });

  return prompt;
}
