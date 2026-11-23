import OrdenesPanel from './compras/OrdenesPanel.jsx';

// Módulo Compras: listado de órdenes (el detalle y sus líneas están en CompraDetallePage).
export default function ComprasPage() {
    return (
        <div>
            <h1 className="h3 fw-bold mb-1">Compras</h1>
            <p className="text-secondary mb-4">
                Órdenes de compra: borrador → enviada → recibida. Al recibir, el inventario del almacén se actualiza automáticamente.
            </p>
            <OrdenesPanel />
        </div>
    );
}
