'use client';

import type { Capitulo, ConfiguracionLibro, FormatoExportacion } from '@/lib/types';
import { exportarLibro, descargarArchivo, exportarEPUB } from '@/lib/utils';
import { Download, FileText, FileCode, FileJson, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface Props {
  titulo: string;
  sinopsis: string;
  capitulos: Capitulo[];
  configuracion: ConfiguracionLibro;
}

export default function ExportadorLibro({ titulo, sinopsis, capitulos, configuracion }: Props) {
  const [exportandoEPUB, setExportandoEPUB] = useState(false);
  const capitulosCompletados = capitulos.filter((c) => c.estado === 'completado');

  if (capitulosCompletados.length === 0) {
    return null;
  }

  const handleExportar = (formato: FormatoExportacion) => {
    if (formato === 'epub') {
      handleExportarEPUB();
      return;
    }

    const contenido = exportarLibro(titulo, sinopsis, capitulosCompletados, formato, configuracion);

    let nombreArchivo: string;
    let tipoMIME: string;

    switch (formato) {
      case 'txt':
        nombreArchivo = `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        tipoMIME = 'text/plain';
        break;
      case 'md':
        nombreArchivo = `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        tipoMIME = 'text/markdown';
        break;
      case 'json':
        nombreArchivo = `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        tipoMIME = 'application/json';
        break;
      default:
        return;
    }

    descargarArchivo(contenido, nombreArchivo, tipoMIME);
  };

  const handleExportarEPUB = async () => {
    try {
      setExportandoEPUB(true);
      await exportarEPUB(titulo, sinopsis, capitulosCompletados, configuracion);
    } catch (error) {
      console.error('Error exportando EPUB:', error);
      alert('Error al exportar a EPUB. Por favor, inténtalo de nuevo.');
    } finally {
      setExportandoEPUB(false);
    }
  };

  const palabrasTotales = capitulosCompletados.reduce((total, cap) => total + cap.palabras, 0);

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

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Exportar en:
        </p>

        {/* Botón TXT */}
        <button
          type="button"
          onClick={() => handleExportar('txt')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
        >
          <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600" />
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-900 dark:text-white">
              Texto Plano (.txt)
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Formato simple y universal, compatible con cualquier lector
            </div>
          </div>
          <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
        </button>

        {/* Botón Markdown */}
        <button
          type="button"
          onClick={() => handleExportar('md')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
        >
          <FileCode className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-purple-600" />
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-900 dark:text-white">
              Markdown (.md)
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Formato con estructura y metadata, ideal para edición
            </div>
          </div>
          <Download className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
        </button>

        {/* Botón JSON */}
        <button
          type="button"
          onClick={() => handleExportar('json')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
        >
          <FileJson className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-green-600" />
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-900 dark:text-white">
              JSON (.json)
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Datos estructurados con metadata completa para procesamiento
            </div>
          </div>
          <Download className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
        </button>

        {/* Botón EPUB */}
        <button
          type="button"
          onClick={() => handleExportar('epub')}
          disabled={exportandoEPUB}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BookOpen className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-orange-600" />
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-900 dark:text-white">
              EPUB (.epub)
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {exportandoEPUB ? 'Generando libro electrónico...' : 'Formato estándar para e-readers y aplicaciones de lectura'}
            </div>
          </div>
          {exportandoEPUB ? (
            <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
          )}
        </button>
      </div>
    </div>
  );
}
