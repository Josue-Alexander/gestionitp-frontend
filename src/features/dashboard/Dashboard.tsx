import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; 
import { Link } from 'react-router-dom';
import { 
  Package, Wrench, FileQuestion, 
  AlertTriangle, ArrowRight, User, 
  TrendingUp, Clock, MapPin, Briefcase, Activity, Shield
} from 'lucide-react';
import { 
  Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { API_URL } from '../../config';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#6B7280'];

function Dashboard() {
  const { user, logout } = useAuth();
  
  const [stats, setStats] = useState({
    total: 0,
    asignados: 0,
    mantenimiento: 0,
    bajas: 0,
    solicitudesPendientes: 0,
    valorTotal: 0,
    misActivos: 0 
  });
  
  const [graphData, setGraphData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) { logout(); return; } 
      
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        if (user?.role === 'Usuario_General') {
          // --- LÓGICA USUARIO GENERAL ---
          const res = await fetch(`${API_URL}/api/me/asignaciones`, { headers });
          if (res.ok) {
            const data = await res.json();
            const activosAsignados = data.filter((a: any) => a.estado === 'Activa');
            setStats(prev => ({ ...prev, misActivos: activosAsignados.length }));
          }
        } else {
          // --- LÓGICA GESTIÓN (CORREGIDA) ---
          const [resActivos, resSolicitudes] = await Promise.all([
            // 1. CORRECCIÓN: Pedimos INCLUIR los retirados para poder contarlos
            fetch(`${API_URL}/api/activos?includeRetired=true`, { headers }),
            fetch(`${API_URL}/api/solicitudes-categoria`, { headers })
          ]);

          if (resActivos.ok) {
            const activos = await resActivos.json();
            
            // Conteos
            const mantenimiento = activos.filter((a: any) => a.estado === 'En_Mantenimiento').length;
            const bajas = activos.filter((a: any) => a.estado === 'De_Baja').length;
            // Sumamos Buenos y Regulares como "Operativos"
            const operativos = activos.filter((a: any) => a.estado === 'Bueno' || a.estado === 'Regular').length;
            const asignados = activos.filter((a: any) => a.asignaciones && a.asignaciones.length > 0).length;
            
            // 2. CORRECCIÓN: Parseo seguro del dinero (string a float)
            const valorTotal = activos.reduce((acc: number, curr: any) => {
                // Si es baja, generalmente no se suma al valor activo, pero si quieres sumarlo quita la condición
                if (curr.estado === 'De_Baja') return acc; 
                
                const costo = parseFloat(curr.costo_adquisicion);
                return acc + (isNaN(costo) ? 0 : costo);
            }, 0);

            setStats(prev => ({ 
                ...prev, 
                total: activos.length, 
                asignados, 
                mantenimiento, 
                bajas, 
                valorTotal 
            }));

            setGraphData([
              { name: 'Operativos', value: operativos },
              { name: 'Mantenimiento', value: mantenimiento },
              { name: 'De Baja', value: bajas }, // Ahora aparecerá en la gráfica
            ]);
          }

          if (resSolicitudes.ok) {
            const solicitudes = await resSolicitudes.json();
            const pendientes = solicitudes.filter((s: any) => s.estado === 'Pendiente').length;
            setStats(prev => ({ ...prev, solicitudesPendientes: pendientes }));
          }
        }
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, logout]); 

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-500 animate-pulse">Actualizando métricas...</p>
    </div>
  );

  // VISTA USUARIO GENERAL
  if (user?.role === 'Usuario_General') {
    return (
      <div className="space-y-8 font-sans text-slate-800">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{getGreeting()}, {(user.nombre || user.email).split(' ')[0]}!</h1>
            <p className="mt-2 opacity-90 text-lg">Revisa los equipos bajo tu resguardo.</p>
          </div>
          <Briefcase size={64} className="opacity-70" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Activos Asignados</h2>
              <p className="text-6xl font-extrabold text-blue-600 mt-2">{stats.misActivos}</p>
              <p className="text-sm text-gray-500 mt-1">Equipos bajo tu resguardo</p>
            </div>
            <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Package size={50} /></div>
          </div>
          <div className="space-y-4">
            <QuickAction to="/mis-activos" label="Ver Mis Equipos" icon={<ArrowRight size={18} />} color="green" description="Detalles de la asignación" />
          </div>
        </div>
      </div>
    );
  }

  // VISTA GESTIÓN
  const isAdminGen = user?.role === 'Admin_General';
  const isGestorOrAdmin = isAdminGen || user?.role === 'Admin_Depto' || user?.role === 'Gestor';

  return (
    <div className="space-y-8 font-sans text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {getGreeting()}, {user?.role.replace('Admin_', 'Admin. ').replace('_', ' ')}
            {isAdminGen && <Shield className="text-purple-600" />}
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            {isAdminGen ? 'Visión Global del Instituto Tecnológico de Pachuca' : `Panel de Control del Departamento ${user?.id_departamento}`}
          </p>
        </div>
        <div className="flex gap-2">
           <span className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-600 border border-gray-200 shadow-sm flex items-center gap-2">
             <Clock size={16} />
             {new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'long' })}
           </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Activos" value={stats.total} icon={<Package />} color="blue" />
        <StatCard title="En Mantenimiento" value={stats.mantenimiento} icon={<Wrench />} color="orange" alert={stats.mantenimiento > 5} />
        <StatCard title="Solicitudes" value={stats.solicitudesPendientes} icon={<FileQuestion />} color="purple" alert={stats.solicitudesPendientes > 0} />
        
        {/* KPI Cambiante: Valor (Admin) o Bajas (Otros) */}
        {isAdminGen ? (
           <StatCard 
             title="Valor Inventario (Activo)" 
             value={`$${stats.valorTotal.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} 
             icon={<TrendingUp />} 
             color="green"
             subtitle="MXN (Sin contar bajas)"
           />
        ) : (
           <StatCard 
             title="Dados de Baja" 
             value={stats.bajas} 
             icon={<AlertTriangle />} 
             color="gray"
           />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfica */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Activity size={20} className="text-gray-400" /> Salud del Inventario</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                  {graphData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Gestión Rápida</h3>
            <div className="space-y-3">
              <QuickAction to="/nuevo-activo" label="Registrar Nuevo Activo" icon={<Package size={18} />} description="Alta de equipo" />
              <QuickAction to="/nueva-asignacion" label="Asignar a Usuario" icon={<User size={18} />} description="Entrega de equipo" />
              
              {isGestorOrAdmin && <QuickAction to="/ubicaciones" label="Gestionar Ubicaciones" icon={<MapPin size={18} />} color="blue" description="Áreas de resguardo" />}
              {isGestorOrAdmin && <QuickAction to="/solicitudes-categoria" label="Revisar Solicitudes" icon={<FileQuestion size={18} />} color="purple" description="Categorías pendientes" />}
              {isAdminGen && <QuickAction to="/usuarios" label="Gestionar Usuarios" icon={<User size={18} />} color="purple" description="Altas y bajas" />}
              
              <QuickAction to="/mantenimiento/nuevo" label="Reportar Falla" icon={<Wrench size={18} />} color="orange" description="Orden de servicio" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponentes ---
function StatCard({ title, value, icon, color, subtitle, trend, alert }: any) {
  const colorMap: any = { blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600', purple: 'bg-purple-50 text-purple-600', green: 'bg-emerald-50 text-emerald-600', gray: 'bg-gray-100 text-gray-600' };
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all duration-300 hover:-translate-y-1 ${alert ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color] || colorMap.gray}`}>{React.cloneElement(icon, { size: 24 })}</div>
      </div>
      <div className="mt-4 flex items-center text-xs">
        {alert && <span className="text-red-600 font-bold mr-2 flex items-center gap-1"><AlertTriangle size={12} /> Atención</span>}
        <span className="text-gray-400 ml-auto">{subtitle || 'Actualizado'}</span>
      </div>
    </div>
  );
}

function QuickAction({ to, label, icon, description, color = "blue" }: any) {
  const hoverColor = color === 'purple' ? 'group-hover:bg-purple-50' : color === 'orange' ? 'group-hover:bg-orange-50' : 'group-hover:bg-blue-50';
  const iconColor = color === 'purple' ? 'text-purple-600 bg-purple-100' : color === 'orange' ? 'text-orange-600 bg-orange-100' : 'text-blue-600 bg-blue-100';
  return (
    <Link to={to} className={`flex items-center p-3 border border-gray-100 rounded-lg transition-all duration-200 group ${hoverColor}`}>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center mr-3 ${iconColor}`}>{icon}</div>
      <div><h4 className="text-sm font-bold text-gray-800 group-hover:text-gray-900">{label}</h4><p className="text-xs text-gray-500">{description}</p></div>
      <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
    </Link>
  );
}

export default Dashboard;