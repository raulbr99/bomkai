import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import type { Capitulo, ConfiguracionLibro } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, sinopsis, capitulos, configuracion } = body as {
      titulo: string;
      sinopsis: string;
      capitulos: Capitulo[];
      configuracion: ConfiguracionLibro;
    };

    // Validar parámetros
    if (!titulo || !capitulos || capitulos.length === 0) {
      return NextResponse.json(
        { error: 'Título y capítulos son requeridos' },
        { status: 400 }
      );
    }

    // Crear documento PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);
    let y = margin;

    // Función helper para agregar nueva página si es necesario
    const checkPageBreak = (neededSpace: number) => {
      if (y + neededSpace > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // Función para agregar texto con word wrap
    const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal', align: 'left' | 'center' = 'left') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);

      const lines = doc.splitTextToSize(text, maxLineWidth);

      for (let i = 0; i < lines.length; i++) {
        checkPageBreak(fontSize * 0.5);

        if (align === 'center') {
          const textWidth = doc.getTextWidth(lines[i]);
          doc.text(lines[i], (pageWidth - textWidth) / 2, y);
        } else {
          doc.text(lines[i], margin, y);
        }

        y += fontSize * 0.5;
      }
    };

    // Portada
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    y = pageHeight / 3;
    const titleLines = doc.splitTextToSize(titulo.toUpperCase(), maxLineWidth);
    for (const line of titleLines) {
      const textWidth = doc.getTextWidth(line);
      doc.text(line, (pageWidth - textWidth) / 2, y);
      y += 12;
    }

    // Metadata
    y += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const metadata = `${configuracion.genero} • ${configuracion.estiloEscritura} • ${configuracion.tono}`;
    const metadataWidth = doc.getTextWidth(metadata);
    doc.text(metadata, (pageWidth - metadataWidth) / 2, y);

    // Nueva página para sinopsis
    doc.addPage();
    y = margin;

    addText('SINOPSIS', 16, 'bold', 'center');
    y += 10;
    addText(sinopsis, 11, 'normal', 'left');
    y += 15;

    // Separador
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    // Capítulos
    for (const capitulo of capitulos) {
      if (capitulo.estado !== 'completado') continue;

      doc.addPage();
      y = margin;

      // Título del capítulo
      addText(`CAPÍTULO ${capitulo.numero}`, 14, 'bold', 'center');
      y += 3;
      addText(capitulo.titulo, 16, 'bold', 'center');
      y += 15;

      // Contenido del capítulo
      addText(capitulo.contenido, 11, 'normal', 'left');
    }

    // Generar el PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Retornar como respuesta
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    );
  }
}
