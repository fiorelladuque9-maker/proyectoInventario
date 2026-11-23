// Devuelve una función que consulta la API y entrega [{ value, label }] para un <select> de relaciones.
export const cargarSelect = (servicio, etiqueta, params = {}) => async () => {
    const registros = await servicio.todos(params);
    return registros.map(r => ({ value: String(r.id), label: etiqueta(r) }));
};

// Cómo se muestra cada entidad en los selectores y en las tablas.
export const ETIQUETAS = {
    categoria: c => c.nombre,
    producto: p => `${p.sku} · ${p.nombre}`,
    proveedor: p => p.nombre,
    almacen: a => a.nombre,
};

// Opciones estáticas reutilizadas por filtros y formularios (los valores coinciden con los de la API).
export const OPCIONES_ACTIVO = [
    { value: 'true', label: 'Sí' },
    { value: 'false', label: 'No' },
];

export const UNIDADES = [
    { value: 'unidad', label: 'Unidad' },
    { value: 'kg', label: 'Kilogramo' },
    { value: 'litro', label: 'Litro' },
    { value: 'caja', label: 'Caja' },
];
