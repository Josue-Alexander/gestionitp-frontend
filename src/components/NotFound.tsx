import React from 'react';
import { Link } from 'react-router-dom'; // Para crear enlaces internos

function NotFound() {
  return (
    <div>
      <h2>Página No Encontrada (Error 404)</h2>
      <p>Lo sentimos, la página que buscas no existe.</p>
      <Link to="/">Volver al inicio</Link> {/* Enlace para regresar */}
    </div>
  );
}

export default NotFound;