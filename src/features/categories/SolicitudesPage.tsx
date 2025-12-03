import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, CheckCircle, XCircle, Clock, MessageSquare, User, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config';

// --- Interfaces ---
interface Solicitud {
  id_solicitud: number;
  nombre_sugerido: string;
  justificacion: string;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  respuesta_admin: string | null;
  fecha_solicitud: string;
  solicitante?: { nombre: string; email: string };
}

function SolicitudesPage() {
  const { user, logout } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del Modal (Crear Solicitud)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombreSugerido, setNombreSugerido] = useState('');
  const [justificacion, setJustificacion] = useState('');

  // --- 1. Cargar Datos ---
  const fetchSolicitudes = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) { logout(); return; }

    try {
      const response = await fetch(`${API_URL}/api/solicitudes-categoria`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Error al cargar las solicitudes.');
      
      const data: Solicitud[] = await response.json();
      setSolicitudes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  // --- 2. Crear Solicitud (Solo Admin Depto) ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/solicitudes-categoria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre_sugerido: nombreSugerido, justificacion })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al crear solicitud.');
      }
      
      alert('Solicitud enviada correctamente.');
      setIsModalOpen(false);
      setNombreSugerido('');
      setJustificacion('');
      fetchSolicitudes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- 3. Revisar Solicitud (Solo Admin General) ---
  const handleReview = async (id: number, decision: 'Aprobar' | 'Rechazar', justificacionOriginal: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    let motivo: string | null = null;
    let descripcion: string | null = null;

    if (decision === 'Rechazar') {
      motivo = prompt("Por favor, ingresa el motivo del rechazo:");
      if (motivo === null) return; // Cancelado
      if (motivo.trim() === "") {
        alert("Debes ingresar un motivo para rechazar.");
        return;
      }
    } else {
      // Al aprobar, permitimos editar la descripción final de la categoría
      const inputDesc = prompt("Descripción para la nueva categoría (opcional):", justificacionOriginal);
      if (inputDesc === null) return; // Cancelado
      descripcion = inputDesc;
    }

    try {
      const response = await fetch(`${API_URL}/api/solicitudes-categoria/${id}/revisar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          decision, 
          motivo_rechazo: motivo,
          descripcion_categoria: descripcion 
        })
      });

      if (!response.ok) {
         const data = await response.json();
         throw new Error(data.message || 'Error al procesar.');
      }
      
      alert(`Solicitud ${decision === 'Aprobar' ? 'aprobada y categoría creada' : 'rechazada'}.`);
      fetchSolicitudes(); 
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Helper de estilos
  const getStatusBadge = (estado: string) => {
    const base = "px-2.5 py-0.5 rounded-full text-xs font-medium border ";
    switch(estado) {
      case 'Pendiente': return base + "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'Aprobada': return base + "bg-green-100 text-green-800 border-green-200";
      case 'Rechazada': return base + "bg-red-100 text-red-800 border-red-200";
      default: return base + "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando solicitudes...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Categoría</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'Admin_General' 
              ? 'Gestiona las propuestas de nuevas categorías.' 
              : 'Solicita nuevas categorías al administrador.'}
          </p>
        </div>
        
        {/* Botón Crear (Solo Admin Depto) */}
        {user?.role === 'Admin_Depto' && (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus size={18} className="mr-2" /> Nueva Solicitud
          </button>
        )}
      </div>

      {/* Lista de Solicitudes */}
      <div className="space-y-4">
        {solicitudes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No hay solicitudes registradas.</p>
          </div>
        )}
        
        {solicitudes.map((sol) => (
          <div key={sol.id_solicitud} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={getStatusBadge(sol.estado)}>{sol.estado}</span>
                <span className="text-xs text-gray-400 flex items-center">
                  <Clock size={14} className="mr-1"/> 
                  {new Date(sol.fecha_solicitud).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {user?.role === 'Admin_General' && sol.solicitante && (
                   <span className="text-xs text-blue-600 flex items-center bg-blue-50 px-2 py-0.5 rounded">
                     <User size={12} className="mr-1"/> {sol.solicitante.nombre} ({sol.solicitante.email})
                   </span>
                )}
              </div>
              
              <div>
                 <h3 className="text-lg font-bold text-gray-900">{sol.nombre_sugerido}</h3>
                 <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Justificación:</span> {sol.justificacion}</p>
              </div>

              {/* Respuesta del Admin */}
              {sol.respuesta_admin && (
                <div className="flex items-start gap-3 text-sm text-gray-700 mt-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                  <MessageSquare size={18} className="mt-0.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900 block mb-1">Respuesta del Administrador:</span>
                    {sol.respuesta_admin}
                  </div>
                </div>
              )}
            </div>

            {/* Botones de Acción (Solo Admin General y Pendiente) */}
            {user?.role === 'Admin_General' && sol.estado === 'Pendiente' && (
              <div className="flex flex-row lg:flex-col gap-3 justify-center min-w-[140px]">
                <button 
                  onClick={() => handleReview(sol.id_solicitud, 'Aprobar', sol.justificacion)} 
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm text-sm font-medium transition-colors"
                >
                  <CheckCircle size={16} className="mr-2" /> Aprobar
                </button>
                <button 
                  onClick={() => handleReview(sol.id_solicitud, 'Rechazar', sol.justificacion)} 
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 text-sm font-medium transition-colors"
                >
                  <XCircle size={16} className="mr-2" /> Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Nueva Solicitud */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Solicitar Nueva Categoría</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Sugerido</label>
                <input 
                  type="text" 
                  value={nombreSugerido} 
                  onChange={e => setNombreSugerido(e.target.value)} 
                  required 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Ej. Equipo de Topografía"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Justificación</label>
                <textarea 
                  value={justificacion} 
                  onChange={e => setJustificacion(e.target.value)} 
                  required 
                  rows={3} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="¿Por qué es necesaria esta categoría?"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm">Enviar Solicitud</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SolicitudesPage;