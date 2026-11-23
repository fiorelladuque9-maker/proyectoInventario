// Controles Anterior/Siguiente con el resumen "Página X de Y · N registros". onCambiar recibe el nuevo número de página.
export default function Paginacion({ pagina, totalPaginas, total, onCambiar }) {
    return (
        <div className="d-flex justify-content-between align-items-center mt-3">
            <button className="btn btn-outline-secondary btn-sm" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
                <i className="bi bi-chevron-left" /> Anterior
            </button>
            <span className="small text-secondary text-center">
                Página {pagina} de {totalPaginas} · {total} registro{total === 1 ? '' : 's'}
            </span>
            <button className="btn btn-outline-secondary btn-sm" disabled={pagina >= totalPaginas} onClick={() => onCambiar(pagina + 1)}>
                Siguiente <i className="bi bi-chevron-right" />
            </button>
        </div>
    );
}
