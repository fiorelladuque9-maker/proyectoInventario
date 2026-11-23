// Ventana modal de Bootstrap controlada desde React (sin depender del JS de Bootstrap).
export default function Modal({ titulo, children, onClose }) {
    return (
        <>
            <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header">
                            <h2 className="modal-title h5 fw-bold">{titulo}</h2>
                            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
                        </div>
                        <div className="modal-body">{children}</div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
}
