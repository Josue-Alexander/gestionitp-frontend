import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; 
import { Plus, Edit, Trash2 } from 'lucide-react';
import { API_URL } from '../../config';

// --- Interfaces ---
interface Departamento {
  id_departamento: number;
  nombre: string;
}
interface Ubicacion {
  id_ubicacion: number;
  nombre_area: string;
  piso: string | null;
  edificio: string | null;
  id_departamento: number | null;
  departamento?: {
    nombre: string;
  } | null;
}
// Interfaz para el formulario
interface FormularioUbicacion {
  nombre_area: string;
  piso: string;
  edificio: string;
  id_departamento: string; // Se maneja como string por el <select>
}

function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]); // Para el dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Asumimos que 'user' tiene id_departamento (asegúrate que tu AuthContext lo provea)
  const { user, logout } = useAuth();

  // --- Estados para el Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUbicacionId, setSelectedUbicacionId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormularioUbicacion>({
    nombre_area: '',
    piso: '',
    edificio: '',
    id_departamento: '',
  });
  const [formError, setFormError] = useState('');

  // --- Cargar Datos (Ubicaciones y Departamentos) ---
  const fetchUbicaciones = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    
    if (!token) { logout(); return; } 

    try {
      const [ubisRes, deptosRes] = await Promise.all([
        fetch(`${API_URL}/api/ubicaciones`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (!ubisRes.ok || !deptosRes.ok) throw new Error('Error al cargar datos.');
      
      const ubisData: Ubicacion[] = await ubisRes.json();
      const deptosData: Departamento[] = await deptosRes.json();
      
      setUbicaciones(ubisData);
      setDepartamentos(deptosData);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUbicaciones();
  }, [logout]);

  // --- Funciones del Modal ---
  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedUbicacionId(null);
    
    // --- LÓGICA DE BLOQUEO DE DEPARTAMENTO ---
    let initialDepto = '';

    // CASO 1: Si es Admin de Depto, FORZAMOS su ID (si existe en el objeto user)
    // @ts-ignore: Asumiendo que user tiene id_departamento
    if (user?.role === 'Admin_Depto' && user.id_departamento) {
        // @ts-ignore
        initialDepto = user.id_departamento.toString();
    } 
    // CASO 2: Si es Admin General, usamos el primero de la lista por defecto
    else if (departamentos.length > 0) {
        initialDepto = departamentos[0].id_departamento.toString();
    }

    setFormData({ 
      nombre_area: '',
      piso: '',
      edificio: '',
      id_departamento: initialDepto
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (ubi: Ubicacion) => {
    setIsEditing(true);
    setSelectedUbicacionId(ubi.id_ubicacion);
    setFormData({
      nombre_area: ubi.nombre_area,
      piso: ubi.piso || '',
      edificio: ubi.edificio || '',
      id_departamento: ubi.id_departamento?.toString() || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // --- Manejador del Formulario (Crear/Editar) ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const url = isEditing
      ? `${API_URL}/api/ubicaciones/${selectedUbicacionId}`
      : `${API_URL}/api/ubicaciones`;
    const method = isEditing ? 'PUT' : 'POST';

    // Aseguramos que se envíe el depto correcto (aunque esté disabled en el UI)
    const dataToSend = {
      ...formData,
      id_departamento: parseInt(formData.id_departamento) 
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert(`Ubicación ${isEditing ? 'actualizada' : 'creada'}.`);
      closeModal();
      fetchUbicaciones(); 
    } catch (err: any) {
      setFormError(err.message);
    }
  };
  
  // --- Manejador de Eliminación ---
  const handleDelete = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar ubicación "${nombre}"?`)) return;
    
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_URL}/api/ubicaciones/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      alert('Ubicación eliminada.');
      fetchUbicaciones(); 
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando ubicaciones...</div>;
  if (error) return <p className="p-8 text-center text-red-500">Error: {error}</p>;

  // Determinar si el campo de departamento debe estar bloqueado
  const isDeptoLocked = user?.role === 'Admin_Depto';

  return (
    <div className="space-y-6 p-6 font-sans text-slate-800">
      
      {/* Encabezado y Botón */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Ubicaciones</h1>
          <p className="text-sm text-gray-500 mt-1">Administra las áreas físicas (laboratorios, oficinas, almacenes).</p>
        </div>
        {/* Solo Admin General y Admin Depto pueden crear */}
        {(user?.role === 'Admin_General' || user?.role === 'Admin_Depto') && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Nueva Ubicación
          </button>
        )}
      </div>

      {/* Tabla de Ubicaciones */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre del Área</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edificio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Piso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamento Gestor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ubicaciones.map((ubi) => (
                <tr key={ubi.id_ubicacion} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{ubi.nombre_area}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ubi.edificio || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ubi.piso || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ubi.departamento?.nombre === 'Administración General' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {ubi.departamento?.nombre || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {(user?.role === 'Admin_General' || user?.role === 'Admin_Depto') && (
                      <>
                        <button
                          onClick={() => openEditModal(ubi)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Editar Ubicación"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ubi.id_ubicacion, ubi.nombre_area)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Eliminar Ubicación"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {ubicaciones.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No se encontraron ubicaciones registradas.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL (Ventana Emergente) para Crear/Editar --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                {isEditing ? 'Editar Ubicación' : 'Nueva Ubicación'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Nombre Área */}
                <div className="md:col-span-2">
                  <label htmlFor="nombre_area" className="block text-sm font-medium text-gray-700">Nombre del Área <span className="text-red-500">*</span></label>
                  <input type="text" id="nombre_area" value={formData.nombre_area}
                    onChange={(e) => setFormData({ ...formData, nombre_area: e.target.value })} required
                    placeholder="Ej. Sala de Juntas, Laboratorio 1"
                    className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                </div>

                {/* Edificio */}
                <div>
                  <label htmlFor="edificio" className="block text-sm font-medium text-gray-700">Edificio</label>
                  <input type="text" id="edificio" value={formData.edificio}
                    onChange={(e) => setFormData({ ...formData, edificio: e.target.value })}
                    placeholder="Ej. Edificio A"
                    className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                </div>

                {/* Piso */}
                <div>
                  <label htmlFor="piso" className="block text-sm font-medium text-gray-700">Piso</label>
                  <input type="text" id="piso" value={formData.piso}
                    onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                    placeholder="Ej. Planta Baja"
                    className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                </div>

                {/* Departamento (CON LÓGICA DE BLOQUEO) */}
                <div className="md:col-span-2">
                  <label htmlFor="id_departamento" className="block text-sm font-medium text-gray-700">
                    Departamento Gestor <span className="text-red-500">*</span>
                  </label>
                  <select 
                    id="id_departamento" 
                    value={formData.id_departamento}
                    onChange={(e) => setFormData({ ...formData, id_departamento: e.target.value })} 
                    required
                    disabled={isDeptoLocked} // Bloqueado si es Admin Depto
                    className={`w-full mt-1 rounded-md border px-3 py-2 outline-none transition-all
                        ${isDeptoLocked 
                            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        }`}
                  >
                    {departamentos.map(depto => (
                      <option key={depto.id_departamento} value={depto.id_departamento}>
                        {depto.nombre}
                      </option>
                    ))}
                  </select>
                  {isDeptoLocked && (
                    <p className="text-xs text-gray-500 mt-1">
                      * Como Administrador de Departamento, solo puedes registrar ubicaciones para tu área asignada.
                    </p>
                  )}
                </div>

              </div>

              {formError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200 mt-2">
                    {formError}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                  {isEditing ? 'Guardar Cambios' : 'Crear Ubicación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UbicacionesPage;