import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { API_URL } from '../../config';

// --- Interfaces ---
interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
  descripcion: string | null;
}
// Interfaz para el formulario
interface FormularioCategoria {
  nombre_categoria: string;
  descripcion: string;
}

function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estados para el Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormularioCategoria>({
    nombre_categoria: '',
    descripcion: '',
  });
  const [formError, setFormError] = useState('');

  const { logout } = useAuth();

  // --- Cargar Datos ---
  const fetchCategorias = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) { logout(); return; }

    try {
      const response = await fetch(`${API_URL}/api/categorias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar categorías.');
      const data: Categoria[] = await response.json();
      setCategorias(data);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('token')) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, [logout]);

  // --- Funciones del Modal ---
  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedCategoriaId(null);
    setFormData({ nombre_categoria: '', descripcion: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Categoria) => {
    setIsEditing(true);
    setSelectedCategoriaId(cat.id_categoria);
    setFormData({
      nombre_categoria: cat.nombre_categoria,
      descripcion: cat.descripcion || '',
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
      ? `${API_URL}/api/categorias/${selectedCategoriaId}`
      : `${API_URL}/api/categorias`;
    const method = isEditing ? 'PUT' : 'POST';

    const dataToSend = {
      ...formData,
      descripcion: formData.descripcion || null, // Asegura enviar null si está vacío
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert(`Categoría ${isEditing ? 'actualizada' : 'creada'}.`);
      closeModal();
      fetchCategorias(); // Recarga la lista
    } catch (err: any) {
      setFormError(err.message); // Muestra error de duplicado, etc.
    }
  };
  
  // --- Manejador de Eliminación ---
  const handleDelete = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar categoría "${nombre}"?`)) return;
    
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_URL}/api/categorias/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      alert('Categoría eliminada.');
      fetchCategorias(); // Recarga la lista
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`); // Muestra error (ej. "está en uso")
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando categorías...</div>;
  if (error) return <p className="p-8 text-center text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-6">
      
      {/* Encabezado y Botón */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
          <p className="text-sm text-gray-500 mt-1">Administra el catálogo unificado de categorías de activos.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Nueva Categoría
        </button>
      </div>

      {/* Tabla de Categorías */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre de Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categorias.map((cat) => (
                <tr key={cat.id_categoria} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{cat.id_categoria}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cat.nombre_categoria}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-sm truncate">{cat.descripcion || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Editar Categoría"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id_categoria, cat.nombre_categoria)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Eliminar Categoría"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL (Ventana Emergente) para Crear/Editar --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              
              <div>
                <label htmlFor="nombre_categoria" className="block text-sm font-medium text-gray-700">Nombre*</label>
                <input type="text" id="nombre_categoria" value={formData.nombre_categoria}
                  onChange={(e) => setFormData({ ...formData, nombre_categoria: e.target.value })} required
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea id="descripcion" value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={3}
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2" />
              </div>

              {formError && <p className="text-sm text-red-600 text-center">{formError}</p>}

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">
                  {isEditing ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriasPage;