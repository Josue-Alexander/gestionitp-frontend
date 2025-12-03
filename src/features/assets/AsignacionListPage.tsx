import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Plus, CheckSquare, XCircle, MapPin, Eye } from 'lucide-react';
import MovimientoHistorialModal from './MovimientoHistorialModal';
import { API_URL } from '../../config';



// --- Interfaces ---
interface Asignacion {
  id_asignacion: number;
  fecha_asignacion: string;
  fecha_fin_prevista: string | null;
  fecha_fin_real: string | null;
  estado: 'Activa' | 'Finalizada';
  observaciones: string | null;
  activo: {
    id_objeto: number; 
    nombre: string;
    num_inventario: string | null;
  };
  usuario: {
    id_usuario: number; 
    nombre: string;
    email: string;
  };
  movimientos: {
    ubicacion: {
      nombre_area: string;
    }
  }[];
}

function AsignacionListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [selectedAsignacionId, setSelectedAsignacionId] = useState<number | null>(null);

  // --- Cargar Datos ---
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) { logout(); return; }

      try {
        // Llamamos a la ruta que creamos en el backend
        const response = await fetch(`${API_URL}/api/asignaciones`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Error al cargar asignaciones.');
        const data: Asignacion[] = await response.json();
        setAsignaciones(data);
      } catch (err: any) {
        setError(err.message);
        if (err.message.includes('token')) logout();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, logout, navigate]);

  // --- Manejador para Finalizar Asignación ---
  const handleFinalizar = async (id: number) => {
    if (!window.confirm('¿Estás seguro de finalizar esta asignación? El activo volverá a estar disponible.')) return;
    
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_URL}/api/asignaciones/${id}/finalizar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('No se pudo finalizar la asignación.');
      
      // Actualizar la lista localmente
      setAsignaciones(prev => 
        prev.map(a => a.id_asignacion === id ? { ...a, estado: 'Finalizada', fecha_fin_real: new Date().toISOString() } : a)
      );
      alert('Asignación finalizada.');

    } catch (err: any) {
      alert(err.message);
    }
  };

  const openHistorialModal = (id: number) => {
    setSelectedAsignacionId(id);
    setModalHistorialOpen(true);
  };

  const closeHistorialModal = () => {
    setModalHistorialOpen(false);
    setSelectedAsignacionId(null);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando asignaciones...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      
      {/* Header y Botón */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Asignaciones</h1>
          <p className="text-sm text-gray-500 mt-1">Historial de préstamos y devoluciones de activos.</p>
        </div>
        <Link 
          to="/nueva-asignacion"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Nueva Asignación
        </Link>
      </div>

      {/* Filtros (Placeholder) */}
      {/* <div className="bg-white p-4 rounded-lg shadow-sm border ...">Filtros...</div> */}

      {/* Tabla de Asignaciones */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activo Asignado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario Responsable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Asignación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Fin (Real)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {asignaciones.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No hay asignaciones.</td></tr>
              ) : (
                asignaciones.map((asig) => {
                  
                  // --- 3. NUEVA LÓGICA (Obtener ubicación) ---
                  const ubicacionActual = asig.movimientos[0]?.ubicacion.nombre_area || "Sin registrar";
                  
                  return (
                    <tr key={asig.id_asignacion} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {asig.estado === 'Activa' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Activa</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Finalizada</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/activo/${asig.activo.id_objeto}`} className="text-sm font-medium text-blue-600 hover:underline">
                          {asig.activo.nombre}
                        </Link>
                        <div className="text-xs text-gray-500 font-mono">{asig.activo.num_inventario || 'S/N'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         {/* Asumimos que /usuario/:id es una ruta futura */}
                         <Link to={`/usuario/${asig.usuario.id_usuario}`} className="text-sm font-medium text-blue-600 hover:underline">
                           {asig.usuario.nombre}
                         </Link>
                         <div className="text-xs text-gray-500">{asig.usuario.email}</div>
                      </td>
                      
                      {/* --- 4. NUEVA CELDA (Mostrar ubicación) --- */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1 text-gray-400" />
                          {ubicacionActual}
                        </div>
                      </td>
                      {/* ------------------------------------- */}
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2"> {/* Añade space-x-2 */}
                      
                      {/* Botón de Finalizar (como estaba) */}
                      {asig.estado === 'Activa' && (
                        <button
                          onClick={() => handleFinalizar(asig.id_asignacion)}
                          className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full hover:bg-yellow-200"
                          title="Finalizar Asignación"
                        >
                          <CheckSquare size={14} className="mr-1" />
                          Finalizar
                        </button>
                      )}

                      {/* --- ¡NUEVO BOTÓN AÑADIDO! --- */}
                      <button
                        onClick={() => openHistorialModal(asig.id_asignacion)} // Llama a la función
                        className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        title="Ver Historial de Movimientos"
                        >
                        <Eye size={16} />
                      </button>
                      {/* --- FIN NUEVO BOTÓN --- */}

                    </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        {/* --- RENDERIZA EL MODAL AQUÍ --- */}
      {/* Debe estar dentro del div principal, pero como hermano de la tabla */}
      <MovimientoHistorialModal 
        asignacionId={selectedAsignacionId}
        onClose={closeHistorialModal}
      />
    </div>
  );
}

export default AsignacionListPage;