import { crearServicio } from './crud.js';

// Servicios del módulo Catálogo: cada uno apunta a su endpoint de la API.
export const categoriaService = crearServicio('categorias');
export const productoService = crearServicio('productos');
