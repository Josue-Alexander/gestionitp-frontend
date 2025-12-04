import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QRCode from "react-qr-code";
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Edit, Trash2, Image as ImageIcon, Pencil, Printer } from 'lucide-react';
import AssetLabelPrint from './AssetLabelPrint';
import './AssetLabelPrint.css';
import { API_URL } from '../../config';

// --- Interfaz Actualizada ---
interface AssetDto {
  id_objeto: number;
  num_inventario: string | null;
  nombre: string;
  nombre_generico: string | null;
  marca: string | null;
  modelo: string | null;
  no_serie: string | null;
  estado: 'Bueno' | 'Regular' | 'Malo' | 'En_Mantenimiento' | 'De_Baja';
  observaciones: string | null;
  fecha_de_registro: string | null;
  descripcion_adquisicion: string | null;
  // --- NUEVO CAMPO ---
  costo_adquisicion?: number | string | null; 
  // -------------------
  imagen_objeto: string | null;
  qr_indentificador: string | null;
  departamento?: { id_departamento: number; nombre: string } | null;
  categoria?: { id_categoria: number; nombre_categoria: string } | null;
  ubicacion?: { id_ubicacion: number; nombre_area: string; piso?: string | null; edificio?: string | null } | null;
}

function AssetDetail() {
  const [asset, setAsset] = useState<AssetDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id, qrId } = useParams<{ id?: string; qrId?: string }>();

  // --- Lógica de Carga ---
  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/login'); return; }

      let apiUrl = '';
      if (id) apiUrl = `${API_URL}/api/activos/${id}`;
      else if (qrId) apiUrl = `${API_URL}/api/activos/qr/${qrId}`;
      else { setError("ID o QR ID no proporcionado."); setLoading(false); return; }

      try {
        const response = await fetch(apiUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          if (response.status === 404) throw new Error("Activo no encontrado.");
          throw new Error(`Error ${response.status}`);
        }
        const data: AssetDto = await response.json();
        setAsset(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar.");
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id, qrId, navigate]);

  // --- Lógica de Impresión ---
  useEffect(() => {
    const handleBeforePrint = () => {
      document.body.classList.add('printing-label');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-label');
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('printing-label');
    };
  }, []);

  const handlePrintLabel = () => {
    window.print();
  };

  // --- Lógica de Baja ---
  const handleRetireAsset = async () => {
    if (!asset) return;
    if (window.confirm(`¿Estás seguro de que quieres dar de baja el activo "${asset.nombre}"?`)) {
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/login'); return; }
      try {
        const response = await fetch(`${API_URL}/api/activos/${asset.id_objeto}/baja`, {
            method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Error al dar de baja.');
        alert('Activo dado de baja correctamente.');
        navigate('/activos');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const getStatusClasses = (estado: string) => {
    const baseClasses = "px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border";
    switch (estado) {
      case 'Bueno': return `${baseClasses} bg-green-100 text-green-800 border-green-200`;
      case 'Regular': return `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`;
      case 'Malo': return `${baseClasses} bg-red-100 text-red-800 border-red-200`;
      case 'En_Mantenimiento': return `${baseClasses} bg-blue-100 text-blue-800 border-blue-200`;
      case 'De_Baja': return `${baseClasses} bg-gray-100 text-gray-700 border-gray-200`;
      default: return baseClasses;
    }
  };
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return 'Fecha inválida'; }
  };

  // Helper para moneda
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (!amount) return 'No registrado';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(amount));
  };

  if (loading) return <p className="text-center text-gray-500 p-8">Cargando detalles del activo...</p>;
  if (error) return <p className="text-center text-red-500 p-8">Error: {error}</p>;
  if (!asset) return <p className="text-center text-gray-500 p-8">Activo no encontrado.</p>;

  const canManage = user?.role === 'Admin_General' || user?.role === 'Admin_Depto' || user?.role === 'Gestor';

  return (
    <div className="asset-detail-container space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <Link to="/activos" className="flex items-center text-sm text-blue-600 hover:underline mb-2">
            <ArrowLeft size={14} className="mr-1" />
            Volver a la lista de activos
          </Link>
          <h2 className="text-3xl font-bold text-gray-800">{asset.nombre}</h2>
        </div>
        {canManage && (
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate(`/activo/${asset.id_objeto}/editar`)}
              className="flex items-center bg-white text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Pencil size={16} className="mr-2" /> Editar
            </button>
            {asset.estado !== 'De_Baja' && (
              <button 
                onClick={handleRetireAsset}
                className="flex items-center bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors shadow-sm"
              >
                <Trash2 size={16} className="mr-2" /> Dar de Baja
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Medios y Etiquetas */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Imagen */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Imagen</h3>
            {asset.imagen_objeto ? (
              <img
                src={asset.imagen_objeto}
                alt={`Imagen de ${asset.nombre}`}
                className="w-full h-auto rounded-md border border-gray-200"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 h-48 bg-gray-50 rounded-md border">
                <ImageIcon size={40} />
                <p className="mt-2 text-sm">Sin imagen registrada</p>
              </div>
            )}
          </div>
          
          {/* Código QR y Etiqueta */}
          {asset.qr_indentificador && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200" id="qr">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Código QR</h3>
              <div className="bg-white p-4 rounded-md flex justify-center">
                <QRCode
                  value={`${window.location.origin}/activo/qr/${asset.qr_indentificador}`}
                  size={200}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2 break-all">
                {asset.qr_indentificador}
              </p>

              {/* Etiqueta de Impresión */}
              {canManage && (
                <>
                  <hr className="my-4 border-gray-200" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Etiqueta (Vista Previa)</h3>
                  
                  <div className="flex justify-center">
                    <AssetLabelPrint asset={asset} />
                  </div>
                
                </>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Detalles */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            
            <dt className="text-sm font-medium text-gray-500">ID Objeto</dt>
            <dd className="text-sm text-gray-900 font-medium">{asset.id_objeto}</dd>

            <dt className="text-sm font-medium text-gray-500">Núm. Inventario</dt>
            <dd className="text-sm text-gray-900 font-mono">{asset.num_inventario || 'N/A'}</dd>

            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="text-sm">
               <span className={getStatusClasses(asset.estado)}>
                 {asset.estado.replace('_', ' ')}
               </span>
            </dd>

            <dt className="text-sm font-medium text-gray-500">Fecha de Registro</dt>
            <dd className="text-sm text-gray-900">{formatDate(asset.fecha_de_registro)}</dd>

            <div className="col-span-1 sm:col-span-2 mt-4 pt-4 border-t">
              <h4 className="text-base font-semibold text-gray-800">Especificaciones</h4>
            </div>

            <dt className="text-sm font-medium text-gray-500">Nombre Genérico</dt>
            <dd className="text-sm text-gray-900">{asset.nombre_generico || 'N/A'}</dd>

            <dt className="text-sm font-medium text-gray-500">Marca</dt>
            <dd className="text-sm text-gray-900">{asset.marca || 'N/A'}</dd>
            
            <dt className="text-sm font-medium text-gray-500">Modelo</dt>
            <dd className="text-sm text-gray-900">{asset.modelo || 'N/A'}</dd>

            <dt className="text-sm font-medium text-gray-500">No. Serie</dt>
            <dd className="text-sm text-gray-900">{asset.no_serie || 'N/A'}</dd>

            <div className="col-span-1 sm:col-span-2 mt-4 pt-4 border-t">
              <h4 className="text-base font-semibold text-gray-800">Clasificación y Adquisición</h4>
            </div>

            <dt className="text-sm font-medium text-gray-500">Departamento (Dueño)</dt>
            <dd className="text-sm text-gray-900">{asset.departamento?.nombre || 'N/A'}</dd>

            <dt className="text-sm font-medium text-gray-500">Categoría</dt>
            <dd className="text-sm text-gray-900">{asset.categoria?.nombre_categoria || 'N/A'}</dd>

            <dt className="text-sm font-medium text-gray-500">Ubicación (Resguardo)</dt>
            <dd className="text-sm text-gray-900">{asset.ubicacion?.nombre_area || 'N/A'}</dd>

            <dt className="text-sm font-medium text-gray-500">Descripción Adquisición</dt>
            <dd className="text-sm text-gray-900">{asset.descripcion_adquisicion || 'N/A'}</dd>

            {/* --- NUEVO CAMPO: COSTO DE ADQUISICIÓN --- */}
            <dt className="text-sm font-medium text-gray-500">Costo de Adquisición</dt>
            <dd className="text-sm text-gray-900 font-medium text-green-700">
              {formatCurrency(asset.costo_adquisicion)}
            </dd>
            {/* ---------------------------------------- */}

            <div className="col-span-1 sm:col-span-2 mt-4 pt-4 border-t">
              <h4 className="text-base font-semibold text-gray-800">Observaciones</h4>
            </div>
            <dd className="col-span-1 sm:col-span-2 text-sm text-gray-900">
              {asset.observaciones || 'Ninguna'}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default AssetDetail;