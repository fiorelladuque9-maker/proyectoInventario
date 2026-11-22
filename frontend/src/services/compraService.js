import { crearServicio } from './crud.js';

// Servicios del módulo Compras: órdenes y sus líneas (productos de cada orden).
export const ordenService = crearServicio('ordenes-compra');
export const lineaCompraService = crearServicio('lineas-compra');

// Acciones de negocio: enviar (borrador -> enviada) y recibir (enviada -> recibida, suma al inventario del almacén).
export const enviarOrden = id => ordenService.accion(id, 'enviar');
export const recibirOrden = (id, almacen) => ordenService.accion(id, 'recibir', { almacen });
