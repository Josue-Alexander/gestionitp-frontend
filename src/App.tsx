import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Importa el hook que creamos
import { useAuth } from './context/AuthContext'; 

// Layouts y Guards
import Layout from './layouts/Layout';
import RoleGuard from './layouts/RoleGuard'; 

// Componentes
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Dashboard from './features/dashboard/Dashboard';
import AssetListPage from './features/assets/AssetListPage';
import AssetDetail from './features/assets/AssetDetail';
import NuevoActivoForm from './features/assets/NuevoActivoForm';
import EditarActivoForm from './features/assets/EditarActivoForm';
import NotFound from './components/NotFound';
import MyAssetsPage from './features/assets/MyAssetsPage';
import NuevaAsignacionForm from './features/assets/NuevaAsignacionForm';
import AsignacionListPage from './features/assets/AsignacionListPage';
import DepartamentosPage from './features/departments/DepartamentosPage';
import UbicacionesPage from './features/locations/UbicacionesPage';
import CategoriasPage from './features/categories/CategoriasPage';
import UsuariosPage from './features/users/UsuariosPage';
import MantenimientoPage from './features/maintenance/MantenimientoPage';
import NuevoMantenimientoForm from './features/maintenance/NuevoMantenimientoForm';
import SolicitudesPage from './features/categories/SolicitudesPage';
import ReportsPage from './features/reports/ReportsPage';
import BitacoraPage from './features/bitacora/BitacoraPage';

// Componente Guardián (ahora usa el hook)
function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth(); // Lee del contexto

  if (loading) return <div>Cargando sesión...</div>; // Muestra esto mientras verifica

  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
}

function App() {
  // Obtenemos el estado REAL del contexto
  const { isAuthenticated, loading } = useAuth(); 

  // Si el contexto aún está cargando (verificando el token), no mostramos nada
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Cargando aplicación...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />}
        />

        {/* Rutas Protegidas (Usan el nuevo Guardián) */}
        <Route element={<ProtectedLayout />}>
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/activo/qr/:qrId" element={<AssetDetail />} />
          <Route path="/activo/:id" element={<AssetDetail />} />
          <Route path="/mis-activos" element={<MyAssetsPage />} />
          
          <Route element={<RoleGuard allowedRoles={['Admin_General', 'Admin_Depto', 'Gestor']} />}>
            <Route path="/activos" element={<AssetListPage />} />
            <Route path="/nuevo-activo" element={<NuevoActivoForm />} />
            <Route path="/activo/:id/editar" element={<EditarActivoForm />} />
            <Route path="/nueva-asignacion" element={<NuevaAsignacionForm />} />
            <Route path="/asignaciones" element={<AsignacionListPage />} />
            <Route path="/mantenimiento" element={<MantenimientoPage />} />
            <Route path="/mantenimiento/nuevo" element={<NuevoMantenimientoForm />} />
            <Route path="/reportes" element={<ReportsPage />} />
            {/* ...otras rutas de gestión... */}

            {/* --- ZONA ADMIN DEPTO y GENERAL --- */}
            <Route element={<RoleGuard allowedRoles={['Admin_General', 'Admin_Depto']} />}>
              <Route path="/usuarios" element={<UsuariosPage />} />
              <Route path="/ubicaciones" element={<UbicacionesPage />} />
              <Route path="/solicitudes-categoria" element={<SolicitudesPage />} />
            </Route>

            {/* --- ZONA SOLO ADMIN GENERAL --- */}
            <Route element={<RoleGuard allowedRoles={['Admin_General']} />}>
              <Route path="/departamentos" element={<DepartamentosPage />} />
              <Route path="/categorias" element={<CategoriasPage />} />
              <Route path="/bitacora" element={<BitacoraPage />} />
              {/* <Route path="/categorias" element={<CategoriasPage />} /> */}
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;