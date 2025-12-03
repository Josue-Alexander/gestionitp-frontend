import React, { useState, useEffect } from 'react';
import { List, MapPin, Clock } from 'lucide-react'; // Iconos
import { API_URL } from '../../config';

// --- Interfaces ---
interface Movimiento {
  id_movimiento: number;
  fecha_movimiento: string;
  ubicacion: {
    nombre_area: string;
  };
}
interface ModalProps {
  asignacionId: number | null;
  onClose: () => void;
}

function MovimientoHistorialModal({ asignacionId, onClose }: ModalProps) {
  const [historial, setHistorial] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga el historial cuando se abre el modal (cuando asignacionId cambia)
  useEffect(() => {
    // No hagas nada si no hay ID
    if (!asignacionId) return;

    const fetchHistorial = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("No autenticado.");
        setLoading(false);
        return;
      }

      try {
        // Llama a la nueva ruta del backend
        const response = await fetch(`${API_URL}/api/asignaciones/${asignacionId}/movimientos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Error al cargar el historial de movimientos.');
        
        const data: Movimiento[] = await response.json();
        setHistorial(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, [asignacionId]); // Se ejecuta cada vez que 'asignacionId' cambia

  // Si no hay ID, el modal está cerrado
  if (!asignacionId) return null;

  return (
    // Fondo oscuro (Backdrop)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      
      {/* Contenido del Modal (Detiene la propagación del clic) */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center mb-4">
          <List size={20} className="text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">Historial de Movimientos</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Mostrando el historial para la asignación ID: {asignacionId}
        </p>

        {/* Contenido (Lista de Movimientos) */}
        <div className="overflow-y-auto max-h-64 border rounded-md">
          {loading && <p className="p-4 text-center text-gray-500">Cargando historial...</p>}
          {error && <p className="p-4 text-center text-red-500">{error}</p>}
          {!loading && !error && historial.length === 0 && (
             <p className="p-4 text-center text-gray-500">No hay movimientos registrados para esta asignación.</p>
          )}
          {!loading && !error && historial.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {historial.map((mov) => (
                <li key={mov.id_movimiento} className="p-4 flex items-center">
                  <MapPin size={18} className="text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-grow">
                    <p className="font-medium text-gray-900">{mov.ubicacion.nombre_area}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {new Date(mov.fecha_movimiento).toLocaleString('es-MX')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Botón de Cierre */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-700 focus:outline-none"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default MovimientoHistorialModal;