import { useState } from 'react';
import { getError } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useList } from '../hooks/useList.js';
import Alerta from './Alerta.jsx';
import FormEntidad from './FormEntidad.jsx';
import Paginacion from './Paginacion.jsx';

/**
 * Panel reutilizable de un recurso de la API: formulario crear/editar, barra de búsqueda,
 * filtros, ordenamiento, tabla con estados (cargando/vacío/error), paginación y borrado con confirmación.
 *
 * Props principales:
 *  - servicio: objeto de services/crud.js
 *  - columnas: [{ titulo, render(fila), clase? }]
 *  - campos: definición de los campos del formulario (null = recurso de solo lectura)
 *  - filtros: [{ name, label, opciones | cargarOpciones }]   - ordenes: [{ value, label }]
 *  - acciones(fila, recargar): botones extra por fila   - puedeEditar(fila): permite bloquear filas cerradas
 */
export default function PanelRecurso({
    titulo, singular, servicio, columnas, campos = null, filtros = [], ordenes = [], busqueda = '',
    fijos = {}, aFormulario, aPayload, acciones, puedeEditar = () => true, puedeEliminarFila = () => true,
    sinEditar = false, sinEliminar = false, textoNuevo, ordenInicial = '', recarga = 0, onCambio, etiquetaFila,
    mensajeVacio = 'No hay registros que coincidan con la consulta.',
}) {
    const { puedeEscribir, puedeEliminar } = useAuth(); // permisos del perfil: solo adaptan lo visible
    const lista = useList(servicio, { fijos, ordenInicial: ordenInicial || ordenes[0]?.value || '', recarga });
    const [editando, setEditando] = useState(null); // fila en edición (null = creando)
    const [mostrarForm, setMostrarForm] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [textoBusqueda, setTextoBusqueda] = useState(''); // texto del input; se aplica al enviar el formulario

    const cerrarForm = () => { setEditando(null); setMostrarForm(false); };
    // Tras crear, editar, eliminar o ejecutar una acción: recarga la tabla y avisa al componente padre.
    const avisarCambio = () => { lista.reload(); onCambio?.(); };

    // Crea o actualiza según haya una fila en edición. Devuelve true si salió bien (el formulario se limpia).
    const guardar = async payload => {
        setGuardando(true);
        setExito('');
        try {
            if (editando) await servicio.actualizar(editando.id, payload);
            else await servicio.crear(payload);
            setError('');
            setExito(editando ? `Registro de ${singular.toLowerCase()} actualizado correctamente.` : `Registro de ${singular.toLowerCase()} guardado correctamente.`);
            cerrarForm();
            avisarCambio();
            return true;
        } catch (err) {
            setError(getError(err));
            return false;
        } finally {
            setGuardando(false);
        }
    };

    // Pide confirmación y elimina; si la API responde 409/400 el mensaje se muestra como error.
    const eliminar = async fila => {
        if (!window.confirm(`¿Eliminar ${singular.toLowerCase()} ${etiquetaFila ? etiquetaFila(fila) : `#${fila.id}`}? Esta acción no se puede deshacer.`)) return;
        setExito('');
        try {
            await servicio.eliminar(fila.id);
            setError('');
            setExito(`Registro de ${singular.toLowerCase()} eliminado correctamente.`);
            avisarCambio();
        } catch (err) {
            setError(getError(err));
        }
    };

    // La búsqueda se envía al servidor al pulsar Enter o la lupa.
    const buscar = evento => { evento.preventDefault(); lista.setSearch(textoBusqueda.trim()); };
    // "hayFiltros" decide si se muestra el botón Limpiar (hay búsqueda, filtros u orden distinto al inicial).
    const hayFiltros = Object.values(lista.filtros).some(Boolean) || lista.search || (ordenes.length && lista.ordering !== (ordenInicial || ordenes[0].value));
    const limpiar = () => { setTextoBusqueda(''); lista.limpiarFiltros(); };

    // La columna Acciones aparece solo si hay algo que mostrar según el perfil y la configuración del panel.
    const editable = campos && !sinEditar && puedeEscribir;
    const mostrarAcciones = editable || (!sinEliminar && puedeEliminar) || acciones;
    const errorVisible = error || lista.error;

    return (
        <div>
            <Alerta tipo="danger" mensaje={errorVisible} onClose={() => { setError(''); lista.setError(''); }} />
            <Alerta tipo="success" mensaje={exito} onClose={() => setExito('')} />

            {campos && puedeEscribir && mostrarForm && (
                <FormEntidad
                    titulo={editando ? `Editar ${singular.toLowerCase()} #${editando.id}` : `Registrar ${singular.toLowerCase()}`}
                    campos={campos} registro={editando} aFormulario={aFormulario} aPayload={aPayload}
                    onSubmit={guardar} onCancel={cerrarForm} saving={guardando}
                />
            )}

            <section className="card border-0 shadow-sm">
                <div className="card-body p-3 p-md-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                        <h2 className="h5 fw-bold mb-0">{titulo} ({lista.total})</h2>
                        {campos && puedeEscribir && !mostrarForm && (
                            <button className="btn btn-primary btn-sm" onClick={() => { setEditando(null); setMostrarForm(true); setExito(''); }}>
                                <i className="bi bi-plus-lg me-1" />{textoNuevo || `Agregar ${singular.toLowerCase()}`}
                            </button>
                        )}
                    </div>

                    {(busqueda || filtros.length > 0 || ordenes.length > 0) && (
                        <form onSubmit={buscar} className="row g-2 align-items-end mb-3 toolbar">
                            {busqueda && (
                                <div className="col-12 col-md-4">
                                    <label className="form-label small text-secondary mb-1">Buscar</label>
                                    <div className="input-group input-group-sm">
                                        <input className="form-control" placeholder={busqueda} value={textoBusqueda}
                                            onChange={e => setTextoBusqueda(e.target.value)} />
                                        <button className="btn btn-outline-primary" type="submit" aria-label="Buscar"><i className="bi bi-search" /></button>
                                    </div>
                                </div>
                            )}
                            {filtros.map(f => (
                                <FiltroSelect key={f.name} filtro={f} valor={lista.filtros[f.name] || ''}
                                    onChange={valor => lista.setFiltro(f.name, valor)} />
                            ))}
                            {ordenes.length > 0 && (
                                <div className="col-6 col-md-2">
                                    <label className="form-label small text-secondary mb-1">Ordenar por</label>
                                    <select className="form-select form-select-sm" value={lista.ordering} onChange={e => lista.setOrdering(e.target.value)}>
                                        {ordenes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            )}
                            {hayFiltros && (
                                <div className="col-auto">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={limpiar}>
                                        <i className="bi bi-x-circle me-1" />Limpiar
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    <div className="table-responsive">
                        <table className="table table-striped table-hover align-middle mb-0">
                            <thead className="table-dark">
                                <tr>
                                    {columnas.map(c => <th key={c.titulo} className={c.clase}>{c.titulo}</th>)}
                                    {mostrarAcciones && <th className="text-end">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {lista.cargando ? (
                                    <tr><td colSpan={columnas.length + 1} className="text-center py-4">
                                        <span className="spinner-border spinner-border-sm me-2" />Cargando {titulo.toLowerCase()}...
                                    </td></tr>
                                ) : lista.items.length === 0 ? (
                                    <tr><td colSpan={columnas.length + 1} className="text-center text-secondary py-4">
                                        <i className="bi bi-inbox d-block fs-3" />{mensajeVacio}
                                    </td></tr>
                                ) : lista.items.map(fila => (
                                    <tr key={fila.id}>
                                        {columnas.map(c => <td key={c.titulo} className={c.clase}>{c.render(fila)}</td>)}
                                        {mostrarAcciones && (
                                            <td className="text-nowrap text-end">
                                                {acciones?.(fila, avisarCambio, { setError, setExito })}
                                                {editable && puedeEditar(fila) && (
                                                    <button className="btn btn-outline-primary btn-sm ms-1" title="Editar" aria-label="Editar"
                                                        onClick={() => { setEditando(fila); setMostrarForm(true); setExito(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                                        <i className="bi bi-pencil" />
                                                    </button>
                                                )}
                                                {!sinEliminar && puedeEliminar && puedeEliminarFila(fila) && (
                                                    <button className="btn btn-outline-danger btn-sm ms-1" title="Eliminar" aria-label="Eliminar" onClick={() => eliminar(fila)}>
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Paginacion pagina={lista.page} totalPaginas={lista.totalPaginas} total={lista.total} onCambiar={lista.setPage} />
                </div>
            </section>
        </div>
    );
}

// Select de filtro con la opción "Todos" (valor vacío = sin filtrar).
function FiltroSelect({ filtro, valor, onChange }) {
    return (
        <div className="col-6 col-md-2">
            <label className="form-label small text-secondary mb-1">{filtro.label}</label>
            <select className="form-select form-select-sm" value={valor} onChange={e => onChange(e.target.value)}>
                <option value="">Todos</option>
                {(filtro.opciones || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}
