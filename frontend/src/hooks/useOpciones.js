import { useEffect, useMemo, useState } from 'react';

// Carga todos los registros de un recurso para selectores y para mostrar nombres en las tablas.
// `etiqueta` debe ser una función estable (definida fuera del componente) para no recalcular opciones.
export function useOpciones(servicio, etiqueta, params = {}, recarga = 0) {
    const [registros, setRegistros] = useState([]);
    const clave = JSON.stringify(params);

    useEffect(() => {
        let activo = true;
        servicio.todos(JSON.parse(clave)).then(data => { if (activo) setRegistros(data); }).catch(() => {});
        return () => { activo = false; };
    }, [servicio, clave, recarga]);

    // opciones: [{ value, label }] para <select>; mapa: { id: etiqueta } para mostrar nombres en lugar de ids.
    const opciones = useMemo(
        () => registros.map(r => ({ value: String(r.id), label: etiqueta(r) })),
        [registros, etiqueta],
    );
    const mapa = useMemo(() => Object.fromEntries(opciones.map(o => [o.value, o.label])), [opciones]);
    return { registros, opciones, mapa };
}
