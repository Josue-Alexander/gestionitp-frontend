import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

// --- Definición de Tipos Actualizada ---
interface Asset {
  id_objeto: number;
  nombre: string;
  num_inventario: string | null;
  estado: 'Bueno' | 'Regular' | 'Malo' | 'En_Mantenimiento' | 'De_Baja';
  asignaciones?: { estado: string }[]; 
}

interface User {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
  id_departamento?: number; 
}

interface Ubicacion {
  id_ubicacion: number;
  nombre_area: string;
  id_departamento: number; 
  edificio?: string;       
  departamento?: {         
    nombre: string;
  };
}

function NuevaAsignacionForm() {
  const navigate = useNavigate();
  const { user } = useAuth(); // (Opcional si usas roles para validar permisos extra)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estados para los datos del formulario ---
  const [observaciones, setObservaciones] = useState('');
  const [fechaFinPrevista, setFechaFinPrevista] = useState('');

  // --- Estados para los catálogos ---
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // "ubicaciones" es el catálogo COMPLETO
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  // "ubicacionesFiltradas" es lo que se muestra en el Select
  const [ubicacionesFiltradas, setUbicacionesFiltradas] = useState<Ubicacion[]>([]);

  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('');

  // --- 1. Cargar Datos Iniciales ---
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [assetsRes, usersRes, ubisRes] = await Promise.all([
          fetch(`${API_URL}/api/activos`, { headers }),
          fetch(`${API_URL}/api/usuarios`, { headers }),
          fetch(`${API_URL}/api/ubicaciones`, { headers })
        ]);

        if (!assetsRes.ok || !usersRes.ok || !ubisRes.ok) {
          throw new Error('Error al cargar datos. Verifica tu conexión o sesión.');
        }

        const assetsData: Asset[] = await assetsRes.json();
        const usersData: User[] = await usersRes.json();
        const ubisData: Ubicacion[] = await ubisRes.json();

        // Filtrar activos disponibles
        const disponibles = assetsData.filter(asset => {
          const esFuncional = asset.estado === 'Bueno' || asset.estado === 'Regular';
          const estaAsignado = asset.asignaciones && asset.asignaciones.some(a => a.estado === 'Activa');
          return esFuncional && !estaAsignado;
        });

        // Filtrar usuarios (Gestores y Usuarios Generales)
        const usuariosAsignables = usersData.filter(u => 
          u.rol === 'Usuario_General' || u.rol === 'Gestor' || u.rol === 'Admin_Depto'
        );

        setAvailableAssets(disponibles);
        setUsers(usuariosAsignables);
        setUbicaciones(ubisData);
        setUbicacionesFiltradas(ubisData); // Inicialmente mostramos todas

        // Selecciones por defecto (Opcional, a veces es mejor dejar en blanco)
        if (disponibles.length > 0) setSelectedAsset(disponibles[0].id_objeto.toString());
        // NO seleccionamos usuario por defecto para obligar al usuario a elegir y disparar el filtro

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, [navigate]);

  // --- 2. Lógica de Filtrado Inteligente (Aquí está la magia) ---
  useEffect(() => {
    // Si no hay usuario seleccionado, reseteamos o mostramos todas (decisión de UX)
    if (!selectedUser) {
      setUbicacionesFiltradas(ubicaciones);
      return;
    }

    const usuarioActual = users.find(u => u.id_usuario === parseInt(selectedUser));

    if (usuarioActual && usuarioActual.id_departamento) {
      // FILTRAR: Solo ubicaciones del mismo departamento
      const filtradas = ubicaciones.filter(u => u.id_departamento === usuarioActual.id_departamento);
      setUbicacionesFiltradas(filtradas);
      
      // Si la ubicación seleccionada antes ya no es válida, la limpiamos
      const ubicacionSigueSiendoValida = filtradas.some(u => u.id_ubicacion.toString() === selectedUbicacion);
      if (!ubicacionSigueSiendoValida) {
        setSelectedUbicacion('');
      }

    } else {
      // Si el usuario NO tiene departamento (ej. un Admin General o caso especial), mostramos TODAS
      setUbicacionesFiltradas(ubicaciones);
    }
  }, [selectedUser, ubicaciones, users]); // Se ejecuta cada vez que cambia el usuario seleccionado

  // --- Manejo del Submit ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Validaciones extra antes de enviar
    if (!selectedAsset || !selectedUser || !selectedUbicacion) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }

    const nuevaAsignacion = {
      id_objeto: parseInt(selectedAsset),
      id_usuario: parseInt(selectedUser),
      idUbicacionInicial: parseInt(selectedUbicacion),
      observaciones: observaciones || null,
      fecha_fin_prevista: fechaFinPrevista ? new Date(fechaFinPrevista) : null,
    };

    try {
      const response = await fetch(`${API_URL}/api/asignaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(nuevaAsignacion),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al crear la asignación.');

      alert('¡Asignación creada exitosamente!');
      navigate('/activos');

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-8 shadow-xl rounded-lg border border-gray-200 mt-10">
      
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-900">Crear Nueva Asignación</h2>
        <Link to="/activos" className="text-sm text-blue-600 hover:underline">
          Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SELECCIÓN DE ACTIVO */}
        <div>
          <label htmlFor="activo" className="block text-sm font-medium text-gray-700">
            Activo Disponible <span className="text-red-500">*</span>
          </label>
          <select id="activo" value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)} required
            className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Selecciona un activo --</option>
            {availableAssets.map(asset => (
              <option key={asset.id_objeto} value={asset.id_objeto}>
                {asset.num_inventario ? `[${asset.num_inventario}]` : '[S/N]'} {asset.nombre}
              </option>
            ))}
          </select>
          {availableAssets.length === 0 && <p className="text-xs text-orange-500 mt-1">No hay activos funcionales disponibles.</p>}
        </div>

        {/* SELECCIÓN DE USUARIO (Dispara el filtro) */}
        <div>
          <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">
            Usuario Responsable <span className="text-red-500">*</span>
          </label>
          <select id="usuario" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} required
            className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Selecciona un usuario --</option>
            {users.map(user => (
              <option key={user.id_usuario} value={user.id_usuario}>
                {user.nombre} ({user.rol})
              </option>
            ))}
          </select>
        </div>

        {/* SELECCIÓN DE UBICACIÓN (Lista Filtrada y Nombre Compuesto) */}
        <div className={`transition-opacity duration-500 ${selectedUser ? 'opacity-100' : 'opacity-50'}`}>
          <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700">
            Ubicación Inicial <span className="text-red-500">*</span>
          </label>
          <select 
            id="ubicacion" 
            value={selectedUbicacion} 
            onChange={(e) => setSelectedUbicacion(e.target.value)} 
            required
            disabled={!selectedUser} // Deshabilitado hasta elegir usuario
            className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">
              {selectedUser 
                ? (ubicacionesFiltradas.length > 0 ? "-- Selecciona una ubicación --" : "No hay ubicaciones para el depto. de este usuario")
                : "-- Primero selecciona un usuario --"}
            </option>
            
            {ubicacionesFiltradas.map(ubi => (
              <option key={ubi.id_ubicacion} value={ubi.id_ubicacion}>
                {/* SOLUCIÓN VISUAL: Nombre Área | Depto - Edificio */}
                {ubi.nombre_area} — {ubi.departamento?.nombre || 'General'} ({ubi.edificio || 'S/N'})
              </option>
            ))}
          </select>
          
          {selectedUser && ubicacionesFiltradas.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Mostrando {ubicacionesFiltradas.length} ubicaciones correspondientes al departamento del usuario.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fechaFinPrevista" className="block text-sm font-medium text-gray-700">Fecha Devolución (Opcional)</label>
            <input type="date" id="fechaFinPrevista" value={fechaFinPrevista} onChange={(e) => setFechaFinPrevista(e.target.value)}
              className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea id="observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={1}
              className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-4 pt-4 border-t">
          <Link to="/activos" className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700">
            Cancelar
          </Link>
          <button type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
            disabled={loading}
          >
            Asignar Activo
          </button>
        </div>
        
      </form>
    </div>
  );
}

export default NuevaAsignacionForm;