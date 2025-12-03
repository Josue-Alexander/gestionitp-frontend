import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { API_URL } from '../../config';

// --- Interfaces ---
interface Ubicacion {
  id_ubicacion: number;
  nombre_area: string;
  // Campos añadidos para mostrar detalle
  edificio: string | null;
  piso: string | null;
}

interface AsignacionSimple {
  id_asignacion: number;
  activo: { nombre: string };
  ubicacionActual?: string; // Recibe la ubicación actual formateada
}

interface ModalProps {
  asignacion: AsignacionSimple | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RegistrarMovimientoModal({ asignacion, onClose, onSuccess }: ModalProps) {
  // Estado para la lista de ubicaciones
  const [ubicacionesFiltradas, setUbicacionesFiltradas] = useState<Ubicacion[]>([]);
  
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga la lista de todas las ubicaciones cuando se abre el modal
  useEffect(() => {
    if (!asignacion) return; 

    const fetchUbicaciones = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/ubicaciones`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Error al cargar ubicaciones.');
        
        const data: Ubicacion[] = await response.json();

        // Filtramos la lista para excluir la ubicación actual (si el nombre coincide)
        // Nota: Como ahora ubicacionActual tiene formato complejo, el filtro exacto puede fallar.
        // Por seguridad, mostramos todas, o filtramos si el nombre_area está contenido.
        // Para simplificar y asegurar que el usuario vea todas las opciones disponibles:
        const filtradas = data.filter(ubi => 
            !asignacion.ubicacionActual?.includes(ubi.nombre_area)
        );
        
        // Si el filtro es muy agresivo, usa 'data' directo. Aquí usamos 'filtradas'.
        setUbicacionesFiltradas(filtradas.length > 0 ? filtradas : data);

        // Establece el valor por defecto
        if (filtradas.length > 0) {
          setSelectedUbicacion(filtradas[0].id_ubicacion.toString());
        } else if (data.length > 0) {
           setSelectedUbicacion(data[0].id_ubicacion.toString());
        } else {
          setError("No hay ubicaciones disponibles.");
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUbicaciones();
  }, [asignacion]);

  // Maneja el envío del formulario
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!asignacion || !selectedUbicacion) {
        setError("Debes seleccionar una nueva ubicación.");
        return;
    }

    const token = localStorage.getItem('authToken');
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/asignaciones/${asignacion.id_asignacion}/movimientos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_ubicacion: parseInt(selectedUbicacion) })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al registrar el movimiento.');
      }
      
      alert('¡Movimiento registrado con éxito!');
      onSuccess(); 
      onClose(); 

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!asignacion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <form onSubmit={handleSubmit}>
          
          <div className="flex items-center mb-4">
            <MapPin size={20} className="text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">Actualizar Ubicación</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            Activo: <span className="font-medium">{asignacion.activo.nombre}</span>
          </p>

          {/* Muestra la Ubicación Actual */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación Actual</label>
            <p className="text-base font-semibold text-gray-800 mt-1">
              {asignacion.ubicacionActual || "N/A"}
            </p>
          </div>

          {/* Selector de NUEVA Ubicación */}
          <div>
            <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Nueva Ubicación</label>
            <select
              id="ubicacion"
              value={selectedUbicacion}
              onChange={(e) => setSelectedUbicacion(e.target.value)}
              required
              disabled={loading || ubicacionesFiltradas.length === 0}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {loading ? (
                <option value="" disabled>Cargando ubicaciones...</option>
              ) : (
                // --- RENDERIZADO ACTUALIZADO ---
                ubicacionesFiltradas.map(ubi => (
                  <option key={ubi.id_ubicacion} value={ubi.id_ubicacion}>
                    {ubi.nombre_area} - {ubi.edificio || '?'} ({ubi.piso || '?'})
                  </option>
                ))
                // -------------------------------
              )}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 mt-3 bg-red-50 p-2 rounded">{error}</p>}

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || ubicacionesFiltradas.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Guardar Movimiento
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}

export default RegistrarMovimientoModal;