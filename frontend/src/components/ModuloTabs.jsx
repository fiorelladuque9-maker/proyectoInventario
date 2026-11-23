import { useSearchParams } from 'react-router-dom';

// Pestañas de un módulo; la pestaña activa queda en la URL (?tab=...) para poder enlazarla.
export default function ModuloTabs({ pestanas }) {
    const [params, setParams] = useSearchParams();
    const activa = pestanas.find(p => p.clave === params.get('tab')) || pestanas[0];
    return (
        <>
            <ul className="nav nav-tabs mb-4 flex-nowrap overflow-auto">
                {pestanas.map(p => (
                    <li className="nav-item" key={p.clave}>
                        <button
                            type="button"
                            className={`nav-link text-nowrap ${p.clave === activa.clave ? 'active' : ''}`}
                            onClick={() => setParams({ tab: p.clave }, { replace: true })}
                        >
                            <i className={`bi bi-${p.icono} me-2`} />{p.titulo}
                        </button>
                    </li>
                ))}
            </ul>
            <div key={activa.clave}>{activa.contenido}</div>
        </>
    );
}
