import { crearServicio } from './crud.js';

// Servicios del módulo Conteos físicos: conteos y sus líneas.
export const conteoService = crearServicio('conteos');
export const lineaConteoService = crearServicio('lineas-conteo');

// Cierra el conteo: el backend genera los ajustes de inventario según las diferencias.
export const cerrarConteo = id => conteoService.accion(id, 'cerrar');
