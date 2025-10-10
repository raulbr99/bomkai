'use client';

import type { Capitulo, Outline } from '@/lib/types';
import { CheckCircle2, Circle, Loader2, BookOpen, Sparkles } from 'lucide-react';

interface Props {
  outline: Outline | null;
  capitulos: Capitulo[];
  capituloActual: number;
  progreso: number;
  generandoOutline?: boolean;
}

export default function VisualizadorProgreso({ outline, capitulos, capituloActual, progreso, generandoOutline = false }: Props) {
  // Mostrar animación de carga mientras se genera el outline
  if (generandoOutline) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-12 mb-6 md:mb-8">
        <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6">
          {/* Icono animado */}
          <div className="relative">
            <BookOpen className="w-16 md:w-20 h-16 md:h-20 text-purple-600 dark:text-purple-400 animate-pulse" />
            <Sparkles className="w-6 md:w-8 h-6 md:h-8 text-yellow-500 absolute -top-2 -right-2 animate-spin" />
          </div>

          {/* Texto de carga */}
          <div className="text-center space-y-2">
            <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white px-4">
              Generando el outline de tu libro...
            </h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 px-4">
              Creando la estructura narrativa y planificando los capítulos
            </p>
          </div>

          {/* Barra de carga indeterminada */}
          <div className="w-full max-w-md">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-full animate-[loading_2s_ease-in-out_infinite] bg-[length:200%_100%]" />
            </div>
          </div>

          {/* Pasos del proceso */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8 w-full px-4">
            <div className="flex items-center gap-3 p-3 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Loader2 className="w-4 md:w-5 h-4 md:h-5 text-purple-600 dark:text-purple-400 animate-spin flex-shrink-0" />
              <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300">Analizando tema</span>
            </div>
            <div className="flex items-center gap-3 p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Loader2 className="w-4 md:w-5 h-4 md:h-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
              <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300">Creando personajes</span>
            </div>
            <div className="flex items-center gap-3 p-3 md:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Loader2 className="w-4 md:w-5 h-4 md:h-5 text-indigo-600 dark:text-indigo-400 animate-spin flex-shrink-0" />
              <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300">Estructurando arco</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!outline) return null;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 mb-6 md:mb-8">
      <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Generando: <span className="block sm:inline mt-1 sm:mt-0">{outline.titulo}</span>
      </h3>

      {/* Barra de progreso general */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso General
          </span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {progreso}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Capítulo {capituloActual} de {outline.capitulos.length}
        </p>
      </div>

      {/* Lista de capítulos */}
      <div className="space-y-3">
        {outline.capitulos.map((capInfo) => {
          const capitulo = capitulos.find((c) => c.numero === capInfo.numero);
          const estado = capitulo?.estado || 'pendiente';

          return (
            <div
              key={capInfo.numero}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                estado === 'completado'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : estado === 'generando'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 animate-pulse-slow'
                    : estado === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600'
              }`}
            >
              {/* Ícono de estado */}
              <div className="flex-shrink-0 mt-1">
                {estado === 'completado' && (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                )}
                {estado === 'generando' && (
                  <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                )}
                {estado === 'error' && (
                  <Circle className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
                {estado === 'pendiente' && (
                  <Circle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                )}
              </div>

              {/* Información del capítulo */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Capítulo {capInfo.numero}: {capInfo.titulo}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {capInfo.descripcion}
                </p>
                {capitulo && capitulo.palabras > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {capitulo.palabras.toLocaleString()} palabras
                  </p>
                )}
              </div>

              {/* Badge de estado */}
              <div className="flex-shrink-0">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    estado === 'completado'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : estado === 'generando'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : estado === 'error'
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {estado === 'completado' && 'Completado'}
                  {estado === 'generando' && 'Generando...'}
                  {estado === 'error' && 'Error'}
                  {estado === 'pendiente' && 'Pendiente'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
