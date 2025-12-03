import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { 
  LayoutDashboard, Box, Users, MapPin, FileText, Settings, LogOut, 
  Briefcase, ClipboardList, Wrench, BarChart3, Shield, List, Menu, X, Package2
} from 'lucide-react'; 
import logoItp from '../../public/ITP.jpg';

function Layout() { 
  const { user, logout } = useAuth();
  // Estado para manejar la visibilidad del menú en móviles
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null; 

  // --- Lógica de Roles ---
  const role = user.role;
  const isAdminGen = role === 'Admin_General';
  const isAdminDeptOrGen = ['Admin_General', 'Admin_Depto'].includes(role);
  const isGestorOrAdmin = ['Admin_General', 'Admin_Depto', 'Gestor'].includes(role);
  
  const handleLogout = () => {
    setIsMenuOpen(false); // Cierra el menú móvil antes de salir
    logout();
  };
  
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800">
      
      {/* --- Overlay para Móviles (Menú abierto) --- */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity" 
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* --- Barra Lateral (Sidebar) --- */}
      <nav 
        className={
          `fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 bg-white 
          flex flex-col border-r border-gray-200 shadow-xl 
          transform transition-transform duration-300 lg:translate-x-0 
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`
        }
      >
        
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900">
            <img 
              src={logoItp} 
              alt="Logo ITP" 
              className="h-10 w-auto object-contain" // Ajusta h-10 (40px) según necesites
            />
            <span className="text-xl font-bold tracking-tight">Activos ITP</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)} 
            className="lg:hidden text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* --- Contenido del Menú --- */}
        <ul className="flex-grow py-6 px-4 space-y-1 overflow-y-auto">
          
          {/* 1. ZONA PERSONAL (Para TODOS) */}
          <MenuSection title="Personal y Resguardo" />
          <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/dashboard" icon={<LayoutDashboard size={20} />} label="Panel Principal" />
          <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/mis-activos" icon={<Briefcase size={20} />} label="Mis Asignaciones" />


          {/* 2. ZONA GESTIÓN OPERATIVA (Gestores + Admins) */}
          {isGestorOrAdmin && (
            <>
              <MenuSection title="Inventario y Flujo" />
              <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/activos" icon={<Box size={20} />} label="Catálogo de Activos" />
              <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/asignaciones" icon={<ClipboardList size={20} />} label="Asignaciones" />
              <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/mantenimiento" icon={<Wrench size={20} />} label="Mantenimiento" />
              <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/reportes" icon={<BarChart3 size={20} />} label="Reportes BI" />
            </>
          )}

          {/* 3. ZONA ADMINISTRACIÓN (Admins Depto + General) */}
          {isAdminDeptOrGen && (
            <>
              <MenuSection title="Administración" />
              <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/usuarios" icon={<Users size={20} />} label="Usuarios" />
              <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/ubicaciones" icon={<MapPin size={20} />} label="Ubicaciones" />
              <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/solicitudes-categoria" icon={<FileText size={20} />} label="Solicitudes" />
            </>
          )}

          {/* 4. ZONA CONFIGURACIÓN (Solo Super Admin) */}
          {isAdminGen && (
            <>
              <MenuSection title="Configuración Global" />
              <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/departamentos" icon={<Shield size={20} />} label="Departamentos" />
              <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/categorias" icon={<List size={20} />} label="Categorías" />
              <NavLinkItem onClick={() => setIsMenuOpen(false)} to="/bitacora" icon={<Settings size={20} />} label="Bitácora Global" />
            </>
          )}
        </ul>
        
        {/* Footer del Menú (Usuario y Logout) */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
              {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.nombre || 'Usuario'}</p>
              <p className="text-xs text-gray-500 truncate" title={user.role}>{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </nav>
      
      {/* --- Contenido Principal y Header Móvil --- */}
      <main className="flex-1 lg:ml-64 flex flex-col overflow-y-auto">
        
        {/* Header Móvil */}
        <header className="lg:hidden sticky top-0 z-30 bg-white shadow-md p-4 flex justify-between items-center border-b">
          <h1 className="text-lg font-semibold text-gray-900">Activos ITP</h1>
          <button onClick={() => setIsMenuOpen(true)} className="text-gray-600 hover:text-gray-800 p-2">
            <Menu size={24} />
          </button>
        </header>

        {/* Área de Contenido */}
        <div className="p-4 sm:p-8 flex-1">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

// Componente auxiliar para los enlaces
const NavLinkItem = ({ to, label, icon, onClick }: { to: string, label: string, icon: React.ReactNode, onClick: () => void }) => {
  const baseClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group";
  const inactiveClasses = "text-gray-600 hover:bg-blue-50 hover:text-blue-700";
  const activeClasses = "bg-blue-600 text-white shadow-md shadow-blue-200";

  return (
    <li>
      <NavLink 
        to={to}
        onClick={onClick}
        className={({ isActive }) => isActive ? `${baseClasses} ${activeClasses}` : `${baseClasses} ${inactiveClasses}`}
      >
        {({ isActive }) => (
          <>
            <span className={`transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`}>
              {icon}
            </span>
            <span>{label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
};

// Componente auxiliar para las secciones del menú
const MenuSection = ({ title }: { title: string }) => (
    <div className="mt-6 mb-2 ml-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
    </div>
);

export default Layout;