import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  History, User, Box, Search, Calendar, Filter, 
  ArrowRightCircle, CheckCircle, AlertTriangle, PlusCircle, XCircle 
} from 'lucide-react';
import { API_URL } from '../../config';

// --- Interfaces ---
interface Evento {
  id_evento: number;
  fecha_evento: string;
  tipo_evento: string;
  id_referencia: number | null;
  usuario: { nombre: string; email: string };
  activo: { nombre: string; num_inventario: string | null };
}

function BitacoraPage() {
  const { logout } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [filteredEventos, setFilteredEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Filtros ---
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('TODOS');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // --- Cargar Datos ---
  useEffect(() => {
    const fetchBitacora = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { logout(); return; }
      try {
        const response = await fetch(`${API_URL}/api/bitacora`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setEventos(data);
          setFilteredEventos(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBitacora();
  }, []);

  // --- Lógica de Filtrado ---
  useEffect(() => {
    let result = eventos;

    // 1. Búsqueda de Texto (Nombre de usuario, activo o inventario)
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(e => 
        e.usuario.nombre.toLowerCase().includes(lower) || 
        e.activo.nombre.toLowerCase().includes(lower) ||
        (e.activo.num_inventario && e.activo.num_inventario.toLowerCase().includes(lower))
      );
    }

    // 2. Filtro por Categoría de Evento
    if (filterCategory !== 'TODOS') {
      result = result.filter(e => e.tipo_evento === filterCategory);
    }

    // 3. Filtro por Fechas
    if (dateStart) {
      result = result.filter(e => new Date(e.fecha_evento) >= new Date(dateStart));
    }
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59);
      result = result.filter(e => new Date(e.fecha_evento) <= endDate);
    }

    setFilteredEventos(result);
  }, [search, filterCategory, dateStart, dateEnd, eventos]);

  // --- Helpers para "Humanizar" la información ---

  // Traduce el código de la BD a texto legible
  const getEventLabel = (tipo: string) => {
    switch (tipo) {
      case 'CREACION_ACTIVO': return 'Alta de Activo';
      case 'INICIO_ASIGNACION': return 'Préstamo / Asignación';
      case 'FIN_ASIGNACION': return 'Devolución de Equipo';
      case 'REGISTRO_MANTENIMIENTO': return 'Mantenimiento';
      case 'TRANSFERENCIA_ACTIVO': return 'Baja o Transferencia';
      case 'CAMBIO_UBICACION_PRINCIPAL': return 'Cambio de Ubicación';
      default: return tipo.replace('_', ' ');
    }
  };

  // Asigna un icono y color según el tipo de evento
  const getEventStyle = (tipo: string) => {
    if (tipo.includes('CREACION')) return { icon: <PlusCircle size={16} />, color: 'text-green-700 bg-green-50 border-green-200' };
    if (tipo.includes('INICIO_ASIGNACION')) return { icon: <ArrowRightCircle size={16} />, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (tipo.includes('FIN_ASIGNACION')) return { icon: <CheckCircle size={16} />, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (tipo.includes('MANTENIMIENTO')) return { icon: <AlertTriangle size={16} />, color: 'text-orange-700 bg-orange-50 border-orange-200' };
    if (tipo.includes('BAJA')) return { icon: <XCircle size={16} />, color: 'text-red-700 bg-red-50 border-red-200' };
    return { icon: <History size={16} />, color: 'text-gray-700 bg-gray-50 border-gray-200' };
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando historial...</div>;

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <History className="mr-3 text-blue-600" /> 
          Bitácora de Auditoría
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Historial completo de movimientos. Filtra para encontrar eventos específicos.
        </p>
      </div>

      {/* --- BARRA DE FILTROS MEJORADA --- */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
        {/* Buscador */}
        <div className="md:col-span-5">
          <label className="block text-xs font-medium text-gray-500 mb-1">Buscar (Persona o Activo)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Ej. Laptop Dell, Juan Pérez..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filtro de Tipo */}
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Acción</label>
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
             <select 
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
               value={filterCategory}
               onChange={e => setFilterCategory(e.target.value)}
             >
               <option value="TODOS">Todas las Acciones</option>
               <option value="CREACION_ACTIVO">Altas de Activos</option>
               <option value="INICIO_ASIGNACION">Préstamos / Asignaciones</option>
               <option value="FIN_ASIGNACION">Devoluciones</option>
               <option value="REGISTRO_MANTENIMIENTO">Mantenimientos</option>
               <option value="TRANSFERENCIA_ACTIVO">Bajas</option>
             </select>
          </div>
        </div>

        {/* Filtro de Fechas */}
        <div className="md:col-span-4 flex gap-2">
           <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={dateStart} onChange={e => setDateStart(e.target.value)} />
           </div>
           <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
           </div>
        </div>
      </div>

      {/* --- TABLA MEJORADA --- */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Fecha y Hora</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Acción</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Usuario Responsable</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Activo Involucrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredEventos.map((evt) => {
                const style = getEventStyle(evt.tipo_evento);
                return (
                  <tr key={evt.id_evento} className="hover:bg-gray-50 transition-colors">
                    
                    {/* Fecha */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2 text-gray-400"/>
                        <span className="font-mono">{new Date(evt.fecha_evento).toLocaleString('es-MX')}</span>
                      </div>
                    </td>

                    {/* Acción (Con Badge bonito) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.color}`}>
                        <span className="mr-1.5">{style.icon}</span>
                        {getEventLabel(evt.tipo_evento)}
                      </span>
                    </td>

                    {/* Usuario (Nombre y Email) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-3">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{evt.usuario.nombre}</div>
                          <div className="text-xs text-gray-500">{evt.usuario.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Activo (Nombre y Num Inventario) - SIN IDs confusos */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                          <Box size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{evt.activo.nombre}</div>
                          <div className="text-xs text-gray-500 font-mono bg-gray-100 px-1 rounded inline-block">
                            {evt.activo.num_inventario || 'S/N'}
                          </div>
                        </div>
                      </div>
                    </td>

                  </tr>
                );
              })}
              
              {filteredEventos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={32} className="mb-2 text-gray-300" />
                      <p>No se encontraron eventos con los filtros seleccionados.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer de tabla */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
            <span>Mostrando {filteredEventos.length} registros</span>
            {/* Aquí podrías añadir paginación en el futuro */}
        </div>
      </div>
    </div>
  );
}

export default BitacoraPage;