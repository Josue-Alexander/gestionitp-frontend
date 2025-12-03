import React, { useState } from 'react'; // 1. Asegúrate de importar useState
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import { API_URL } from '../../config';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth(); // Obtén la función 'login' del contexto
  
  // --- 2. FALTABAN ESTAS LÍNEAS (Definición de estados) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // ---------------------------------------------------

  const from = location.state?.from?.pathname || "/dashboard";

  // --- 3. FALTABA EL CONTENIDO DE LA FUNCIÓN ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Evita que la página se recargue
    setError(''); // Limpia errores previos

    try {
      // Llamada a la API de backend
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, contraseña: password }),
      });

      const data = await response.json();

      // Si la respuesta NO fue exitosa (ej. 401 Credenciales inválidas)
      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      // Si la respuesta FUE exitosa (200 OK)
      // Llama a la función 'login' del contexto. 
      // Esta función (definida en AuthContext.tsx) se encarga de:
      // 1. Guardar el token en localStorage
      // 2. Decodificar el token y poner al usuario en el estado global
      login(data.accessToken); 

      // Redirige al usuario a la página a la que intentaba ir (o al dashboard)
      navigate(from, { replace: true });

    } catch (err: any) {
      console.error('Error en el login:', err);
      setError(err.message || 'Ocurrió un error inesperado.');
    }
  };
  // --- FIN DE LA LÓGICA FALTANTE ---

  // JSX con estilos Tailwind (sin cambios)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">

        <h2 className="mb-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Gestión de Activos
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          Inicia sesión para acceder al panel
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700"
            >
              Correo Electrónico
            </label>
            <div className="mt-1">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <div className="mt-1">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-center text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <div>
            <button 
              type="submit"
              className="w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Entrar
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            ¿No tienes una cuenta? Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;