'use client';

import { useState } from 'react';
import type { LibroGuardado } from '@/lib/types';
import { ArrowLeft, Download, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  libro: LibroGuardado;
  onVolver: () => void;
  onExportar: (libro: LibroGuardado) => void;
}

export default function DetalleLibro({ libro, onVolver, onExportar }: Props) {
  const [capituloExpandido, setCapituloExpandido] = useState<number | null>(null);

  const toggleCapitulo = (numero: number) => {
    setCapituloExpandido(capituloExpandido === numero ? null : numero);
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

          <button
            type="button"
            onClick={() => onExportar(libro)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
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
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {capitulo.contenido}
                      </p>
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
