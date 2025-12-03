import React, { useState, useEffect, type FC, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import { 
  Search, Plus, Eye, QrCode, Pencil, Trash2, Package, MoreVertical, Wrench,
  CheckCircle, Clock, XCircle, X 
} from 'lucide-react'; 

import AssetLabelPrint from './AssetLabelPrint'; 
import QRCode from 'react-qr-code';
import { API_URL } from '../../config';

// --- Interfaces (Tipos de Datos) ---
interface Departamento { id_departamento: number; nombre: string; }
interface Categoria { id_categoria: number; nombre_categoria: string; }
interface Ubicacion { id_ubicacion: number; nombre_area: string; }

interface Asset {
  id_objeto: number;
  num_inventario: string | null;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  estado: 'Bueno' | 'Regular' | 'Malo' | 'En_Mantenimiento' | 'De_Baja';
  qr_indentificador: string | null;
  imagen_objeto: string | null;
  id_departamento?: number | null;
  // Relaciones
  departamento?: Departamento | null;
  categoria?: Categoria | null;
  ubicacion?: Ubicacion | null;
}

function AssetListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para el Dropdown
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // --- NUEVO ESTADO: Para controlar el Modal de Impresión ---
  const [printingAsset, setPrintingAsset] = useState<Asset | null>(null);

  // --- 1. Cargar Datos ---
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) { logout(); return; }

      try {
        const response = await fetch(`${API_URL}/api/activos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
           if (response.status === 401 || response.status === 403) throw new Error('Token inválido.');
           throw new Error('Error al cargar activos.');
        }

        const data: Asset[] = await response.json();
        setAssets(data);
        setFilteredAssets(data);

      } catch (err: any) {
        console.error("Error fetching assets:", err);
        setError(err.message || "Error de conexión.");
        if (err.message.includes('Token inválido')) logout(); 
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, logout, navigate]);

  // --- 2. Filtros ---
  useEffect(() => {
    let result = assets;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(asset =>
        asset.nombre.toLowerCase().includes(lowerQuery) ||
        (asset.num_inventario && asset.num_inventario.toLowerCase().includes(lowerQuery)) ||
        (asset.marca && asset.marca.toLowerCase().includes(lowerQuery))
      );
    }
    setFilteredAssets(result);
  }, [assets, searchQuery]);

  // --- 3. Helpers ---
  const getStatusBadge = (estado: string) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit whitespace-nowrap";
    switch (estado) {
      case 'Bueno': return <span className={`${baseClasses} bg-green-100 text-green-800`}><CheckCircle size={14} /> Operativo</span>;
      case 'Regular': return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}><Clock size={14} /> Operativo (Desgaste)</span>;
      case 'Malo': return <span className={`${baseClasses} bg-red-100 text-red-800`}><XCircle size={14} /> Requiere Baja</span>;
      case 'En_Mantenimiento': return <span className={`${baseClasses} bg-blue-100 text-blue-800`}><Wrench size={14} /> En Servicio</span>;
      case 'De_Baja': return <span className={`${baseClasses} bg-gray-100 text-gray-700`}><Trash2 size={14} /> Dado de Baja</span>;
      default: return <span className={`${baseClasses} bg-gray-200 text-gray-600`}>{estado}</span>;
    }
  };

  // --- 4. Manejadores ---
  const handleCreate = () => navigate('/nuevo-activo');
  
  const handleRetire = async (id: number, nombre: string) => {
    if (!window.confirm(`⚠️ CONFIRMACIÓN: ¿Estás seguro de dar de BAJA permanentemente el activo "${nombre}"?`)) return;
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_URL}/api/activos/${id}/baja`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error.');
      setAssets(prev => prev.map(a => a.id_objeto === id ? { ...a, estado: 'De_Baja' } : a));
      alert(`Activo ${nombre} dado de baja.`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // MODIFICADO: Ahora esto abre el modal
  const handlePrintQr = (asset: Asset) => {
    setOpenDropdownId(null); // Cerrar dropdown
    setPrintingAsset(asset); // Abrir modal con este activo
  };

  // --- Renderizado ---
  if (loading) return <div className="p-8 text-center text-gray-500">Cargando activos...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">Error: {error}</div>;

  return (
    <div className="space-y-6 p-6 font-sans text-slate-800 relative">
      
      {/* Header y Buscador (Igual que antes) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario General</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de activos fijos</p>
        </div>
        <button onClick={handleCreate} className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white text-md font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
          <Plus size={20} className="mr-2" /> Nuevo Activo
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
        <div className="relative max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Buscar en ${filteredAssets.length} activos...`}
            className="block w-full pl-11 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla con la corrección del Dropdown */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden pb-40">
        <div className="overflow-x-auto min-h-[400px] pb-40">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Activo</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Inventario / QR</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredAssets.map((asset, index) => {
                    
                    const isLastItems = filteredAssets.length > 4 && index >= filteredAssets.length - 2;

                    return (
                        <tr key={asset.id_objeto} className="hover:bg-blue-50/50 transition-colors">
                            {/* COLUMNA 1: Activo Principal */}
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                                        {asset.imagen_objeto ? (
                                            <img className="h-10 w-10 object-cover" src={asset.imagen_objeto} alt={asset.nombre} onError={(e) => (e.currentTarget.src = `https://placehold.co/40x40/f1f1f1/888?text=${asset.nombre.charAt(0)}`)} />
                                        ) : <Package size={20} className="text-gray-400" />}
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-base font-semibold text-gray-900 truncate max-w-[200px]" title={asset.nombre}>{asset.nombre}</div>
                                        <div className="text-xs text-gray-500">{asset.marca || '-'} {asset.modelo && `(${asset.modelo})`}</div>
                                    </div>
                                </div>
                            </td>

                            {/* COLUMNA 2: Inventario / QR (Con Vista Previa Real al Hover) */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {/* Badge del Número de Inventario */}
                                <span className="text-sm font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                  {asset.num_inventario || 'N/A'}
                                </span>
                                
                                {/* Lógica del QR Real */}
                                {asset.qr_indentificador && (
                                    <div className="relative group flex items-center justify-center">
                                        
                                        {/* 1. El icono que se ve siempre (Gatillo) */}
                                        <div className="cursor-help p-1 rounded-md hover:bg-gray-100 transition-colors">
                                            <QrCode size={18} className="text-gray-400 group-hover:text-blue-600" />
                                        </div>
                                        
                                        {/* 2. El QR REAL Flotante (Aparece solo al pasar el mouse) */}
                                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center p-3 bg-white shadow-2xl border border-gray-200 rounded-xl z-[60] w-36 animate-in fade-in zoom-in duration-200">
                                            <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Escanea aquí</div>
                                            
                                            {/* Aquí generamos el SVG REAL del activo */}
                                            <div className="bg-white p-1 border border-gray-100 rounded-lg">
                                                <QRCode 
                                                    // Usamos window.location.origin para generar una URL válida automáticamente
                                                    value={`${window.location.origin}/activo/qr/${asset.qr_indentificador}`}
                                                    size={100}
                                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                    viewBox={`0 0 256 256`}
                                                />
                                            </div>
                                            
                                            <span className="text-[10px] font-mono text-gray-500 mt-2 text-center break-all bg-gray-50 px-2 py-1 rounded w-full">
                                                {asset.qr_indentificador}
                                            </span>

                                            {/* Pequeño triángulo decorativo abajo del tooltip */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 border-8 border-transparent border-t-white drop-shadow-sm"></div>
                                        </div>
                                    </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 mt-1 block">{asset.categoria?.nombre_categoria || 'Sin Categoría'}</span>
                            </td>

                            {/* COLUMNA 3: Ubicación */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <div className="flex flex-col">
                                    <span className="font-semibold">{asset.ubicacion?.nombre_area || 'Sin Asignar'}</span>
                                    <span className="text-xs text-gray-500">{asset.departamento?.nombre || 'General'}</span>
                                </div>
                            </td>

                            {/* COLUMNA 4: Estado */}
                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(asset.estado)}</td>

                            {/* COLUMNA 5: ACCIONES (Dropdown Corregido) */}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                <div className="relative inline-block text-left">
                                    <button 
                                        onClick={() => setOpenDropdownId(openDropdownId === asset.id_objeto ? null : asset.id_objeto)}
                                        className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors focus:outline-none"
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                    
                                    {openDropdownId === asset.id_objeto && (
                                        <div 
                                            className={`absolute right-0 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-[60] ring-1 ring-black ring-opacity-5 
                                            ${isLastItems 
                                                ? 'bottom-full mb-2 origin-bottom-right' // Solo hacia arriba si hay muchos elementos
                                                : 'mt-2 origin-top-right'                // Por defecto hacia abajo
                                            }`}
                                            onBlur={() => setOpenDropdownId(null)} 
                                        >
                                            <div className="py-1">
                                                <LinkAction to={`/activo/${asset.id_objeto}`} label="Ver Detalles" icon={<Eye size={16} />} />
                                                <LinkAction to={`/activo/${asset.id_objeto}/editar`} label="Editar Información" icon={<Pencil size={16} />} onClick={() => setOpenDropdownId(null)} />
                                                <ActionButton onClick={() => handlePrintQr(asset)} label="Imprimir Etiqueta QR" icon={<QrCode size={16} />} />
                                                
                                                {asset.estado !== 'De_Baja' && (
                                                    <div className="border-t border-gray-100 my-1">
                                                        <ActionButton onClick={() => { setOpenDropdownId(null); handleRetire(asset.id_objeto, asset.nombre); }} label="Dar de Baja" icon={<Trash2 size={16} />} color="text-red-600 hover:bg-red-50" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DE IMPRESIÓN --- */}
      {printingAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Cabecera del Modal */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <QrCode className="text-blue-600" size={20}/> 
                Imprimir Etiqueta
              </h3>
              <button 
                onClick={() => setPrintingAsset(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido: Tu componente AssetLabelPrint */}
            <div className="p-6 flex flex-col items-center bg-gray-50/50">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Vista previa de la etiqueta para: <br/>
                <span className="font-bold text-gray-800">{printingAsset.nombre}</span>
              </p>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <AssetLabelPrint 
                  asset={printingAsset} 
                  onPrint={() => {
                    // Opcional: Cerrar modal después de imprimir si quieres
                    // setPrintingAsset(null); 
                  }} 
                />
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t border-gray-100">
                Asegúrate de permitir ventanas emergentes.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Componentes Auxiliares ---
const LinkAction: FC<{ to: string, label: string, icon: ReactElement, onClick?: () => void }> = ({ to, label, icon, onClick }) => (
    <Link to={to} onClick={onClick} className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'mr-3 text-gray-400 group-hover:text-blue-600' })}
        {label}
    </Link>
);

const ActionButton: FC<{ onClick: () => void, label: string, icon: ReactElement, color?: string }> = ({ onClick, label, icon, color = 'text-gray-700 hover:bg-blue-50' }) => (
    <button onClick={onClick} className={`group flex w-full items-center px-4 py-2 text-sm ${color} transition-colors text-left`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: `mr-3 text-gray-400 ${color.includes('red') ? 'group-hover:text-red-600' : 'group-hover:text-blue-600'}` })}
        {label}
    </button>
);

export default AssetListPage;