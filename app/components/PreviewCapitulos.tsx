'use client';

import { useState } from 'react';
import type { Capitulo } from '@/lib/types';
import { ChevronDown, ChevronUp, Edit, RotateCw } from 'lucide-react';

interface Props {
  capitulos: Capitulo[];
  onEditar: (numero: number) => void;
  onRegenerar: (numero: number) => void;
}

export default function PreviewCapitulos({ capitulos, onEditar, onRegenerar }: Props) {
  const [expandido, setExpandido] = useState<number | null>(null);

  const toggleExpansion = (numero: number) => {
    setExpandido(expandido === numero ? null : numero);
  };

  const capitulosCompletados = capitulos.filter((c) => c.estado === 'completado');

  if (capitulosCompletados.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Capítulos Generados ({capitulosCompletados.length})
      </h3>

      <div className="space-y-4">
        {capitulosCompletados.map((capitulo) => {
          const estaExpandido = expandido === capitulo.numero;
          const preview = capitulo.contenido.slice(0, 300);

          return (
            <div
              key={capitulo.numero}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {/* Header del capítulo */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleExpansion(capitulo.numero)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Capítulo {capitulo.numero}: {capitulo.titulo}
                    </h4>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{capitulo.palabras.toLocaleString()} palabras</span>
                      <span>•</span>
                      <span>~{Math.ceil(capitulo.palabras / 200)} min de lectura</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {estaExpandido ? (
                      <ChevronUp className="w-6 h-6" />
                    ) : (
                      <ChevronDown className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>

              {/* Preview o contenido completo */}
              <div className="px-6 pb-4">
                {estaExpandido ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {capitulo.contenido}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                    {preview}...
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => onEditar(capitulo.numero)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onRegenerar(capitulo.numero)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <RotateCw className="w-4 h-4" />
                  Regenerar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
