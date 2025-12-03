import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Wrench, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { API_URL } from '../../config';

// Actualizamos la interfaz para leer las asignaciones (para saber si está ocupado)
interface Asset {
  id_objeto: number;
  nombre: string;
  num_inventario: string | null;
  estado: string;
  asignaciones?: { estado: string }[]; // Necesario para saber si está ocupado
}

function NuevoMantenimientoForm() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Estados del formulario
  const [activos, setActivos] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [tipo, setTipo] = useState<'Preventivo' | 'Correctivo'>('Preventivo');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]); 
  const [tecnico, setTecnico] = useState('');
  const [costo, setCosto] = useState('');
  const [formError, setFormError] = useState('');

  // Cargar activos
  useEffect(() => {
    const fetchAssets = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { logout(); return; }
      try {
        // La API de activos DEBE devolver las asignaciones activas (check en backend)
        const response = await fetch(`${API_URL}/api/activos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data: Asset[] = await response.json();
          
          // --- FILTRO ACTUALIZADO (Lógica de Negocio) ---
          const candidatosMantenimiento = data.filter((asset) => {
            // 1. Descartar los que ya están dados de baja
            const esDeBaja = asset.estado === 'De_Baja';
            
            // 2. Descartar los que YA ESTÁN en mantenimiento
            const yaEnMantenimiento = asset.estado === 'En_Mantenimiento';

            // 3. Descartar los que están asignados (Usuario debe devolverlo primero)
            const estaAsignado = asset.asignaciones?.some(a => a.estado === 'Activa');

            // El activo aparece SOLO SI: No es baja Y No está en mtto Y No está asignado
            return !esDeBaja && !yaEnMantenimiento && !estaAsignado;
          });
          // ----------------------------------------------

          setActivos(candidatosMantenimiento);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!selectedAssetId) {
      setFormError("Por favor selecciona un activo.");
      return;
    }

    const token = localStorage.getItem('authToken');
    try {
      // Nota: El backend cambiará el estado a 'En_Mantenimiento' al recibir esto.
      const response = await fetch(`${API_URL}/api/activos/${selectedAssetId}/mantenimientos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo,
          descripcion_problema: descripcion,
          fecha_inicio: new Date(fechaInicio),
          nombre_tecnico: tecnico || null,
          costo: costo ? parseFloat(costo) : null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al registrar mantenimiento');
      }

      alert('Mantenimiento registrado correctamente. El estado del activo ha cambiado.');
      navigate('/mantenimiento'); // Redirige a la lista de mantenimientos

    } catch (error: any) {
      setFormError(error.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Wrench className="mr-2 text-blue-600" /> Registrar Mantenimiento
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Solo se muestran activos disponibles en almacén que requieren servicio.
          </p>
        </div>
        <Link to="/mantenimiento" className="text-blue-600 hover:underline text-sm flex items-center">
          <ArrowLeft size={16} className="mr-1"/> Volver
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Selección de Activo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Activo en Almacén</label>
            <select 
              value={selectedAssetId} 
              onChange={e => setSelectedAssetId(e.target.value)} 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar Activo...</option>
              {activos.length === 0 && <option disabled>No hay activos disponibles para mantenimiento</option>}
              {activos.map(a => (
                <option key={a.id_objeto} value={a.id_objeto}>
                  {a.nombre} ({a.num_inventario || 'S/N'}) - {a.estado.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Servicio</label>
              <select 
                value={tipo} 
                onChange={e => setTipo(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Preventivo">Preventivo (Limpieza, Revisión)</option>
                <option value="Correctivo">Correctivo (Reparación de fallas)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
              <input 
                type="date" 
                value={fechaInicio} 
                onChange={e => setFechaInicio(e.target.value)} 
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción del Problema / Servicio</label>
            <textarea 
              value={descripcion} 
              onChange={e => setDescripcion(e.target.value)} 
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe detalladamente la falla o el trabajo a realizar..."
            />
          </div>

          {/* Técnico y Costo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md border border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700">Técnico / Proveedor</label>
              <input 
                type="text" 
                value={tecnico} 
                onChange={e => setTecnico(e.target.value)} 
                placeholder="Ej. Soporte Interno, Dell Service..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Costo Estimado (MXN)</label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costo}
                  onChange={e => setCosto(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pl-7 px-3 py-2 border focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Mensajes de Advertencia */}
          <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <p className="text-sm text-blue-700">
              Al iniciar el mantenimiento, el estado del activo cambiará a <strong>"En Mantenimiento"</strong> y no estará disponible para asignación.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600 text-center">
              {formError}
            </div>
          )}

          <div className="pt-4 border-t flex justify-end">
            <button type="submit" className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors">
              <Save className="mr-2 h-4 w-4"/> Guardar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NuevoMantenimientoForm;