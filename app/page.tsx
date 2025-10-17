'use client';

import { useReducer, useState } from 'react';
import type { Estado, Accion, ConfiguracionLibro, Capitulo, LibroGuardado, FormatoExportacion } from '@/lib/types';
import { generarResumen, contarPalabras, calcularProgreso, exportarLibro, descargarArchivo, exportarEPUB, exportarPDF } from '@/lib/utils';
import { guardarLibro } from '@/lib/biblioteca';
import FormularioConfiguracion from '@/components/FormularioConfiguracion';
import VisualizadorProgreso from '@/components/VisualizadorProgreso';
import PreviewCapitulos from '@/components/PreviewCapitulos';
import EditorCapitulo from '@/components/EditorCapitulo';
import ExportadorLibro from '@/components/ExportadorLibro';
import BibliotecaLibros from '@/components/BibliotecaLibros';
import DetalleLibro from '@/components/DetalleLibro';
import { BookOpen, RefreshCw, Library, Save } from 'lucide-react';

// Estado inicial
const estadoInicial: Estado = {
  etapa: 'configuracion',
  configuracion: null,
  outline: null,
  capitulos: [],
  capituloActual: 0,
  progreso: 0,
  error: null,
  generando: false,
};

// Reducer para manejar el estado
function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.tipo) {
    case 'INICIAR_OUTLINE':
      return {
        ...estado,
        etapa: 'generando-outline',
        configuracion: accion.configuracion,
        generando: true,
        error: null,
      };
    case 'OUTLINE_COMPLETADO':
      return {
        ...estado,
        etapa: 'generando-capitulos',
        outline: accion.outline,
        capitulos: accion.outline.capitulos.map((capInfo) => ({
          numero: capInfo.numero,
          titulo: capInfo.titulo,
          contenido: '',
          palabras: 0,
          resumen: '',
          estado: 'pendiente',
        })),
        capituloActual: 1,
      };
    case 'INICIAR_CAPITULO':
      return {
        ...estado,
        capituloActual: accion.numero,
        capitulos: estado.capitulos.map((cap) =>
          cap.numero === accion.numero ? { ...cap, estado: 'generando' as const } : cap
        ),
      };
    case 'ACTUALIZAR_CONTENIDO_CAPITULO':
      return {
        ...estado,
        capitulos: estado.capitulos.map((cap) =>
          cap.numero === accion.numero
            ? { ...cap, contenido: accion.contenido, palabras: contarPalabras(accion.contenido) }
            : cap
        ),
      };
    case 'ACTUALIZAR_PROGRESO':
      return {
        ...estado,
        progreso: accion.progreso,
      };
    case 'CAPITULO_COMPLETADO':
      const capitulosActualizados = estado.capitulos.map((cap) =>
        cap.numero === accion.numero
          ? {
              ...cap,
              contenido: accion.contenido,
              palabras: contarPalabras(accion.contenido),
              resumen: accion.resumen,
              estado: 'completado' as const,
            }
          : cap
      );
      const todosCompletos = capitulosActualizados.every((cap) => cap.estado === 'completado');
      return {
        ...estado,
        capitulos: capitulosActualizados,
        etapa: todosCompletos ? 'completado' : estado.etapa,
        generando: !todosCompletos,
        progreso: calcularProgreso(
          capitulosActualizados.filter((c) => c.estado === 'completado').length,
          capitulosActualizados.length
        ),
      };
    case 'EDITAR_CAPITULO':
      return {
        ...estado,
        capitulos: estado.capitulos.map((cap) =>
          cap.numero === accion.numero
            ? { ...cap, contenido: accion.contenido, palabras: contarPalabras(accion.contenido) }
            : cap
        ),
      };
    case 'REGENERAR_CAPITULO':
      return {
        ...estado,
        capitulos: estado.capitulos.map((cap) =>
          cap.numero === accion.numero
            ? { ...cap, estado: 'generando' as const, contenido: '' }
            : cap
        ),
        generando: true,
      };
    case 'ERROR':
      return {
        ...estado,
        error: accion.error,
        generando: false,
      };
    case 'REINICIAR':
      return estadoInicial;
    default:
      return estado;
  }
}

export default function Home() {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);

  // Iniciar generación del libro
  const handleIniciarGeneracion = async (configuracion: ConfiguracionLibro) => {
    dispatch({ tipo: 'INICIAR_OUTLINE', configuracion });

    try {
      // Generar outline
      const responseOutline = await fetch('/api/generar-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configuracion),
      });

      const dataOutline = await responseOutline.json();

      if (!dataOutline.exito) {
        throw new Error(dataOutline.error || 'Error generando outline');
      }

      dispatch({ tipo: 'OUTLINE_COMPLETADO', outline: dataOutline.outline });

      // Generar capítulos secuencialmente
      const resumenesAnteriores: string[] = [];

      for (let i = 1; i <= configuracion.numeroCapitulos; i++) {
        dispatch({ tipo: 'INICIAR_CAPITULO', numero: i });

        const responseCapitulo = await fetch('/api/generar-capitulo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numeroCapitulo: i,
            outline: dataOutline.outline,
            configuracion,
            resumenesAnteriores,
          }),
        });

        const reader = responseCapitulo.body?.getReader();
        const decoder = new TextDecoder();
        let contenidoCompleto = '';
        let buffer = ''; // Buffer para acumular datos incompletos

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decodificar el chunk y agregarlo al buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Dividir por líneas completas (terminadas en \n\n)
            const lines = buffer.split('\n\n');

            // El último elemento puede estar incompleto, lo guardamos para el siguiente chunk
            buffer = lines.pop() || '';

            // Procesar cada línea completa
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6).trim();
                  if (!jsonStr) continue; // Ignorar líneas vacías

                  const data = JSON.parse(jsonStr);

                  if (data.tipo === 'chunk') {
                    contenidoCompleto += data.contenido;
                    dispatch({
                      tipo: 'ACTUALIZAR_CONTENIDO_CAPITULO',
                      numero: i,
                      contenido: contenidoCompleto,
                    });
                  } else if (data.tipo === 'completo') {
                    const resumen = generarResumen(data.contenido);
                    resumenesAnteriores.push(resumen);
                    dispatch({
                      tipo: 'CAPITULO_COMPLETADO',
                      numero: i,
                      contenido: data.contenido,
                      resumen,
                    });
                  } else if (data.tipo === 'error') {
                    throw new Error(data.contenido);
                  }
                } catch (parseError) {
                  console.error('Error parseando JSON del stream:', {
                    error: parseError instanceof Error ? parseError.message : 'Error desconocido',
                    line: line.slice(0, 100), // Solo primeros 100 caracteres para debug
                  });
                  // No lanzamos el error para que el streaming continúe
                }
              }
            }
          }

          // Procesar cualquier dato restante en el buffer
          if (buffer.trim()) {
            const line = buffer.trim();
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (jsonStr) {
                  const data = JSON.parse(jsonStr);
                  if (data.tipo === 'completo') {
                    const resumen = generarResumen(data.contenido);
                    resumenesAnteriores.push(resumen);
                    dispatch({
                      tipo: 'CAPITULO_COMPLETADO',
                      numero: i,
                      contenido: data.contenido,
                      resumen,
                    });
                  }
                }
              } catch (parseError) {
                console.error('Error parseando buffer final:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      dispatch({
        tipo: 'ERROR',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  // Editar capítulo
  const handleEditarCapitulo = (numero: number, contenido: string) => {
    dispatch({ tipo: 'EDITAR_CAPITULO', numero, contenido });
  };

  // Regenerar capítulo
  const handleRegenerarCapitulo = async (numero: number) => {
    if (!estado.configuracion || !estado.outline) {
      console.error('No hay configuración u outline disponible');
      return;
    }

    // Confirmar con el usuario
    if (!window.confirm(`¿Estás seguro de que quieres regenerar el Capítulo ${numero}? El contenido actual se perderá.`)) {
      return;
    }

    try {
      dispatch({ tipo: 'REGENERAR_CAPITULO', numero });

      // Obtener resúmenes de capítulos anteriores ya completados
      const resumenesAnteriores = estado.capitulos
        .filter((cap) => cap.numero < numero && cap.estado === 'completado')
        .map((cap) => cap.resumen);

      const responseCapitulo = await fetch('/api/generar-capitulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroCapitulo: numero,
          outline: estado.outline,
          configuracion: estado.configuracion,
          resumenesAnteriores,
        }),
      });

      const reader = responseCapitulo.body?.getReader();
      const decoder = new TextDecoder();
      let contenidoCompleto = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;

                const data = JSON.parse(jsonStr);

                if (data.tipo === 'chunk') {
                  contenidoCompleto += data.contenido;
                  dispatch({
                    tipo: 'ACTUALIZAR_CONTENIDO_CAPITULO',
                    numero,
                    contenido: contenidoCompleto,
                  });
                } else if (data.tipo === 'completo') {
                  const resumen = generarResumen(data.contenido);
                  dispatch({
                    tipo: 'CAPITULO_COMPLETADO',
                    numero,
                    contenido: data.contenido,
                    resumen,
                  });
                } else if (data.tipo === 'error') {
                  throw new Error(data.contenido);
                }
              } catch (parseError) {
                console.error('Error parseando JSON del stream:', parseError);
              }
            }
          }
        }

        // Procesar buffer final
        if (buffer.trim()) {
          const line = buffer.trim();
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                if (data.tipo === 'completo') {
                  const resumen = generarResumen(data.contenido);
                  dispatch({
                    tipo: 'CAPITULO_COMPLETADO',
                    numero,
                    contenido: data.contenido,
                    resumen,
                  });
                }
              }
            } catch (parseError) {
              console.error('Error parseando buffer final:', parseError);
            }
          }
        }
      }
    } catch (error) {
      dispatch({
        tipo: 'ERROR',
        error: error instanceof Error ? error.message : 'Error regenerando capítulo',
      });
    }
  };

  // Mejorar capítulo con IA
  const handleMejorarCapitulo = async (
    numero: number,
    contenido: string,
    instrucciones: string
  ) => {
    try {
      const response = await fetch('/api/revisar-capitulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenidoCapitulo: contenido,
          instruccionesRevision: instrucciones,
        }),
      });

      const data = await response.json();

      if (!data.exito) {
        throw new Error(data.error || 'Error mejorando capítulo');
      }

      dispatch({ tipo: 'EDITAR_CAPITULO', numero, contenido: data.contenido });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const [capituloEditando, setCapituloEditando] = useState<Capitulo | null>(null);
  const [vistaActual, setVistaActual] = useState<'generador' | 'biblioteca' | 'detalle'>('generador');
  const [libroViendoDetalle, setLibroViendoDetalle] = useState<LibroGuardado | null>(null);

  // Guardar libro en biblioteca
  const handleGuardarEnBiblioteca = async () => {
    if (!estado.outline || !estado.configuracion) return;

    try {
      const libro = await guardarLibro(
        estado.outline.titulo,
        estado.outline.sinopsis,
        estado.configuracion,
        estado.outline,
        estado.capitulos
      );

      if (libro) {
        alert('¡Libro guardado en la biblioteca!');
      } else {
        alert('Error guardando el libro. Verifica la conexión a la base de datos.');
      }
    } catch (error) {
      alert('Error al guardar el libro');
      console.error(error);
    }
  };

  // Ver detalle de libro desde biblioteca
  const handleVerLibro = (libro: LibroGuardado) => {
    setLibroViendoDetalle(libro);
    setVistaActual('detalle');
  };

  // Exportar libro desde biblioteca (se maneja en el componente DetalleLibro ahora)
  const handleExportarLibroDesdeBiblioteca = (libro: LibroGuardado) => {
    // Esta función ya no se usa porque el export ahora se hace en DetalleLibro con dropdown
    // Pero la mantenemos por compatibilidad
    handleVerLibro(libro);
  };

  return (
    <div className="min-h-screen py-4 md:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header con navegación */}
        <header className="mb-6 md:mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <BookOpen className="w-8 md:w-12 h-8 md:h-12 text-blue-600 flex-shrink-0" />
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                  Bomkai
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 mt-1">
                  Crea libros completos con IA
                </p>
              </div>
            </div>

            {/* Navegación */}
            <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setVistaActual('generador');
                  // Si hay un libro completado, reiniciar el estado
                  if (estado.etapa === 'completado') {
                    dispatch({ tipo: 'REINICIAR' });
                  }
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
                  vistaActual === 'generador'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <BookOpen className="w-4 md:w-5 h-4 md:h-5" />
                <span className="hidden sm:inline">Generar</span>
              </button>
              <button
                type="button"
                onClick={() => setVistaActual('biblioteca')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
                  vistaActual === 'biblioteca'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Library className="w-4 md:w-5 h-4 md:h-5" />
                <span className="hidden sm:inline">Biblioteca</span>
              </button>
            </div>
          </div>
        </header>

        {/* Vista de Biblioteca */}
        {vistaActual === 'biblioteca' && (
          <BibliotecaLibros
            onVerLibro={handleVerLibro}
            onExportarLibro={handleExportarLibroDesdeBiblioteca}
          />
        )}

        {/* Vista de Detalle de Libro */}
        {vistaActual === 'detalle' && libroViendoDetalle && (
          <DetalleLibro
            libro={libroViendoDetalle}
            onVolver={() => setVistaActual('biblioteca')}
            onExportar={handleExportarLibroDesdeBiblioteca}
          />
        )}

        {/* Vista de Generador */}
        {vistaActual === 'generador' && (
          <>

        {/* Error */}
        {estado.error && (
          <div className="max-w-3xl mx-auto mb-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{estado.error}</p>
          </div>
        )}

        {/* Formulario de Configuración */}
        {estado.etapa === 'configuracion' && (
          <FormularioConfiguracion
            onSubmit={handleIniciarGeneracion}
            generando={estado.generando}
          />
        )}

        {/* Progreso de Generación */}
        {(estado.etapa === 'generando-outline' || estado.etapa === 'generando-capitulos') && (
          <VisualizadorProgreso
            outline={estado.outline}
            capitulos={estado.capitulos}
            capituloActual={estado.capituloActual}
            progreso={estado.progreso}
            generandoOutline={estado.etapa === 'generando-outline'}
          />
        )}

        {/* Preview de Capítulos */}
        {(estado.etapa === 'generando-capitulos' || estado.etapa === 'completado') && (
          <div className="mt-8">
            <PreviewCapitulos
              capitulos={estado.capitulos}
              configuracion={estado.configuracion || undefined}
              onEditar={(numero) => {
                const capitulo = estado.capitulos.find((c) => c.numero === numero);
                if (capitulo) setCapituloEditando(capitulo);
              }}
              onRegenerar={handleRegenerarCapitulo}
            />
          </div>
        )}

        {/* Exportador */}
        {estado.etapa === 'completado' && estado.outline && estado.configuracion && (
          <div className="mt-8">
            <ExportadorLibro
              titulo={estado.outline.titulo}
              sinopsis={estado.outline.sinopsis}
              capitulos={estado.capitulos}
              configuracion={estado.configuracion}
            />
          </div>
        )}

        {/* Botones de acción para libro completado */}
        {estado.etapa === 'completado' && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={handleGuardarEnBiblioteca}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <Save className="w-5 h-5" />
              Guardar en Biblioteca
            </button>
            <button
              type="button"
              onClick={() => dispatch({ tipo: 'REINICIAR' })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Generar Nuevo Libro
            </button>
          </div>
        )}

        {/* Editor Modal */}
        <EditorCapitulo
          capitulo={capituloEditando}
          onCerrar={() => setCapituloEditando(null)}
          onGuardar={handleEditarCapitulo}
          onMejorar={handleMejorarCapitulo}
        />
          </>
        )}
      </div>
    </div>
  );
}
