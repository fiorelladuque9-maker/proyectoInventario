import ConteosPanel from './conteos/ConteosPanel.jsx';

// Módulo Conteos: listado de conteos físicos (el detalle y sus líneas están en ConteoDetallePage).
export default function ConteosPage() {
    return (
        <div>
            <h1 className="h3 fw-bold mb-1">Conteos de inventario</h1>
            <p className="text-secondary mb-4">
                Conteos físicos por almacén. Al cerrarlos se concilian las diferencias contra el sistema y se ajustan las existencias.
            </p>
            <ConteosPanel />
        </div>
    );
}
