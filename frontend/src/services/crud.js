import { api } from '../api/client.js';

// Elimina filtros vacíos para no enviar parámetros innecesarios al backend.
export const limpiar = params => Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null),
);

// Servicio REST genérico: una instancia por recurso de la API (p. ej. crearServicio('productos')).
// Cada método devuelve directamente el cuerpo de la respuesta; los errores los maneja quien llama con getError().
export function crearServicio(ruta) {
    const base = `/${ruta}/`;
    return {
        // Respuesta paginada de DRF: { count, next, previous, results }
        async listar(params = {}) {
            const { data } = await api.get(base, { params: limpiar(params) });
            if (!Array.isArray(data?.results)) throw new Error('La API no retornó una lista paginada.');
            return data;
        },
        // Recorre todas las páginas (para listas desplegables).
        async todos(params = {}) {
            const items = [];
            let page = 1;
            let hayMas = true;
            while (hayMas) {
                const data = await this.listar({ ...params, page });
                items.push(...data.results);
                hayMas = Boolean(data.next);
                page++;
            }
            return items;
        },
        // GET /recurso/{id}/
        async obtener(id) {
            const { data } = await api.get(`${base}${id}/`);
            return data;
        },
        // POST /recurso/
        async crear(registro) {
            const { data } = await api.post(base, registro);
            return data;
        },
        // PUT /recurso/{id}/ (reemplazo completo)
        async actualizar(id, registro) {
            const { data } = await api.put(`${base}${id}/`, registro);
            return data;
        },
        // DELETE /recurso/{id}/ (204 sin cuerpo)
        async eliminar(id) {
            await api.delete(`${base}${id}/`);
        },
        // Acciones de negocio: POST /recurso/{id}/{accion}/
        async accion(id, nombre, cuerpo = {}) {
            const { data } = await api.post(`${base}${id}/${nombre}/`, cuerpo);
            return data;
        },
    };
}
