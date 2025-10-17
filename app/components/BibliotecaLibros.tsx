'use client';

import { useState, useEffect } from 'react';
import type { LibroGuardado } from '@/lib/types';
import { obtenerLibros, eliminarLibro, ordenarLibros, buscarLibros, obtenerEstadisticas } from '@/lib/biblioteca';
import { BookOpen, Trash2, Eye, Download, Search, SortAsc, BarChart3, Loader2, Sparkles } from 'lucide-react';
import { formatearNombreModelo } from '@/lib/utils';

interface Props {
  onVerLibro: (libro: LibroGuardado) => void;
  onExportarLibro: (libro: LibroGuardado) => void;
}

interface Estadisticas {
  totalLibros: number;
  totalPalabras: number;
  totalCapitulos: number;
  promedioCapitulosPorLibro?: number;
  promedioPalabrasPorLibro?: number;
  generoMasComun: string;
}

export default function BibliotecaLibros({ onVerLibro, onExportarLibro }: Props) {
  const [libros, setLibros] = useState<LibroGuardado[]>([]);
  const [librosFiltrados, setLibrosFiltrados] = useState<LibroGuardado[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState<'fecha' | 'titulo' | 'palabras'>('fecha');
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalLibros: 0,
    totalPalabras: 0,
    totalCapitulos: 0,
    generoMasComun: 'N/A',
  });

  useEffect(() => {
    cargarLibros();
    cargarEstadisticas();
  }, []);

  useEffect(() => {
    if (busqueda.trim()) {
      const resultados = buscarLibros(libros, busqueda);
      setLibrosFiltrados(ordenarLibros(resultados, ordenamiento));
    } else {
      setLibrosFiltrados(ordenarLibros(libros, ordenamiento));
    }
  }, [busqueda, libros, ordenamiento]);

  const cargarLibros = async () => {
    setCargando(true);
    const librosGuardados = await obtenerLibros();
    setLibros(librosGuardados);
    setLibrosFiltrados(ordenarLibros(librosGuardados, ordenamiento));
    setCargando(false);
  };

  const cargarEstadisticas = async () => {
    const stats = await obtenerEstadisticas();
    setEstadisticas(stats);
  };

  const handleEliminar = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este libro?')) {
      const exito = await eliminarLibro(id);
      if (exito) {
        await cargarLibros();
        await cargarEstadisticas();
      } else {
        alert('Error eliminando el libro. Intenta de nuevo.');
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header con estadísticas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Biblioteca
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            {mostrarEstadisticas ? 'Ocultar' : 'Ver'} Estadísticas
          </button>
        </div>

        {/* Estadísticas */}
        {mostrarEstadisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {estadisticas.totalLibros}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Libros</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {estadisticas.totalPalabras.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Palabras</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {estadisticas.totalCapitulos}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Capítulos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {estadisticas.generoMasComun}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Género Favorito</p>
            </div>
          </div>
        )}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, sinopsis o género..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-2">
            <SortAsc className="w-5 h-5 text-gray-400" />
            <select
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value as typeof ordenamiento)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="fecha">Más reciente</option>
              <option value="titulo">Título A-Z</option>
              <option value="palabras">Más palabras</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de libros */}
      {cargando ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <Loader2 className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Cargando biblioteca...
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Obteniendo tus libros de la base de datos
          </p>
        </div>
      ) : librosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {busqueda ? 'No se encontraron libros' : 'Tu biblioteca está vacía'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {busqueda
              ? 'Intenta con otra búsqueda'
              : 'Genera tu primer libro para comenzar tu biblioteca'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {librosFiltrados.map((libro) => (
            <div
              key={libro.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Portada (color por género) */}
              <div className={`h-32 bg-gradient-to-br ${getGradienteGenero(libro.configuracion.genero)} p-4 flex items-end`}>
                <h3 className="text-white font-bold text-lg line-clamp-2">
                  {libro.titulo}
                </h3>
              </div>

              {/* Información */}
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {libro.configuracion.genero}
                  </span>
                  <span>{libro.capitulos.length} cap.</span>
                  <span>•</span>
                  <span>{(libro.palabrasTotales / 1000).toFixed(1)}k palabras</span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {libro.sinopsis}
                </p>

                {libro.modelo && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{formatearNombreModelo(libro.modelo)}</span>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  Creado: {new Date(libro.fechaCreacion).toLocaleDateString('es-ES')}
                </p>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onVerLibro(libro)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    type="button"
                    onClick={() => onExportarLibro(libro)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(libro.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getGradienteGenero(genero: string): string {
  const gradientes: Record<string, string> = {
    'Ficción': 'from-blue-500 to-blue-700',
    'No Ficción': 'from-gray-500 to-gray-700',
    'Fantasía': 'from-purple-500 to-pink-600',
    'Ciencia Ficción': 'from-cyan-500 to-blue-600',
    'Misterio': 'from-gray-700 to-gray-900',
    'Romance': 'from-pink-500 to-red-500',
    'Autoayuda': 'from-green-500 to-teal-600',
    'Biografía': 'from-amber-500 to-orange-600',
  };

  return gradientes[genero] || 'from-gray-500 to-gray-700';
}
