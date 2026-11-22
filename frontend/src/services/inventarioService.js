import { api } from '../api/client.js';
import { crearServicio, limpiar } from './crud.js';

// Servicios del módulo Inventario. Existencias y movimientos son de solo lectura en la interfaz.
export const almacenService = crearServicio('almacenes');
export const existenciaService = crearServicio('existencias');
export const movimientoService = crearServicio('movimientos');

// Existencias cuyo saldo está por debajo del stock mínimo del producto.
export const existenciaBajoMinimoService = {
    ...existenciaService,
    async listar(params = {}) {
        const { data } = await api.get('/existencias/bajo-minimo/', { params: limpiar(params) });
        return data;
    },
};

// Las salidas se registran con una acción de negocio, no con el CRUD general.
export const salidaService = {
    ...movimientoService,
    async crear(datos) {
        const { data } = await api.post('/movimientos/registrar-salida/', datos);
        return data;
    },
};
