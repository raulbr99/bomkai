'use client';

import { useState, useEffect } from 'react';
import type { Capitulo } from '@/lib/types';
import { X, Save, Sparkles, Loader2 } from 'lucide-react';
import { contarPalabras } from '@/lib/utils';

interface Props {
  capitulo: Capitulo | null;
  onCerrar: () => void;
  onGuardar: (numero: number, contenido: string) => void;
  onMejorar: (numero: number, contenido: string, instrucciones: string) => void;
}

export default function EditorCapitulo({ capitulo, onCerrar, onGuardar, onMejorar }: Props) {
  const [contenido, setContenido] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [mejorando, setMejorando] = useState(false);

  useEffect(() => {
    if (capitulo) {
      setContenido(capitulo.contenido);
    }
  }, [capitulo]);

  if (!capitulo) return null;

  const palabras = contarPalabras(contenido);
  const caracteres = contenido.length;

  const handleGuardar = () => {
    onGuardar(capitulo.numero, contenido);
    onCerrar();
  };

  const handleMejorar = async () => {
    if (!instrucciones.trim()) {
      alert('Por favor, proporciona instrucciones para mejorar el capítulo');
      return;
    }

    setMejorando(true);
    try {
      await onMejorar(capitulo.numero, contenido, instrucciones);
      setInstrucciones('');
    } finally {
      setMejorando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar Capítulo {capitulo.numero}: {capitulo.titulo}
          </h3>
          <button
            type="button"
            onClick={onCerrar}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Área de texto principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenido del Capítulo
            </label>
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
              placeholder="Escribe o edita el contenido del capítulo aquí..."
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span>{palabras.toLocaleString()} palabras</span>
              <span>{caracteres.toLocaleString()} caracteres</span>
            </div>
          </div>

          {/* Sección de mejora con IA */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Mejorar con IA
              </h4>
            </div>
            <textarea
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              className="w-full h-24 px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              placeholder="Ej: Hazlo más descriptivo, añade más diálogo, mejora el ritmo narrativo..."
              disabled={mejorando}
            />
            <button
              type="button"
              onClick={handleMejorar}
              disabled={mejorando || !instrucciones.trim()}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {mejorando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mejorando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Mejorar con IA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
