import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { API_URL } from '../../config';

interface Departamento { id_departamento: number; nombre: string; }
interface Categoria { id_categoria: number; nombre_categoria: string; }
interface Ubicacion { id_ubicacion: number; nombre_area: string; }
type EstadoActivo = 'Bueno' | 'Regular' | 'Malo' | 'En_Mantenimiento' | 'De_Baja';

function EditarActivoForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  
  // --- 1. NUEVO ESTADO ---
  const [costo, setCosto] = useState('');
  // ---------------------
  
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  const [selectedDepto, setSelectedDepto] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedUbi, setSelectedUbi] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/login'); return; }

      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [deptosRes, catsRes, ubisRes, assetRes] = await Promise.all([
          fetch(`${API_URL}/api/departamentos`, { headers }),
          fetch(`${API_URL}/api/categorias`, { headers }),
          fetch(`${API_URL}/api/ubicaciones`, { headers }),
          fetch(`${API_URL}/api/activos/${id}`, { headers })
        ]);

        if (!deptosRes.ok || !catsRes.ok || !ubisRes.ok) throw new Error('Error cargando catálogos.');
        if (!assetRes.ok) throw new Error('Error cargando el activo.');

        const deptos = await deptosRes.json();
        const cats = await catsRes.json();
        const ubis = await ubisRes.json();
        const asset = await assetRes.json();

        setDepartamentos(deptos);
        setCategorias(cats);
        setUbicaciones(ubis);

        setNombre(asset.nombre);
        setNombreGenerico(asset.nombre_generico || '');
        setNumInventario(asset.num_inventario || '');
        setMarca(asset.marca || '');
        setModelo(asset.modelo || '');
        setNoSerie(asset.no_serie || '');
        setEstado(asset.estado);
        setObservaciones(asset.observaciones || '');
        setDescAdquisicion(asset.descripcion_adquisicion || '');
        setImagenUrl(asset.imagen_objeto || '');

        // --- 2. CARGAR COSTO EXISTENTE ---
        setCosto(asset.costo_adquisicion ? asset.costo_adquisicion.toString() : '');
        // ---------------------------------
        
        if (asset.id_departamento) setSelectedDepto(asset.id_departamento.toString());
        if (asset.id_categoria) setSelectedCat(asset.id_categoria.toString());
        if (asset.id_ubicacion) setSelectedUbi(asset.id_ubicacion.toString());

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const datosActualizados = {
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
      
      // --- 3. ENVIAR COSTO ACTUALIZADO ---
      costo_adquisicion: costo ? parseFloat(costo) : null,
      // ----------------------------------

      id_departamento: parseInt(selectedDepto),
      id_categoria: parseInt(selectedCat),
      id_ubicacion: parseInt(selectedUbi),
    };

    try {
      const response = await fetch(`${API_URL}/api/activos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(datosActualizados),
      });

      if (!response.ok) throw new Error('Error al actualizar.');

      alert('¡Activo actualizado correctamente!');
      navigate('/activos');

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <p className="text-center mt-10">Cargando datos del activo...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">Error: {error}</p>;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-8 shadow-xl rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-900">Editar Activo</h2>
        <Link to="/activos" className="text-sm text-blue-600 hover:underline">Cancelar</Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <h3 className="text-lg font-semibold text-gray-700">Información Básica</h3>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Activo *</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre Genérico</label>
              <input type="text" value={nombreGenerico} onChange={e => setNombreGenerico(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Inventario</label>
              <input type="text" value={numInventario} onChange={e => setNumInventario(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Marca</label>
              <input type="text" value={marca} onChange={e => setMarca(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Modelo</label>
              <input type="text" value={modelo} onChange={e => setModelo(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Serie</label>
              <input type="text" value={noSerie} onChange={e => setNoSerie(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </section>

        <h3 className="text-lg font-semibold text-gray-700 pt-4 border-t">Clasificación y Estado</h3>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría *</label>
                <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} required
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Departamento *</label>
                <select value={selectedDepto} onChange={e => setSelectedDepto(e.target.value)} required
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  {departamentos.map(depto => <option key={depto.id_departamento} value={depto.id_departamento}>{depto.nombre}</option>)}
                </select>
              </div>
           </div>
           <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ubicación *</label>
                <select value={selectedUbi} onChange={e => setSelectedUbi(e.target.value)} required
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  {ubicaciones.map(ubi => <option key={ubi.id_ubicacion} value={ubi.id_ubicacion}>{ubi.nombre_area}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado *</label>
                <select value={estado} onChange={e => setEstado(e.target.value as EstadoActivo)} required
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                  <option value="En_Mantenimiento">En Mantenimiento</option>
                  <option value="De_Baja">De Baja</option>
                </select>
              </div>
           </div>
        </section>

        <h3 className="text-lg font-semibold text-gray-700 pt-4 border-t">Detalles Adicionales</h3>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción Adquisición</label>
                <input type="text" value={descAdquisicion} onChange={e => setDescAdquisicion(e.target.value)}
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>

              {/* --- 4. CAMPO VISUAL DE COSTO --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Costo de Adquisición</label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costo}
                    onChange={e => setCosto(e.target.value)}
                    className="block w-full rounded-md border-gray-300 pl-7 px-3 py-2 border focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {/* ----------------------------- */}

              <div>
                <label className="block text-sm font-medium text-gray-700">URL de Imagen</label>
                <input type="url" value={imagenUrl} onChange={e => setImagenUrl(e.target.value)}
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
           </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={5}
              className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </section>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Link to="/activos" className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700">
            Cancelar
          </Link>
          <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarActivoForm;