import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, DollarSign, AlertTriangle, FileText, Table as TableIcon, 
  RefreshCw, TrendingUp, Building2, Activity, Clock, Wrench, Package 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { API_URL } from '../../config';

// --- Colores para Gráficas ---
const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8884d8', '#82ca9d'];

// --- Interfaces de Datos ---
interface ResumenEstado { estado: string; total: number; }
interface ValorInventario { total_activos: number; valor_total: number; }
interface CostoCategoria { categoria: string; costo_total: number; total_fallas: number; }
interface ActivoRiesgo { 
  id_objeto: number; 
  nombre: string; 
  num_inventario: string; 
  fecha_de_registro: string; 
  total_fallas: number; 
}
interface Departamento { id_departamento: number; nombre: string; }

function ReportsPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Estados de Datos
  const [resumenEstado, setResumenEstado] = useState<ResumenEstado[]>([]);
  const [valorInventario, setValorInventario] = useState<ValorInventario | null>(null);
  const [costos, setCostos] = useState<CostoCategoria[]>([]);
  const [activosRiesgo, setActivosRiesgo] = useState<ActivoRiesgo[]>([]);

  // Estados de Filtro
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [selectedDeptoId, setSelectedDeptoId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- Helpers ---
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN' 
  }).format(val);
  
  const isAdminGen = user?.role === 'Admin_General';
  const deptoContextId = user?.role !== 'Admin_General' ? user?.id_departamento : undefined;
  
  const getReportTitle = () => {
    if (selectedDeptoId) {
      const depto = departamentos.find(d => d.id_departamento.toString() === selectedDeptoId);
      return `Reporte de ${depto?.nombre || 'Departamento'}`;
    }
    return isAdminGen ? "Reporte Global Institucional" : "Reporte de mi Departamento";
  };

  // --- 1. Cargar Departamentos (Solo Admin General) ---
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (isAdminGen && token) {
      const fetchDeptos = async () => {
        try {
          const res = await fetch(`${API_URL}/api/departamentos`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
          });
          if (res.ok) {
            setDepartamentos(await res.json());
          }
        } catch (e) { 
          console.error("Error al cargar departamentos:", e); 
        }
      };
      fetchDeptos();
    }
  }, [user, isAdminGen]);

  // --- 2. Cargar Reportes (Función Principal) ---
  const fetchReports = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) { 
      logout(); 
      return; 
    }
    
    const deptoFilter = isAdminGen ? selectedDeptoId : deptoContextId;

    // Construcción de Query Params
    const params = new URLSearchParams();
    if (deptoFilter) params.append('deptoId', deptoFilter.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';

    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const [resEstado, resValor, resCostos, resRiesgo] = await Promise.all([
        fetch(`${API_URL}/api/reportes/resumen-por-estado${query}`, { headers }),
        fetch(`${API_URL}/api/reportes/valor-inventario${query}`, { headers }),
        fetch(`${API_URL}/api/reportes/costos-por-categoria${query}`, { headers }),
        fetch(`${API_URL}/api/reportes/riesgo-operativo${query}`, { headers }), 
      ]);

      if (resEstado.ok) setResumenEstado(await resEstado.json());
      if (resValor.ok) setValorInventario(await resValor.json());
      if (resCostos.ok) setCostos(await resCostos.json());
      if (resRiesgo.ok) setActivosRiesgo(await resRiesgo.json());
      
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recargar reportes cuando cambian los filtros
  useEffect(() => {
    fetchReports();
  }, [selectedDeptoId, startDate, endDate]);

  // --- Exportación a PDF ---
  const exportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const title = getReportTitle();
      const fecha = new Date().toLocaleDateString('es-MX');

      // Encabezado
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de generación: ${fecha}`, 14, 28);

      // 1. Tabla de Resumen por Estado
      if (resumenEstado.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Distribución por Estado', 14, 40);
        
        autoTable(doc, {
          startY: 45,
          head: [['Estado', 'Cantidad']],
          body: resumenEstado.map(r => [r.estado, r.total.toString()]),
          theme: 'grid',
          headStyles: { fillColor: [99, 102, 241] }
        });
      }

      // 2. Valor de Inventario
      if (valorInventario) {
        const finalY = (doc as any).lastAutoTable.finalY || 45;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Valor Total del Inventario', 14, finalY + 15);
        
        autoTable(doc, {
          startY: finalY + 20,
          head: [['Total Activos', 'Valor Total']],
          body: [[
            valorInventario.total_activos.toString(), 
            formatCurrency(valorInventario.valor_total)
          ]],
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] }
        });
      }

      // 3. Tabla de Riesgo Operativo
      if (activosRiesgo.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY || 80;
        doc.addPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Activos de Riesgo Operativo', 14, 20);
        
        const dataConRiesgo = activosRiesgo.map(a => {
          const registroDate = new Date(a.fecha_de_registro);
          const diffTime = Math.abs(new Date().getTime() - registroDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const anios = Math.floor(diffDays / 365.25);
          
          return [
            a.nombre,
            a.num_inventario,
            `${anios} años`,
            a.total_fallas.toString()
          ];
        });

        autoTable(doc, {
          startY: 25,
          head: [['Activo', 'No. Inventario', 'Antigüedad', 'Fallas']],
          body: dataConRiesgo,
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68] }
        });
      }

      doc.save(`reporte_${fecha.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Verifica la consola.');
    } finally {
      setIsExporting(false);
    }
  };

  // --- Exportación a Excel ---
  const exportExcel = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Hoja 1: Resumen por Estado
      if (resumenEstado.length > 0) {
        const wsEstado = XLSX.utils.json_to_sheet(
          resumenEstado.map(r => ({ Estado: r.estado, Total: r.total }))
        );
        XLSX.utils.book_append_sheet(wb, wsEstado, 'Resumen Estado');
      }

      // Hoja 2: Costos por Categoría
      if (costos.length > 0) {
        const wsCostos = XLSX.utils.json_to_sheet(
          costos.map(c => ({ 
            Categoría: c.categoria, 
            'Costo Total': c.costo_total,
            'Total Fallas': c.total_fallas 
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsCostos, 'Costos Mantenimiento');
      }

      // Hoja 3: Activos de Riesgo
      if (activosRiesgo.length > 0) {
        const dataConRiesgo = activosRiesgo.map(a => {
          const registroDate = new Date(a.fecha_de_registro);
          const diffTime = Math.abs(new Date().getTime() - registroDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const anios = Math.floor(diffDays / 365.25);
          
          return {
            'ID': a.id_objeto,
            'Nombre': a.nombre,
            'No. Inventario': a.num_inventario,
            'Antigüedad (años)': anios,
            'Total Fallas': a.total_fallas
          };
        });
        
        const wsRiesgo = XLSX.utils.json_to_sheet(dataConRiesgo);
        XLSX.utils.book_append_sheet(wb, wsRiesgo, 'Riesgo Operativo');
      }

      const fecha = new Date().toLocaleDateString('es-MX').replace(/\//g, '-');
      XLSX.writeFile(wb, `reporte_estrategico_${fecha}.xlsx`);
    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error al generar el archivo Excel. Verifica la consola.');
    } finally {
      setIsExporting(false);
    }
  };

  // --- Componente de Tabla Unificada ---
  const TablaRiesgoOperativo = () => {
    const dataConRiesgo = useMemo(() => {
      return activosRiesgo.map(a => {
        const registroDate = new Date(a.fecha_de_registro);
        const diffTime = Math.abs(new Date().getTime() - registroDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const anios = Math.floor(diffDays / 365.25);
        
        const riesgoAntiguedad = anios >= 5;
        const riesgoFallas = a.total_fallas >= 2;
        
        let score = 0;
        if (riesgoAntiguedad) score += 2; 
        if (riesgoFallas) score += a.total_fallas; 

        return {
          ...a,
          antiguedad: anios,
          riesgo_score: score,
          es_foco_rojo: score >= 4, 
          motivo_riesgo: (riesgoAntiguedad ? 'Antigüedad' : '') + 
                        (riesgoFallas ? (riesgoAntiguedad ? ' y Fallas' : 'Fallas') : 'Bajo')
        };
      }).sort((a, b) => b.riesgo_score - a.riesgo_score);
    }, [activosRiesgo]);

    if (dataConRiesgo.length === 0) {
      return (
        <p className="text-center p-6 text-gray-500">
          No se encontraron activos con riesgo en este período/departamento.
        </p>
      );
    }

    return (
      <div className="overflow-auto border rounded-lg max-h-96">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">
                Activo (No. Inv.)
              </th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">
                Antigüedad
              </th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">
                Fallas Totales
              </th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">
                Score Riesgo
              </th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">
                Recomendación
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {dataConRiesgo.map((a) => (
              <tr 
                key={a.id_objeto} 
                className={a.es_foco_rojo ? 'bg-red-50/50' : 'hover:bg-gray-50'}
              >
                <td className="px-4 py-3 font-medium text-sm">
                  {a.nombre}<br />
                  <span className="text-gray-400 text-xs">{a.num_inventario}</span>
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <span className={a.antiguedad >= 5 ? 'font-bold text-amber-700' : 'text-gray-600'}>
                    {a.antiguedad} años
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm font-bold text-red-600">
                  {a.total_fallas}
                </td>
                <td className="px-4 py-3 text-center text-sm font-extrabold">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    a.es_foco_rojo ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                  }`}>
                    {a.riesgo_score}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {a.es_foco_rojo ? 'Evaluar reemplazo o baja' : 'Monitoreo normal'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // --- Renderizado Principal ---
  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800">
      
      {/* Header y Controles */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Inteligencia (BI)</h1>
          <p className="text-gray-600 mt-1 text-sm">{getReportTitle()}</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
          {/* Selector de Departamento (Admin General) */}
          {isAdminGen && (
            <div className="relative flex-grow xl:flex-grow-0">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Building2 className="h-4 w-4 text-gray-500" />
              </div>
              <select
                value={selectedDeptoId}
                onChange={(e) => setSelectedDeptoId(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm w-full"
              >
                <option value="">Todos los Departamentos</option>
                {departamentos.map(d => (
                  <option key={d.id_departamento} value={d.id_departamento}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Filtro de Fechas */}
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
            placeholder="Inicio" 
            className="py-2 px-3 border border-gray-300 rounded-lg text-sm shadow-sm" 
          />
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
            placeholder="Fin" 
            className="py-2 px-3 border border-gray-300 rounded-lg text-sm shadow-sm" 
          />

          {/* Botones de Exportación */}
          <button 
            onClick={exportPDF} 
            disabled={isExporting} 
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            <FileText size={16} className="mr-2" /> 
            {isExporting ? 'Generando...' : 'Exportar PDF'}
          </button>
          <button 
            onClick={exportExcel} 
            disabled={isExporting} 
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            <TableIcon size={16} className="mr-2" /> Excel
          </button>
          <button 
            onClick={fetchReports} 
            disabled={loading} 
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 shadow-sm disabled:text-gray-400"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {loading && !valorInventario && (
        <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
          <RefreshCw size={18} className="animate-spin" /> Cargando reportes...
        </div>
      )}

      {/* KPI: Valor Total */}
      <div className="bg-gradient-to-r from-white to-blue-50 p-6 rounded-xl shadow-lg border border-blue-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">
            Valor Patrimonial Total Contabilizado
          </p>
          <p className="text-4xl font-extrabold text-gray-900 mt-1">
            {formatCurrency(valorInventario?.valor_total || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Package size={14} /> {valorInventario?.total_activos || 0} activos en {getReportTitle()}
          </p>
        </div>
        <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <TrendingUp size={28} />
        </div>
      </div>

      {/* TABLA UNIFICADA DE RIESGO OPERATIVO */}
      <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
        <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
          <AlertTriangle className="mr-2" /> Riesgo Operativo y Obsolescencia
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Activos que tienen **2 o más fallas** o que superan los **5 años** de antigüedad 
          (Foco rojo = Score ≥ 4).
        </p>
        <TablaRiesgoOperativo />
      </div>

      {/* GRÁFICOS DE DISTRIBUCIÓN Y COSTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico Estado */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="mr-2" /> Distribución por Estado Operativo
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumenEstado}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="estado" hide />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="total" name="Total Activos" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 overflow-auto max-h-32">
            <table className="w-full text-sm">
              <tbody>
                {resumenEstado.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1 flex items-center gap-2 font-medium">
                      <span 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      ></span>
                      {r.estado}
                    </td>
                    <td className="text-right font-bold">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfico Costos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <DollarSign className="mr-2" /> Costos Mantenimiento por Categoría
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" hide />
                <YAxis />
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                <Legend />
                <Bar 
                  dataKey="costo_total" 
                  name="Costo Total" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Muestra en qué tipo de equipos se ha invertido más en mantenimiento durante el 
            periodo seleccionado.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;