import React, { useState, useEffect, useCallback } from 'react'; // Importa useCallback
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Calendar, ArrowRightLeft } from 'lucide-react';
import RegistrarMovimientoModal from './RegistrarMovimientoModal';
import { API_URL } from '../../config';

// --- Interfaces ---
interface ActivoSimple {
  id_objeto: number;
  nombre: string;
  num_inventario: string | null;
  marca: string | null;
  modelo: string | null;
  estado: string;
}

// 1. *** CORRECCIÓN CRÍTICA ***
// El backend (Prisma) devuelve la relación como 'movimientos', no 'movimientos_asignaciones'
interface Asignacion {
  id_asignacion: number;
  fecha_asignacion: string;
  estado: 'Activa' | 'Finalizada';
  activo: ActivoSimple;
  movimientos: {
    ubicacion: {
      nombre_area: string;
      edificio: string | null; 
      piso: string | null;
    }
  }[];
  ubicacionActual?: string; 
}
// --- FIN CORRECCIÓN ---

function MyAssetsPage() {
  const [asignacionesActivas, setAsignacionesActivas] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null);

  // --- 2. CORRECCIÓN LÓGICA (useCallback) ---
  // Definimos la función de carga con useCallback para estabilizarla
  const fetchMyAssets = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) { 
      logout(); 
      return; 
    }

    try {
      const response = await fetch(`${API_URL}/api/me/asignaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al obtener tus activos.');

      const data: Asignacion[] = await response.json();
      const activas = data.filter((a) => a.estado === 'Activa');
      setAsignacionesActivas(activas);
      setError(null); // Limpia errores previos si fue exitoso
    } catch (err: any) {
      console.error("Error fetching 'my assets':", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]); // Dependencias de la función

  // useEffect ahora solo llama a la función estabilizada
  useEffect(() => {
    if (user) {
      fetchMyAssets();
    }
  }, [user, fetchMyAssets]); // fetchMyAssets está ahora en las dependencias
  // --- FIN CORRECCIÓN ---

  // --- 4. Funciones para controlar el Modal (sin cambios) ---
  const openMovimientoModal = (asignacion: Asignacion) => {
    setSelectedAsignacion(asignacion); 
    setIsModalOpen(true);
  };

  const closeMovimientoModal = () => {
    setIsModalOpen(false);
    setSelectedAsignacion(null);
  };

  const handleMovimientoSuccess = () => {
    // Cuando el modal termina, recargamos los datos para ver la nueva ubicación
    fetchMyAssets();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando tus activos...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Activos Asignados</h1>
        <p className="text-gray-500 mt-1">Estos son los equipos que están bajo tu resguardo actualmente.</p>
      </div>

      {asignacionesActivas.length === 0 ? (
        <div className="bg-white p-10 rounded-lg border border-dashed border-gray-300 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
            <Package size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No tienes activos asignados</h3>
          <p className="text-gray-500 mt-2">Cuando un administrador te asigne un equipo, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {asignacionesActivas.map((asignacion) => {
            // 3. Determina la ubicación actual
            const mov = asignacion.movimientos[0]?.ubicacion;
            const ubicacionActual = mov 
              ? `${mov.nombre_area} ${mov.edificio ? `(Edif. ${mov.edificio}` : ''}${mov.piso ? `, ${mov.piso})` : ')'}` 
              : "Sin ubicación registrada";
            // 4. ¡IMPORTANTE! Asigna la ubicación al objeto antes de pasarlo al modal
            asignacion.ubicacionActual = ubicacionActual;
            
            return (
              <div key={asignacion.id_asignacion} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                
                {/* 4. --- JSX COMPLETADO --- */}
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{asignacion.activo.nombre}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">{asignacion.activo.num_inventario || 'S/N'}</p>
                  </div>
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800`}>
                    {asignacion.activo.estado.replace('_', ' ')}
                  </span>
                </div>
                {/* --- FIN JSX --- */}

                <div className="p-5 space-y-4">
                  
                  {/* 5. --- JSX COMPLETADO --- */}
                  <div className="text-sm space-y-2">
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium w-20">Marca:</span> 
                      <span>{asignacion.activo.marca || '-'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium w-20">Modelo:</span> 
                      <span>{asignacion.activo.modelo || '-'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                      <span>Asignado el: {new Date(asignacion.fecha_asignacion).toLocaleDateString('es-MX')}</span>
                    </div>
                  {/* --- FIN JSX --- */}
                    
                    {/* 6. Muestra la ubicación actual (ya corregida) */}
                    <div className="flex items-center text-gray-600">
                      <MapPin size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                      <span>Ubicación actual: <span className="font-medium">{ubicacionActual}</span></span>
                    </div>
                  </div>

                  {/* 7. El botón ahora abre el modal (sin cambios) */}
                  <button 
                    onClick={() => openMovimientoModal(asignacion)}
                    className="w-full mt-4 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                  >
                    <ArrowRightLeft size={16} className="mr-2" />
                    Registrar Movimiento
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 8. Renderiza el Modal (sin cambios) */}
      <RegistrarMovimientoModal
        asignacion={selectedAsignacion}
        onClose={closeMovimientoModal}
        onSuccess={handleMovimientoSuccess}
      />
    </div>
  );
}

export default MyAssetsPage;