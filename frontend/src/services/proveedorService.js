import { crearServicio } from './crud.js';

// Servicios del módulo Proveedores. "ofertas" son los precios proveedor-producto (relación N:M).
export const proveedorService = crearServicio('proveedores');
export const ofertaService = crearServicio('productos-proveedor');
