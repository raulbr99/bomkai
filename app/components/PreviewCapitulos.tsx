'use client';

import { useState } from 'react';
import type { Capitulo, ConfiguracionLibro } from '@/lib/types';
import { X, Edit, RotateCw, BookOpen, Clock, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatearNombreModelo } from '@/lib/utils';

interface Props {
  capitulos: Capitulo[];
  configuracion?: ConfiguracionLibro;
  onEditar: (numero: number) => void;
  onRegenerar: (numero: number) => void;
}

export default function PreviewCapitulos({ capitulos, configuracion, onEditar, onRegenerar }: Props) {
  const [capituloSeleccionado, setCapituloSeleccionado] = useState<number | null>(null);

  const capitulosCompletados = capitulos.filter((c) => c.estado === 'completado');

  if (capitulosCompletados.length === 0) {
    return null;
  }

  const capitulo = capitulosCompletados.find((c) => c.numero === capituloSeleccionado);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Capítulos Generados ({capitulosCompletados.length})
        </h3>
        {configuracion?.modelo && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">{formatearNombreModelo(configuracion.modelo)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna izquierda: Lista de capítulos */}
        <div className="lg:col-span-4 space-y-3">
          {capitulosCompletados.map((cap) => {
            const seleccionado = capituloSeleccionado === cap.numero;

            return (
              <button
                key={cap.numero}
                type="button"
                onClick={() => setCapituloSeleccionado(cap.numero)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  seleccionado
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-md'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      seleccionado
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {cap.numero}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-semibold mb-1 line-clamp-2 ${
                        seleccionado
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {cap.titulo}
                    </h4>
                    <div
                      className={`text-xs flex items-center gap-2 ${
                        seleccionado
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span>{cap.palabras.toLocaleString()} palabras</span>
                      <span>•</span>
                      <span>{Math.ceil(cap.palabras / 200)} min</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Columna derecha: Contenido del capítulo seleccionado */}
        <div className="lg:col-span-8">
          {capituloSeleccionado && capitulo ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header del capítulo */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Capítulo {capitulo.numero}</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-3">{capitulo.titulo}</h2>
                    <div className="flex items-center gap-4 text-sm text-blue-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.ceil(capitulo.palabras / 200)} min de lectura
                      </span>
                      <span>•</span>
                      <span>{capitulo.palabras.toLocaleString()} palabras</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCapituloSeleccionado(null)}
                    className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Acciones */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onEditar(capitulo.numero)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onRegenerar(capitulo.numero)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <RotateCw className="w-4 h-4" />
                    Regenerar
                  </button>
                </div>
              </div>

              {/* Contenido del capítulo */}
              <div className="p-6 max-h-[600px] overflow-y-auto">
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-justify prose-strong:text-gray-900 dark:prose-strong:text-white prose-em:text-gray-800 dark:prose-em:text-gray-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {capitulo.contenido}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Selecciona un capítulo
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Haz clic en un capítulo de la lista para ver su contenido completo
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
