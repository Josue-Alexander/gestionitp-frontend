import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importamos el hook de autenticación
import { API_URL } from '../../config';

// --- Definición de Tipos para los Catálogos ---
interface Departamento {
  id_departamento: number;
  nombre: string;
}
interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
}
interface Ubicacion {
  id_ubicacion: number;
  nombre_area: string;
}
type EstadoActivo = 'Bueno' | 'Regular' | 'Malo' | 'En_Mantenimiento' | 'De_Baja';

function NuevoActivoForm() {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Obtenemos el usuario
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estados para los datos del formulario ---
  const [nombre, setNombre] = useState('');
  const [nombreGenerico, setNombreGenerico] = useState('');
  const [numInventario, setNumInventario] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [noSerie, setNoSerie] = useState('');
  const [estado, setEstado] = useState<EstadoActivo>('Bueno');
  const [observaciones, setObservaciones] = useState('');
  const [descAdquisicion, setDescAdquisicion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [costo, setCosto] = useState('');
  
  // --- Estados para los catálogos ---
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  const [selectedDepto, setSelectedDepto] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedUbi, setSelectedUbi] = useState<string>('');

  // --- Cargar datos para los Dropdowns ---
  useEffect(() => {
    const fetchCatalogs = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [deptosRes, catsRes, ubisRes] = await Promise.all([
          fetch(`${API_URL}/api/departamentos`, { headers }),
          fetch(`${API_URL}/api/categorias`, { headers }),
          fetch(`${API_URL}/api/ubicaciones`, { headers })
        ]);

        if (!deptosRes.ok || !catsRes.ok || !ubisRes.ok) {
          throw new Error('Error al cargar los catálogos necesarios.');
        }

        const deptosData: Departamento[] = await deptosRes.json();
        const catsData: Categoria[] = await catsRes.json();
        const ubisData: Ubicacion[] = await ubisRes.json();

        setDepartamentos(deptosData);
        setCategorias(catsData);
        setUbicaciones(ubisData);

        // --- LÓGICA DE SELECCIÓN DE DEPARTAMENTO ---
        if (user?.role !== 'Admin_General' && user?.id_departamento) {
          // Si NO es Admin General, forzamos su propio departamento
          setSelectedDepto(user.id_departamento.toString());
        } else if (deptosData.length > 0) {
          // Si es Admin General, seleccionamos el primero por defecto
          setSelectedDepto(deptosData[0].id_departamento.toString());
        }
        // ------------------------------------------

        if (catsData.length > 0) setSelectedCat(catsData[0].id_categoria.toString());
        if (ubisData.length > 0) setSelectedUbi(ubisData[0].id_ubicacion.toString());

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, [navigate, user]); // Agregamos 'user' a dependencias

  // --- Manejador del envío ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError("Sesión expirada.");
      return;
    }

    const nuevoActivo = {
      nombre,
      nombre_generico: nombreGenerico || null,
      num_inventario: numInventario || null,
      marca: marca || null,
      modelo: modelo || null,
      no_serie: noSerie || null,
      estado,
      observaciones: observaciones || null,
      descripcion_adquisicion: descAdquisicion || null,
      imagen_objeto: imagenUrl || null,
      costo_adquisicion: costo ? parseFloat(costo) : null,
      id_departamento: parseInt(selectedDepto),
      id_categoria: parseInt(selectedCat),
      id_ubicacion: parseInt(selectedUbi),
    };

    try {
      const response = await fetch(`${API_URL}/api/activos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(nuevoActivo),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el activo.');
      }

      alert('Activo creado. Ahora serás redirigido para imprimir la etiqueta.');
      navigate(`/activo/${data.id_objeto}`);

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    }
  };

  if (loading) return <p className="text-center text-gray-500">Cargando formulario...</p>;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-8 shadow-xl rounded-lg border border-gray-200">
      
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-900">Registrar Nuevo Activo</h2>
        <Link to="/activos" className="text-sm text-blue-600 hover:underline">
          Cancelar y volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Información Básica */}
        <h3 className="text-lg font-semibold text-gray-700">Información Básica</h3>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Activo <span className="text-red-500">*</span></label>
              <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                placeholder="Ej. Laptop HP ProBook"
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="nombreGenerico" className="block text-sm font-medium text-gray-700">Nombre Genérico</label>
              <input type="text" id="nombreGenerico" value={nombreGenerico} onChange={(e) => setNombreGenerico(e.target.value)}
                placeholder="Ej. Computadora Portátil"
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="numInventario" className="block text-sm font-medium text-gray-700">Número de Inventario</label>
              <input type="text" id="numInventario" value={numInventario} onChange={(e) => setNumInventario(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="marca" className="block text-sm font-medium text-gray-700">Marca</label>
              <input type="text" id="marca" value={marca} onChange={(e) => setMarca(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">Modelo</label>
              <input type="text" id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="noSerie" className="block text-sm font-medium text-gray-700">Número de Serie</label>
              <input type="text" id="noSerie" value={noSerie} onChange={(e) => setNoSerie(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </section>

        {/* Clasificación */}
        <h3 className="text-lg font-semibold text-gray-700 pt-4 border-t">Clasificación y Estado</h3>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoría <span className="text-red-500">*</span></label>
                <select id="categoria" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} required
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {categorias.map(cat => (<option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="departamento" className="block text-sm font-medium text-gray-700">Departamento (Dueño) <span className="text-red-500">*</span></label>
                <select 
                  id="departamento" 
                  value={selectedDepto} 
                  onChange={(e) => setSelectedDepto(e.target.value)} 
                  required
                  // --- BLOQUEO VISUAL ---
                  disabled={user?.role !== 'Admin_General'}
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {departamentos.map(depto => (<option key={depto.id_departamento} value={depto.id_departamento}>{depto.nombre}</option>))}
                </select>
                {user?.role !== 'Admin_General' && <p className="text-xs text-gray-500 mt-1">Registrando para tu departamento.</p>}
              </div>
           </div>
           <div className="space-y-4">
              <div>
                <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700">Ubicación (Resguardo) <span className="text-red-500">*</span></label>
                <select id="ubicacion" value={selectedUbi} onChange={(e) => setSelectedUbi(e.target.value)} required
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ubicaciones.map(ubi => (<option key={ubi.id_ubicacion} value={ubi.id_ubicacion}>{ubi.nombre_area}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado Inicial <span className="text-red-500">*</span></label>
                <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoActivo)} required
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                  <option value="En_Mantenimiento">En Mantenimiento</option>
                  {/* Opción 'De_Baja' eliminada en creación inicial para consistencia */}
                </select>
              </div>
           </div>
        </section>

        {/* Detalles Adicionales */}
        <h3 className="text-lg font-semibold text-gray-700 pt-4 border-t">Detalles Adicionales</h3>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <div>
                <label htmlFor="descAdquisicion" className="block text-sm font-medium text-gray-700">Descripción de Adquisición</label>
                <input type="text" id="descAdquisicion" value={descAdquisicion} onChange={(e) => setDescAdquisicion(e.target.value)}
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label htmlFor="costo" className="block text-sm font-medium text-gray-700">Costo de Adquisición (Opcional)</label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="costo"
                    min="0"
                    step="0.01"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    className="block w-full rounded-md border-gray-300 pl-7 px-3 py-2 border focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="imagenUrl" className="block text-sm font-medium text-gray-700">URL de la Imagen</label>
                <input type="url" id="imagenUrl" value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)}
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
           </div>
           
           <div>
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea id="observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={5}
              className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </section>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          {error && <p className="text-sm font-medium text-red-700 mr-auto">{error}</p>}
          <Link to="/activos" className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700">
            Cancelar y volver
          </Link>
          <button type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Guardar Activo
          </button>
        </div>
        
      </form>
    </div>
  );
}

export default NuevoActivoForm;