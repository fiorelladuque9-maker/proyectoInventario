import { useEffect } from 'react';

// Mensaje de retroalimentación. Los de éxito se ocultan solos tras unos segundos.
export default function Alerta({ tipo = 'danger', mensaje, onClose }) {
    useEffect(() => {
        if (mensaje && tipo === 'success' && onClose) {
            const id = setTimeout(onClose, 5000);
            return () => clearTimeout(id);
        }
    }, [mensaje, tipo, onClose]);

    if (!mensaje) return null;
    const icono = { success: 'check-circle', danger: 'exclamation-octagon', warning: 'exclamation-triangle', info: 'info-circle' }[tipo];
    return (
        <div role="alert" className={`alert alert-${tipo} d-flex align-items-start gap-2 py-2`}>
            <i className={`bi bi-${icono} mt-1`} />
            <div className="flex-grow-1">{mensaje}</div>
            {onClose && <button type="button" className="btn-close btn-sm" aria-label="Cerrar" onClick={onClose} />}
        </div>
    );
}
