import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
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
  try {
    const configuracion: ConfiguracionLibro = await request.json();

    // Validar que tenemos la API key
    if (!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
      return NextResponse.json(
        { exito: false, error: 'OPENROUTER_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Construir el prompt para generar el outline
    const prompt = construirPromptOutline(configuracion);

    // Llamar a OpenRouter API con el modelo seleccionado
    const completion = await openai.chat.completions.create(
      {
        model: configuracion.modelo || 'tngtech/deepseek-r1t2-chimera:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
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

    // Parsear el JSON del outline
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
2. **Sinopsis**: 150-200 palabras que capturen fielmente la descripción del usuario
3. **Capítulos**: Exactamente ${config.numeroCapitulos} capítulos con:
   - Títulos descriptivos y atractivos
   - Descripciones de 2-3 oraciones concisas sobre eventos clave y avance de la trama
   - Progresión lógica de la historia desde inicio hasta desenlace
4. **Personajes principales**: (si aplica) Incluye TODOS los personajes mencionados en la descripción + otros necesarios:
   - Nombre (usa los nombres exactos proporcionados)
   - Descripción concisa (2-3 oraciones sobre personalidad, motivaciones, rol)
5. **Arco narrativo**: Estructura general del libro que refleje la historia descrita (100-150 palabras)

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

REGLAS ESTRICTAS PARA EL JSON:
- NO incluyas texto adicional fuera del JSON
- USA SOLO caracteres ASCII estándar (sin emojis, sin caracteres especiales no latinos)
- Todas las comillas deben ser comillas dobles rectas (")
- NO uses saltos de línea dentro de los valores de string
- El array de capítulos debe tener EXACTAMENTE ${config.numeroCapitulos} elementos
- Si el género no requiere personajes, usa un array vacío: "personajes": []
- VERIFICA que todas las llaves y corchetes estén balanceados
- NO termines propiedades con comas antes de }
- USA solo español estándar, sin mezclar idiomas`;
}

/**
 * Parsea la respuesta del modelo y extrae el JSON del outline
 */
function parsearOutline(textoRespuesta: string): Outline {
  try {
    // Intentar encontrar JSON en la respuesta
    let inicioJSON = textoRespuesta.indexOf('{');
    let finJSON = textoRespuesta.lastIndexOf('}');

    if (inicioJSON === -1 || finJSON === -1) {
      console.error('No se encontró JSON completo en la respuesta');
      console.error('Respuesta completa:', textoRespuesta);
      throw new Error('No se encontró JSON en la respuesta');
    }

    // Si el JSON está incompleto, intentar reconstruirlo
    let jsonTexto = textoRespuesta.slice(inicioJSON, finJSON + 1);

    // Verificar si el JSON parece estar truncado
    const llavesCierre = (jsonTexto.match(/\}/g) || []).length;
    const llavesApertura = (jsonTexto.match(/\{/g) || []).length;

    if (llavesCierre < llavesApertura) {
      console.warn('JSON parece truncado, intentando reparar...');
      // Añadir las llaves faltantes
      for (let i = 0; i < llavesApertura - llavesCierre; i++) {
        jsonTexto += '}';
      }
    }

    // Limpiar caracteres de control y errores comunes en JSON
    jsonTexto = jsonTexto
      // Caracteres de control
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ')
      // Múltiples espacios a uno solo
      .replace(/\s+/g, ' ')
      // Comas antes de llaves de cierre (error común)
      .replace(/,(\s*[}\]])/g, '$1')
      // Comillas inteligentes a comillas normales
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'");

    // Intentar parsear el JSON
    let outline: Outline;
    try {
      outline = JSON.parse(jsonTexto);
    } catch (parseError) {
      // Si falla, intentar una limpieza más agresiva
      console.warn('Primera pasada de parsing falló, intentando limpieza adicional...');

      // Remover caracteres no ASCII excepto los necesarios
      jsonTexto = jsonTexto.replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g, '');

      outline = JSON.parse(jsonTexto);
    }

    // Validar estructura básica
    if (!outline.titulo || !outline.sinopsis || !Array.isArray(outline.capitulos)) {
      throw new Error('Estructura de outline inválida');
    }

    // Asegurar que personajes sea un array
    if (!Array.isArray(outline.personajes)) {
      outline.personajes = [];
    }

    // Limpiar y normalizar valores
    outline.sinopsis = outline.sinopsis.replace(/\s+/g, ' ').trim();
    outline.arcoNarrativo = outline.arcoNarrativo?.replace(/\s+/g, ' ').trim() || '';
    outline.capitulos = outline.capitulos.map(cap => ({
      ...cap,
      titulo: cap.titulo.replace(/\s+/g, ' ').trim(),
      descripcion: (cap.descripcion || '').replace(/\s+/g, ' ').trim(),
    }));
    if (outline.personajes) {
      outline.personajes = outline.personajes.map(per => ({
        ...per,
        nombre: per.nombre.replace(/\s+/g, ' ').trim(),
        descripcion: (per.descripcion || '').replace(/\s+/g, ' ').trim(),
      }));
    }

    return outline;
  } catch (error) {
    console.error('Error parseando outline:', error);
    console.error('Texto de respuesta completa:', textoRespuesta);
    throw new Error('No se pudo parsear el outline generado. El modelo generó JSON inválido.');
  }
}
