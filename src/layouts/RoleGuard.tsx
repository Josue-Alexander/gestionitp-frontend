import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleGuardProps {
  allowedRoles: string[];
}

function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-4 text-center">Verificando permisos...</div>;
  }

  // --- ZONA DE DIAGNÓSTICO ---
  console.log("--- ROLE GUARD CHECK ---");
  console.log("1. Usuario actual:", user);
  console.log("2. Rol del usuario:", user?.role);
  console.log("3. Roles permitidos:", allowedRoles);
  
  // Verificamos si el rol existe antes de comparar
  if (!user?.role) {
    console.log("RESULTADO: No hay rol definido en el usuario");
  } else {
    const tienePermiso = allowedRoles.includes(user.role);
    console.log(`RESULTADO: ¿Tiene permiso? ${tienePermiso ? "SÍ" : "NO"}`);
  }
  // --- FIN DIAGNÓSTICO ---

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default RoleGuard;