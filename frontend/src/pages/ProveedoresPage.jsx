import ModuloTabs from '../components/ModuloTabs.jsx';
import OfertasPanel from './proveedores/OfertasPanel.jsx';
import ProveedoresPanel from './proveedores/ProveedoresPanel.jsx';

// Módulo Proveedores: pestaña de proveedores y pestaña de ofertas (relación N:M proveedor-producto).
export default function ProveedoresPage() {
    return (
        <div>
            <h1 className="h3 fw-bold mb-1">Proveedores</h1>
            <p className="text-secondary mb-4">Proveedores y su catálogo de ofertas con costos de referencia.</p>
            <ModuloTabs pestanas={[
                { clave: 'proveedores', titulo: 'Proveedores', icono: 'truck', contenido: <ProveedoresPanel /> },
                { clave: 'ofertas', titulo: 'Ofertas por producto', icono: 'tag', contenido: <OfertasPanel /> },
            ]} />
        </div>
    );
}
