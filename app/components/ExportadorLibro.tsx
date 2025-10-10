'use client';

import type { Capitulo, ConfiguracionLibro, FormatoExportacion } from '@/lib/types';
import { exportarLibro, descargarArchivo, exportarEPUB, exportarPDF } from '@/lib/utils';
import { Download, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Props {
  titulo: string;
  sinopsis: string;
  capitulos: Capitulo[];
  configuracion: ConfiguracionLibro;
}

export default function ExportadorLibro({ titulo, sinopsis, capitulos, configuracion }: Props) {
  const [exportando, setExportando] = useState(false);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState<FormatoExportacion>('txt');
  const capitulosCompletados = capitulos.filter((c) => c.estado === 'completado');

  if (capitulosCompletados.length === 0) {
    return null;
  }

  const handleExportar = async () => {
    setExportando(true);

    try {
      if (formatoSeleccionado === 'epub') {
        await exportarEPUB(titulo, sinopsis, capitulosCompletados, configuracion);
      } else if (formatoSeleccionado === 'pdf') {
        await exportarPDF(titulo, sinopsis, capitulosCompletados, configuracion);
      } else {
        // TXT
        const contenido = exportarLibro(titulo, sinopsis, capitulosCompletados, formatoSeleccionado, configuracion);
        const nombreArchivo = `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        descargarArchivo(contenido, nombreArchivo, 'text/plain');
      }
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al exportar. Por favor, inténtalo de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  const palabrasTotales = capitulosCompletados.reduce((total, cap) => total + cap.palabras, 0);

  const formatosDisponibles = [
    { valor: 'txt' as FormatoExportacion, label: 'Texto Plano (.txt)', descripcion: 'Formato simple y universal' },
    { valor: 'epub' as FormatoExportacion, label: 'EPUB (.epub)', descripcion: 'Libro electrónico estándar' },
    { valor: 'pdf' as FormatoExportacion, label: 'PDF (.pdf)', descripcion: 'Documento portable' },
  ];

  const formatoActual = formatosDisponibles.find(f => f.valor === formatoSeleccionado)!;

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg shadow-lg p-6 border-2 border-green-200 dark:border-green-800">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Libro Completado!
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          <strong>{titulo}</strong> - {capitulosCompletados.length} capítulos, {palabrasTotales.toLocaleString()} palabras
        </p>
      </div>

      <div className="space-y-4">
        {/* Dropdown de formatos */}
        <div>
          <label htmlFor="formato-exportacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecciona el formato de exportación:
          </label>
          <div className="relative">
            <select
              id="formato-exportacion"
              value={formatoSeleccionado}
              onChange={(e) => setFormatoSeleccionado(e.target.value as FormatoExportacion)}
              className="w-full appearance-none px-4 py-3 pr-10 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors cursor-pointer"
            >
              {formatosDisponibles.map((formato) => (
                <option key={formato.valor} value={formato.valor}>
                  {formato.label} - {formato.descripcion}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Botón de exportar */}
        <button
          type="button"
          onClick={handleExportar}
          disabled={exportando}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportando ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Exportando {formatoActual.label}...</span>
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              <span>Descargar como {formatoActual.label}</span>
            </>
          )}
        </button>

        {/* Información del formato seleccionado */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Formato seleccionado:</strong> {formatoActual.label}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            {formatoActual.descripcion}
          </p>
        </div>
      </div>
    </div>
  );
}
