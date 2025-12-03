import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Plus, CheckCircle, Wrench, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { API_URL } from '../../config';

// --- Interfaces ---
interface Mantenimiento {
  id_mantenimiento: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo: 'Preventivo' | 'Correctivo';
  descripcion_problema: string;
  solucion_aplicada: string | null;
  costo: number | null;
  nombre_tecnico: string | null;
  activo: {
    nombre: string;
    num_inventario: string | null;
  };
}

function MantenimientoPage() {
  const { logout } = useAuth();
  const [registros, setRegistros] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados del Modal de Finalización
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [solucion, setSolucion] = useState('');
  const [costo, setCosto] = useState('');
  const [estadoFinal, setEstadoFinal] = useState('Bueno');

  // --- Cargar Datos ---
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) { logout(); return; }

    try {
      const response = await fetch(`${API_URL}/api/mantenimientos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRegistros(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Funciones del Modal ---
  const openFinalizeModal = (id: number) => {
    setSelectedId(id);
    setSolucion('');
    setCosto('');
    setEstadoFinal('Bueno');
    setIsModalOpen(true);
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token || !selectedId) return;

    try {
      const response = await fetch(`${API_URL}/api/mantenimientos/${selectedId}/finalizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          solucion_aplicada: solucion,
          costo: costo ? parseFloat(costo) : 0,
          estado_activo_final: estadoFinal
        })
      });

      if (!response.ok) throw new Error('Error al finalizar');

      alert('Mantenimiento finalizado correctamente.');
      setIsModalOpen(false);
      fetchData(); // Recargar lista

    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando registros...</div>;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mantenimiento de Activos</h1>
          <p className="text-sm text-gray-500 mt-1">Historial y gestión de servicios técnicos.</p>
        </div>
        <Link 
          to="/mantenimiento/nuevo" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus size={18} className="mr-2" /> Nuevo Registro
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Problema / Solución</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fechas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registros.map((m) => (
                <tr key={m.id_mantenimiento} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {m.fecha_fin ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Finalizado</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">En Proceso</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{m.activo.nombre}</div>
                    <div className="text-xs text-gray-500 font-mono">{m.activo.num_inventario || 'S/N'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`flex items-center text-sm ${m.tipo === 'Correctivo' ? 'text-red-600' : 'text-blue-600'}`}>
                      {m.tipo === 'Correctivo' ? <AlertCircle size={14} className="mr-1"/> : <Wrench size={14} className="mr-1"/>}
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-gray-900 max-w-xs truncate" title={m.descripcion_problema}>{m.descripcion_problema}</div>
                    {m.solucion_aplicada && <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={m.solucion_aplicada}>Solución: {m.solucion_aplicada}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center"><Calendar size={12} className="mr-1"/> {new Date(m.fecha_inicio).toLocaleDateString()}</div>
                    {m.fecha_fin && <div className="text-xs mt-1">Fin: {new Date(m.fecha_fin).toLocaleDateString()}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!m.fecha_fin && (
                      <button 
                        onClick={() => openFinalizeModal(m.id_mantenimiento)}
                        className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full transition-colors"
                        title="Finalizar Mantenimiento"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {registros.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No hay registros de mantenimiento.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Finalizar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Finalizar Mantenimiento</h3>
            
            <form onSubmit={handleFinalize} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Solución Aplicada</label>
                <textarea required value={solucion} onChange={e => setSolucion(e.target.value)} rows={3} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Describe qué se hizo para solucionar el problema..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Costo Final</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" min="0" step="0.01" value={costo} onChange={e => setCosto(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 pl-7 px-3 py-2 border focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado Final del Activo</label>
                <select value={estadoFinal} onChange={e => setEstadoFinal(e.target.value)} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Bueno">Bueno (Operativo)</option>
                  <option value="Regular">Regular (Operativo con detalles)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm">Finalizar y Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MantenimientoPage;