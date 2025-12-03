import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, User, Briefcase, Shield, Ban, CheckCircle } from 'lucide-react';
import { API_URL } from '../../config';

// --- Interfaces ---
interface Departamento { 
  id_departamento: number; 
  nombre: string; 
}

interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: 'Admin_General' | 'Admin_Depto' | 'Gestor' | 'Usuario_General';
  id_departamento: number | null;
  activo: boolean;
  departamento?: { nombre: string };
}

const initialFormState = {
  nombre: '',
  email: '',
  contraseña: '',
  rol: 'Usuario_General',
  id_departamento: ''
};

function UsuariosPage() {
  const { user, logout } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');

  // --- 1. Cargar Datos ---
  // Nota: El backend ya filtra los usuarios según el rol del que hace la petición.
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) { logout(); return; }

    try {
      const [usersRes, deptosRes] = await Promise.all([
        fetch(`${API_URL}/api/usuarios`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } }) // Esta ruta es pública
      ]);

      if (!usersRes.ok) throw new Error('Error al cargar usuarios.');
      
      const usersData: Usuario[] = await usersRes.json();
      const deptosData: Departamento[] = deptosRes.ok ? await deptosRes.json() : [];

      setUsuarios(usersData);
      setDepartamentos(deptosData);

    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('token')) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 2. Lógica de Roles Disponibles (MODIFICADA) ---
  const getAvailableRoles = () => {
    if (!user) return [];

    // Regla 1: Nadie puede crear un 'Admin_General' desde aquí.
    if (user.role === 'Admin_General') {
      return ['Admin_Depto', 'Gestor', 'Usuario_General'];
    }

    // Regla 3: Admin Depto solo crea personal operativo
    if (user.role === 'Admin_Depto') {
      return ['Gestor', 'Usuario_General'];
    }
    return [];
  };

  // --- 3. Abrir Modal ---
  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedUserId(null);
    
    // Regla 3: Lógica para forzar el departamento
    let defaultDepto = '';
    
    if (user?.role === 'Admin_Depto' && user.id_departamento) {
      // Si soy Admin Depto, MI departamento es la única opción
      defaultDepto = user.id_departamento.toString();
    } else if (departamentos.length > 0) {
      // Si soy Admin General, selecciono el primero por defecto
      defaultDepto = departamentos[0].id_departamento.toString();
    }

    setFormData({ 
      ...initialFormState, 
      id_departamento: defaultDepto,
      rol: 'Usuario_General' 
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (usr: Usuario) => {
    // Seguridad extra: Un Admin Depto no debería poder editar a alguien de otro depto
    // (Aunque el backend lo protege, lo filtramos aquí también)
    if (user?.role === 'Admin_Depto' && usr.id_departamento !== user.id_departamento) {
        alert("No puedes editar usuarios de otro departamento.");
        return;
    }

    setIsEditing(true);
    setSelectedUserId(usr.id_usuario);
    setFormData({
      nombre: usr.nombre,
      email: usr.email,
      contraseña: '',
      rol: usr.rol,
      id_departamento: usr.id_departamento?.toString() || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // --- 4. Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      let url = '';
      let method = '';
      const body: any = { ...formData };
      
      // Asegurar conversión a número
      body.id_departamento = body.id_departamento ? parseInt(body.id_departamento) : null;

      if (isEditing) {
        url = `${API_URL}/api/usuarios/${selectedUserId}`;
        method = 'PUT';
        if (!body.contraseña) delete body.contraseña;
      } else {
        url = `${API_URL}/api/usuarios`;
        method = 'POST';
        if (!body.contraseña) throw new Error('La contraseña es obligatoria.');
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al procesar.');

      alert(`Usuario ${isEditing ? 'actualizado' : 'creado'} correctamente.`);
      closeModal();
      fetchData(); 

    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // --- 5. Suspender/Activar ---
  const handleToggleStatus = async (usuario: Usuario) => {
    // Validación frontend extra
    if (user?.role === 'Admin_Depto' && usuario.id_departamento !== user.id_departamento) {
        alert("No puedes modificar usuarios de otro departamento.");
        return;
    }

    const accion = usuario.activo ? 'SUSPENDER' : 'ACTIVAR';
    if (!window.confirm(`¿Estás seguro de que quieres ${accion} la cuenta de "${usuario.nombre}"?`)) return;
    
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${usuario.id_usuario}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ activo: !usuario.activo })
      });

      if (!response.ok) throw new Error('Error al cambiar estado.');
      
      setUsuarios(prev => prev.map(u => 
        u.id_usuario === usuario.id_usuario ? { ...u, activo: !u.activo } : u
      ));
      
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getRoleBadgeColor = (rol: string) => {
    switch(rol) {
      case 'Admin_General': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Admin_Depto': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Gestor': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'Admin_General' ? 'Administración Global' : 'Usuarios de tu Departamento'}
          </p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
          <Plus size={18} className="mr-2" /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamento</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usr) => (
                <tr key={usr.id_usuario} className={`transition-colors ${!usr.activo ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${usr.activo ? 'bg-gray-200 text-gray-500' : 'bg-red-100 text-red-500'}`}>
                        {usr.activo ? <User size={16} /> : <Ban size={16} />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{usr.nombre}</div>
                        <div className="text-xs text-gray-500">{usr.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${usr.activo ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                      {usr.activo ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(usr.rol)}`}>
                      {usr.rol.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Briefcase size={14} className="mr-1 text-gray-400" />
                      {usr.departamento?.nombre || 'Sin Asignar'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => openEditModal(usr)} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-full" title="Editar">
                      <Edit size={16} />
                    </button>
                    {usr.id_usuario !== user?.userId && (
                       <button 
                         onClick={() => handleToggleStatus(usr)} 
                         className={`p-2 rounded-full transition-colors ${usr.activo ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                         title={usr.activo ? "Suspender" : "Activar"}
                       >
                         {usr.activo ? <Ban size={16} /> : <CheckCircle size={16} />}
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contraseña {isEditing && '(Opcional)'}</label>
                <input type="password" value={formData.contraseña} onChange={e => setFormData({...formData, contraseña: e.target.value})} required={!isEditing} minLength={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border" />
              </div>

              {/* Rol (Opciones filtradas) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <div className="mt-1 relative">
                  <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value as any})} className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border appearance-none">
                    {getAvailableRoles().map(role => (
                      <option key={role} value={role}>{role.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <Shield className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Departamento (Deshabilitado para Admin Depto) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Departamento</label>
                <div className="mt-1 relative">
                  <select 
                    value={formData.id_departamento} 
                    onChange={e => setFormData({...formData, id_departamento: e.target.value})}
                    // REGLA 3: Deshabilitado si es Admin Depto
                    disabled={user?.role === 'Admin_Depto'} 
                    className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border appearance-none disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">Sin Departamento</option>
                    {departamentos.map(d => (
                      <option key={d.id_departamento} value={d.id_departamento}>{d.nombre}</option>
                    ))}
                  </select>
                  <Briefcase className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {formError && <p className="text-sm text-red-600 text-center">{formError}</p>}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm">{isEditing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosPage;