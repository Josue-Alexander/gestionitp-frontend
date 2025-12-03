import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

// --- NUEVO: Interfaz para Departamentos ---
interface Departamento {
  id_departamento: number;
  nombre: string;
}

function Register() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // --- NUEVOS ESTADOS para el dropdown ---
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [selectedDepto, setSelectedDepto] = useState<string>(''); // Guarda el ID del depto
  const [loadingDeptos, setLoadingDeptos] = useState(true);

  // --- NUEVO: useEffect para cargar departamentos ---
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        // Llama a la ruta pública (no necesita token)
        const response = await fetch(`${API_URL}/api/departamentos`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los departamentos.');
        }
        const data: Departamento[] = await response.json();
        setDepartamentos(data);
        // Selecciona el primer departamento por defecto si la lista no está vacía
        if (data.length > 0) {
          setSelectedDepto(data[0].id_departamento.toString());
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingDeptos(false);
      }
    };
    fetchDepartamentos();
  }, []); // El array vacío [] asegura que se ejecute solo una vez

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          email: email,
          contraseña: password,
          rol: 'Usuario_General', // Rol por defecto para registro público
          id_departamento: parseInt(selectedDepto), // --- USA EL ID SELECCIONADO ---
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setSuccess('¡Registro exitoso! Redirigiendo al login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Error inesperado.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        
        <h2 className="mb-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Crear Cuenta
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ... (Campos Nombre, Email, Password - sin cambios) ... */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* --- NUEVO: Dropdown de Departamentos --- */}
          <div>
            <label htmlFor="departamento" className="block text-sm font-medium text-gray-700">Departamento</label>
            <select
              id="departamento"
              value={selectedDepto}
              onChange={(e) => setSelectedDepto(e.target.value)}
              required
              disabled={loadingDeptos} // Deshabilita mientras carga
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loadingDeptos ? (
                <option value="" disabled>Cargando departamentos...</option>
              ) : (
                departamentos.map(depto => (
                  <option key={depto.id_departamento} value={depto.id_departamento}>
                    {depto.nombre}
                  </option>
                ))
              )}
            </select>
          </div>
          
          {error && <p className="text-center text-sm font-medium text-red-700">{error}</p>}
          {success && <p className="text-center text-sm font-medium text-green-700">{success}</p>}

          <button type="submit" disabled={loadingDeptos}
            className="w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            Registrarse
          </button>

          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Register;