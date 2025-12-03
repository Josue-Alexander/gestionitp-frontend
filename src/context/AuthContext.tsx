import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// 1. Definir la forma del Payload del Token (lo que viene del backend)
export interface UserPayload {
  userId: number;
  email: string;
  role: 'Admin_General' | 'Admin_Depto' | 'Gestor' | 'Usuario_General';
  id_departamento?: number;
  nombre?: string;
  exp: number; 
}

// 2. Definir qué datos comparte el contexto con toda la app
interface AuthContextType {
  user: UserPayload | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserPayload | null>(null);
  
  // Importante: loading empieza en TRUE. La app no debe mostrar nada hasta verificar el token.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esta función se ejecuta UNA vez al cargar la página
    const initializeAuth = () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          const decoded = jwtDecode<UserPayload>(token);
          
          // Verificar si el token expiró (exp está en segundos, Date.now en milisegundos)
          if (decoded.exp * 1000 < Date.now()) {
            console.warn("El token ha expirado.");
            localStorage.removeItem('authToken');
            setUser(null);
          } else {
            // ¡Token válido! Restauramos al usuario
            setUser(decoded);
          }
        } catch (error) {
          console.error("Token inválido en almacenamiento:", error);
          localStorage.removeItem('authToken');
          setUser(null);
        }
      }
      
      setLoading(false); // Ya terminamos de revisar, quitamos la pantalla de carga
    };

    initializeAuth();
  }, []);

  const login = (token: string) => {
    localStorage.setItem('authToken', token);
    const decoded = jwtDecode<UserPayload>(token);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};