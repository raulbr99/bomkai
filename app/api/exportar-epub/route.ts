import { NextRequest } from 'next/server';
import JSZip from 'jszip';
import type { Capitulo, ConfiguracionLibro } from '@/lib/types';

export async function POST(request: NextRequest) {
  console.log('📚 [exportar-epub] Iniciando generación de EPUB');

  try {
    const body = await request.json();
    const {
      titulo,
      sinopsis,
      capitulos,
      configuracion,
    }: {
      titulo: string;
      sinopsis: string;
      capitulos: Capitulo[];
      configuracion: ConfiguracionLibro;
    } = body;

    console.log('📊 [exportar-epub] Parámetros recibidos:', {
      titulo,
      cantidadCapitulos: capitulos?.length || 0,
      genero: configuracion?.genero,
    });

    // Validar parámetros
    if (!titulo || !capitulos || capitulos.length === 0) {
      console.error('❌ [exportar-epub] Parámetros faltantes');
      return new Response(
        JSON.stringify({ error: 'Parámetros requeridos faltantes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar contenido para EPUB
    const capitulosCompletados = capitulos.filter(cap => cap.estado === 'completado');

    if (capitulosCompletados.length === 0) {
      console.error('❌ [exportar-epub] No hay capítulos completados');
      return new Response(
        JSON.stringify({ error: 'No hay capítulos completados para exportar' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📝 [exportar-epub] Preparando contenido del libro...');

    const palabrasTotales = capitulosCompletados.reduce((total, cap) => total + cap.palabras, 0);
    const fechaActual = new Date().toISOString();
    const uuid = `urn:uuid:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear ZIP para EPUB
    const zip = new JSZip();

    // Estructura EPUB estándar
    zip.file('mimetype', 'application/epub+zip');

    // META-INF/container.xml
    zip.folder('META-INF')?.file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    // CSS
    const css = `
body {
  font-family: Georgia, serif;
  line-height: 1.6;
  margin: 1em;
}
h1 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5em;
  margin-top: 1.5em;
}
h2 {
  color: #34495e;
  margin-top: 1.2em;
}
p {
  text-align: justify;
  margin-bottom: 1em;
}
.metadata {
  font-style: italic;
  color: #7f8c8d;
  border-left: 3px solid #3498db;
  padding-left: 1em;
  margin: 1.5em 0;
}`;

    zip.folder('OEBPS')?.file('styles.css', css);

    // Página de título
    const tituloHTML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>${titulo}</h1>
  <div class="metadata">
    <p><strong>Género:</strong> ${configuracion.genero}</p>
    <p><strong>Estilo:</strong> ${configuracion.estiloEscritura}</p>
    <p><strong>Tono:</strong> ${configuracion.tono}</p>
    <p><strong>Audiencia:</strong> ${configuracion.audienciaObjetivo}</p>
    <p><strong>Palabras:</strong> ${palabrasTotales.toLocaleString()}</p>
    <p><strong>Capítulos:</strong> ${capitulosCompletados.length}</p>
  </div>
  <h2>Sinopsis</h2>
  <p>${sinopsis}</p>
</body>
</html>`;

    zip.folder('OEBPS')?.file('title.html', tituloHTML);

    // Capítulos
    capitulosCompletados.forEach((capitulo) => {
      const capituloHTML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Capítulo ${capitulo.numero}: ${capitulo.titulo}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>Capítulo ${capitulo.numero}</h1>
  <h2>${capitulo.titulo}</h2>
  ${capitulo.contenido.split('\n\n').map(parrafo =>
    parrafo.trim() ? `<p>${parrafo.trim().replace(/\n/g, '<br/>')}</p>` : ''
  ).join('\n  ')}
</body>
</html>`;

      zip.folder('OEBPS')?.file(`chapter${capitulo.numero}.html`, capituloHTML);
    });

    // content.opf
    const manifestItems = [
      '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
      '<item id="css" href="styles.css" media-type="text/css"/>',
      '<item id="title" href="title.html" media-type="application/xhtml+xml"/>',
      ...capitulosCompletados.map(cap =>
        `<item id="chapter${cap.numero}" href="chapter${cap.numero}.html" media-type="application/xhtml+xml"/>`
      )
    ].join('\n    ');

    const spineItems = [
      '<itemref idref="title"/>',
      ...capitulosCompletados.map(cap => `<itemref idref="chapter${cap.numero}"/>`)
    ].join('\n    ');

    const contentOPF = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uuid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${titulo}</dc:title>
    <dc:creator>Generado con IA</dc:creator>
    <dc:language>es</dc:language>
    <dc:identifier id="uuid">${uuid}</dc:identifier>
    <dc:date>${fechaActual}</dc:date>
    <dc:publisher>BomkAI</dc:publisher>
    <dc:description>${sinopsis}</dc:description>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>`;

    zip.folder('OEBPS')?.file('content.opf', contentOPF);

    // toc.ncx
    const navPoints = capitulosCompletados.map((cap, idx) => `
    <navPoint id="navPoint-${idx + 2}" playOrder="${idx + 2}">
      <navLabel>
        <text>Capítulo ${cap.numero}: ${cap.titulo}</text>
      </navLabel>
      <content src="chapter${cap.numero}.html"/>
    </navPoint>`).join('');

    const tocNCX = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${titulo}</text>
  </docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel>
        <text>Portada</text>
      </navLabel>
      <content src="title.html"/>
    </navPoint>${navPoints}
  </navMap>
</ncx>`;

    zip.folder('OEBPS')?.file('toc.ncx', tocNCX);

    console.log('🔧 [exportar-epub] Generando archivo EPUB...');

    // Generar el ZIP
    const epubBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    console.log('✅ [exportar-epub] EPUB generado exitosamente:', {
      size: epubBuffer.length,
      sizeKB: Math.round(epubBuffer.length / 1024),
    });

    const nombreArchivo = `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;

    return new Response(epubBuffer, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
        'Content-Length': epubBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ [exportar-epub] Error generando EPUB:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error generando EPUB'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}