import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { API_URL } from '../../config';

// --- Interfaces ---
interface Departamento {
  id_departamento: number;
  nombre: string;
  fecha_creacion: string | null;
}

// Interfaz para los datos del formulario
interface FormularioDepto {
  nombre: string;
  // Puedes añadir más campos aquí si tu DTO los requiere
}

function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estados para el formulario (Crear/Editar) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDeptoId, setSelectedDeptoId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormularioDepto>({ nombre: '' });
  const [formError, setFormError] = useState('');

  const { user, logout } = useAuth();

  // --- Cargar Datos ---
  const fetchDepartamentos = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) { logout(); return; }

    try {
      const response = await fetch(`${API_URL}/api/departamentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar departamentos.');
      const data: Departamento[] = await response.json();
      setDepartamentos(data);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('token')) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
  }, [logout]);

  // --- Funciones del Modal ---
  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedDeptoId(null);
    setFormData({ nombre: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (depto: Departamento) => {
    setIsEditing(true);
    setSelectedDeptoId(depto.id_departamento);
    setFormData({ nombre: depto.nombre });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // --- Manejador del Formulario (Crear/Editar) ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const url = isEditing
      ? `${API_URL}/api/departamentos/${selectedDeptoId}`
      : `${API_URL}/api/departamentos`;
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData) // Envía el objeto formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || (isEditing ? 'Error al actualizar' : 'Error al crear'));
      }

      alert(`Departamento ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
      closeModal();
      fetchDepartamentos(); // Recarga la lista

    } catch (err: any) {
      setFormError(err.message);
    }
  };
  
  // --- NUEVA FUNCIÓN: Manejador de Eliminación ---
  const handleDelete = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el departamento "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    setFormError('');
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/departamentos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar.');
      }
      
      alert('Departamento eliminado con éxito.');
      fetchDepartamentos(); // Recarga la lista
      
    } catch (err: any) {
      alert(err.message); // Muestra el error (ej. "No se puede eliminar, está en uso")
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando departamentos...</div>;
  if (error) return <p className="p-8 text-center text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-6">
      
      {/* Encabezado y Botón */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Departamentos</h1>
          <p className="text-sm text-gray-500 mt-1">Crear y editar los departamentos de la institución.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Nuevo Departamento
        </button>
      </div>

      {/* Tabla de Departamentos */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Creación</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departamentos.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No hay departamentos registrados.</td></tr>
              ) : (
                departamentos.map((depto) => (
                  <tr key={depto.id_departamento} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{depto.id_departamento}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{depto.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {depto.fecha_creacion ? new Date(depto.fecha_creacion).toLocaleDateString('es-MX') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => openEditModal(depto)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Editar Departamento"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(depto.id_departamento, depto.nombre)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        title="Eliminar Departamento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL (Ventana Emergente) para Crear/Editar --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {isEditing ? 'Editar Departamento' : 'Nuevo Departamento'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="nombreDepto" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    id="nombreDepto"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Puedes añadir más campos aquí, como 'fecha_creacion' si quieres que sea manual */}
              </div>

              {formError && <p className="text-sm text-red-600 mt-2 text-center">{formError}</p>}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
                >
                  {isEditing ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- FIN MODAL --- */}
    </div>
  );
}

export default DepartamentosPage;