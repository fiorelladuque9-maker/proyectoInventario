import { useCallback, useEffect, useState } from 'react';
import { getError } from '../api/client.js';

export const PAGE_SIZE = 20; // PAGE_SIZE de DRF en settings.py

// Listado paginado con búsqueda, filtros combinables y ordenamiento consumidos desde el backend.
// Parámetros: servicio (de crud.js), fijos (filtros siempre aplicados, p. ej. { orden: 5 }),
// ordenInicial (campo de ordenamiento por defecto) y recarga (número que, al cambiar, fuerza una nueva consulta).
export function useList(servicio, { fijos = {}, ordenInicial = '', recarga = 0 } = {}) {
    const [items, setItems] = useState([]); // filas de la página actual
    const [total, setTotal] = useState(0); // total de registros (campo count de DRF)
    const [page, setPage] = useState(1);
    const [search, setSearchState] = useState('');
    const [ordering, setOrderingState] = useState(ordenInicial);
    const [filtros, setFiltros] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [version, setVersion] = useState(0); // se incrementa en reload() para volver a consultar

    // Objetos serializados: así el efecto solo se dispara cuando su contenido cambia, no su referencia.
    const clavesFijas = JSON.stringify(fijos);
    const clavesFiltros = JSON.stringify(filtros);

    // Consulta la API cada vez que cambia la página, búsqueda, orden o filtros.
    useEffect(() => {
        // "activo" descarta respuestas obsoletas si el usuario cambió de filtro antes de que llegaran.
        let activo = true;
        setCargando(true);
        servicio.listar({ ...JSON.parse(clavesFiltros), ...JSON.parse(clavesFijas), search, ordering, page })
            .then(data => {
                if (!activo) return;
                // Si se eliminó el último registro de la página, retrocede a la anterior.
                if (data.results.length === 0 && page > 1) { setPage(page - 1); return; }
                setItems(data.results);
                setTotal(data.count);
                setError('');
                setCargando(false);
            })
            .catch(err => {
                if (!activo) return;
                if (err.response?.status === 404 && page > 1) { setPage(1); return; }
                setError(getError(err));
                setCargando(false);
            });
        return () => { activo = false; };
    }, [servicio, clavesFijas, clavesFiltros, search, ordering, page, version, recarga]);

    // Los setters de búsqueda, orden y filtros vuelven a la página 1 porque cambia el conjunto de resultados.
    const reload = useCallback(() => setVersion(v => v + 1), []);
    const setSearch = valor => { setPage(1); setSearchState(valor); };
    const setOrdering = valor => { setPage(1); setOrderingState(valor); };
    const setFiltro = (nombre, valor) => { setPage(1); setFiltros(actual => ({ ...actual, [nombre]: valor })); };
    const limpiarFiltros = () => { setPage(1); setFiltros({}); setSearchState(''); setOrderingState(ordenInicial); };

    return {
        items, total, totalPaginas: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        page, setPage, search, setSearch, ordering, setOrdering,
        filtros, setFiltro, limpiarFiltros, cargando, error, setError, reload,
    };
}
