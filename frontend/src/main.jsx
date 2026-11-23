// Punto de entrada de la aplicación: carga los estilos globales y monta <App /> en el div#root de index.html.
import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; // estilos base de Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css'; // iconos (clases "bi bi-...")
import './styles.css'; // estilos propios (se cargan al final para poder sobrescribir Bootstrap)
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
