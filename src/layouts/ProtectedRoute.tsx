import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { API_URL } from '../config';

interface LoginProps {
  onLoginSuccess: () => void;
}

function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Busca la URL a la que redirigir (o va al dashboard por defecto)
  const from = location.state?.from?.pathname || "/dashboard";

  // Esta es la lógica de backend que ya funciona
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, contraseña: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      localStorage.setItem('authToken', data.accessToken);
      onLoginSuccess();
      navigate(from, { replace: true }); 

    } catch (err: any) {
      console.error('Error en el login:', err);
      setError(err.message || 'Ocurrió un error inesperado.');
    }
  };

  // --- JSX con Estilos Tailwind ---
  return (
    // Contenedor principal: Ocupa toda la pantalla, fondo gris, centra contenido
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      
      {/* Tarjeta de Login: Fondo blanco, sombra, bordes redondeados, ancho máximo */}
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">

        {/* Encabezado */}
        <h2 className="mb-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Gestión de Activos
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          Inicia sesión para acceder al panel
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Campo de Email */}
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
                // Estilos del input: Borde, padding, sombra interna, foco
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Campo de Contraseña */}
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

          {/* Mensaje de Error (si existe) */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-center text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Botón de Enviar */}
          <div>
            <button 
              type="submit"
              className="w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;