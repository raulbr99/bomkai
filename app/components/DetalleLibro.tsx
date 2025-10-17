'use client';

import { useState, useRef, useEffect } from 'react';
import type { LibroGuardado, FormatoExportacion } from '@/lib/types';
import { ArrowLeft, Download, BookOpen, ChevronDown, ChevronUp, FileText, File, Sparkles } from 'lucide-react';
import { exportarLibro, descargarArchivo, exportarEPUB, exportarPDF, formatearNombreModelo } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  libro: LibroGuardado;
  onVolver: () => void;
  onExportar: (libro: LibroGuardado) => void;
}

export default function DetalleLibro({ libro, onVolver, onExportar }: Props) {
  const [capituloExpandido, setCapituloExpandido] = useState<number | null>(null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [exportando, setExportando] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleCapitulo = (numero: number) => {
    setCapituloExpandido(capituloExpandido === numero ? null : numero);
  };

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAbierto(false);
      }
    };

    if (dropdownAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownAbierto]);

  const handleExportarFormato = async (formato: FormatoExportacion) => {
    setDropdownAbierto(false);
    setExportando(true);

    try {
      if (formato === 'epub') {
        await exportarEPUB(libro.titulo, libro.sinopsis, libro.capitulos, libro.configuracion);
      } else if (formato === 'pdf') {
        await exportarPDF(libro.titulo, libro.sinopsis, libro.capitulos, libro.configuracion);
      } else {
        // TXT
        const contenido = exportarLibro(
          libro.titulo,
          libro.sinopsis,
          libro.capitulos,
          formato,
          libro.configuracion
        );
        const nombreArchivo = `${libro.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        descargarArchivo(contenido, nombreArchivo, 'text/plain');
      }
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al exportar. Por favor, inténtalo de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <button
          type="button"
          onClick={onVolver}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a la biblioteca
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {libro.titulo}
            </h1>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                {libro.configuracion.genero}
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                {libro.configuracion.estiloEscritura}
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                {libro.configuracion.tono}
              </span>
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                {libro.configuracion.audienciaObjetivo}
              </span>
              {libro.modelo && (
                <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {formatearNombreModelo(libro.modelo)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Capítulos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {libro.capitulos.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Palabras</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {libro.palabrasTotales.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Creado</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Date(libro.fechaCreacion).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Dropdown de exportación */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownAbierto(!dropdownAbierto)}
              disabled={exportando}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Exportar</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${dropdownAbierto ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* Dropdown menu */}
            {dropdownAbierto && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 overflow-hidden">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleExportarFormato('txt')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Texto Plano</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">.txt</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportarFormato('epub')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <BookOpen className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">EPUB</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">.epub</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportarFormato('pdf')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <File className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">PDF</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">.pdf</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sinopsis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Sinopsis
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {libro.sinopsis}
        </p>
      </div>

      {/* Arco Narrativo */}
      {libro.outline.arcoNarrativo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Arco Narrativo
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {libro.outline.arcoNarrativo}
          </p>
        </div>
      )}

      {/* Personajes */}
      {libro.outline.personajes && libro.outline.personajes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Personajes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {libro.outline.personajes.map((personaje, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  {personaje.nombre}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {personaje.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Capítulos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Capítulos ({libro.capitulos.length})
        </h2>

        <div className="space-y-3">
          {libro.capitulos.map((capitulo) => {
            const estaExpandido = capituloExpandido === capitulo.numero;

            return (
              <div
                key={capitulo.numero}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleCapitulo(capitulo.numero)}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Capítulo {capitulo.numero}: {capitulo.titulo}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {capitulo.palabras.toLocaleString()} palabras · ~
                      {Math.ceil(capitulo.palabras / 200)} min lectura
                    </p>
                  </div>
                  {estaExpandido ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {estaExpandido && (
                  <div className="p-6 bg-white dark:bg-gray-800">
                    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-strong:text-gray-900 dark:prose-strong:text-white prose-em:text-gray-800 dark:prose-em:text-gray-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {capitulo.contenido}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
