import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// 1. Importar el Provider
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. Envolver <App /> dentro de <AuthProvider> */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)