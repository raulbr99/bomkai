'use client';

import { useState } from 'react';
import type {
  ConfiguracionLibro,
  Genero,
  EstiloEscritura,
  Tono,
  AudienciaObjetivo,
} from '@/lib/types';
import { validarConfiguracion } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

interface Props {
  onSubmit: (configuracion: ConfiguracionLibro) => void;
  generando: boolean;
}

export default function FormularioConfiguracion({ onSubmit, generando }: Props) {
  const [tema, setTema] = useState('');
  const [genero, setGenero] = useState<Genero>('Ficción');
  const [numeroCapitulos, setNumeroCapitulos] = useState(5);
  const [estiloEscritura, setEstiloEscritura] = useState<EstiloEscritura>('Descriptivo');
  const [tono, setTono] = useState<Tono>('Casual');
  const [audienciaObjetivo, setAudienciaObjetivo] = useState<AudienciaObjetivo>('Adultos');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const configuracion: ConfiguracionLibro = {
      tema,
      genero,
      numeroCapitulos,
      estiloEscritura,
      tono,
      audienciaObjetivo,
    };

    const validacion = validarConfiguracion(configuracion);
    if (!validacion.valido) {
      setError(validacion.error || 'Error de validación');
      return;
    }

    onSubmit(configuracion);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <BookOpen className="w-6 md:w-8 h-6 md:h-8 text-blue-600 flex-shrink-0" />
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Configuración del Libro
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Tema */}
          <div>
            <label htmlFor="tema" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción o Historia *
            </label>
            <textarea
              id="tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              placeholder="Describe tu historia en detalle: personajes, trama, ambientación, conflicto principal, etc. Cuanto más detallado, mejor será el resultado.&#10;&#10;Ejemplo: 'Una joven hechicera llamada Elena descubre que es la última heredera de un antiguo linaje mágico. Debe recuperar cinco artefactos perdidos mientras es perseguida por una orden oscura que busca eliminar toda la magia del mundo. Su viaje la llevará desde las montañas nevadas del norte hasta los desiertos del sur, donde descubrirá secretos sobre su familia y su verdadero destino.'"
              required
              disabled={generando}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 Tip: Incluye personajes, conflicto, ambientación y cualquier detalle específico que quieras en tu libro
            </p>
          </div>

          {/* Género */}
          <div>
            <label htmlFor="genero" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Género
            </label>
            <select
              id="genero"
              value={genero}
              onChange={(e) => setGenero(e.target.value as Genero)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={generando}
            >
              <option value="Ficción">Ficción</option>
              <option value="No Ficción">No Ficción</option>
              <option value="Fantasía">Fantasía</option>
              <option value="Ciencia Ficción">Ciencia Ficción</option>
              <option value="Misterio">Misterio</option>
              <option value="Romance">Romance</option>
              <option value="Autoayuda">Autoayuda</option>
              <option value="Biografía">Biografía</option>
            </select>
          </div>

          {/* Número de Capítulos */}
          <div>
            <label htmlFor="capitulos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de Capítulos: {numeroCapitulos}
            </label>
            <input
              type="range"
              id="capitulos"
              min="1"
              max="50"
              value={numeroCapitulos}
              onChange={(e) => setNumeroCapitulos(Number(e.target.value))}
              className="w-full"
              disabled={generando}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* Estilo de Escritura */}
          <div>
            <label htmlFor="estilo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estilo de Escritura
            </label>
            <select
              id="estilo"
              value={estiloEscritura}
              onChange={(e) => setEstiloEscritura(e.target.value as EstiloEscritura)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={generando}
            >
              <option value="Descriptivo">Descriptivo</option>
              <option value="Conciso">Conciso</option>
              <option value="Poético">Poético</option>
              <option value="Periodístico">Periodístico</option>
              <option value="Académico">Académico</option>
              <option value="Conversacional">Conversacional</option>
            </select>
          </div>

          {/* Tono */}
          <div>
            <label htmlFor="tono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tono
            </label>
            <select
              id="tono"
              value={tono}
              onChange={(e) => setTono(e.target.value as Tono)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={generando}
            >
              <option value="Formal">Formal</option>
              <option value="Casual">Casual</option>
              <option value="Humorístico">Humorístico</option>
              <option value="Serio">Serio</option>
              <option value="Inspiracional">Inspiracional</option>
              <option value="Oscuro">Oscuro</option>
            </select>
          </div>

          {/* Audiencia Objetivo */}
          <div>
            <label htmlFor="audiencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audiencia Objetivo
            </label>
            <select
              id="audiencia"
              value={audienciaObjetivo}
              onChange={(e) => setAudienciaObjetivo(e.target.value as AudienciaObjetivo)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={generando}
            >
              <option value="Niños">Niños</option>
              <option value="Jóvenes Adultos">Jóvenes Adultos</option>
              <option value="Adultos">Adultos</option>
              <option value="Académico">Académico</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={generando}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 md:py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base md:text-lg shadow-lg hover:shadow-xl"
          >
            {generando ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                <span>Generar Libro</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
