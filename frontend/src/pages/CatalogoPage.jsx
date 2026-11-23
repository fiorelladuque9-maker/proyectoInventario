import ModuloTabs from '../components/ModuloTabs.jsx';
import CategoriasPanel from './catalogo/CategoriasPanel.jsx';
import ProductosPanel from './catalogo/ProductosPanel.jsx';

// Módulo Catálogo: dos pestañas (?tab=productos | categorias) con CRUD completo.
export default function CatalogoPage() {
    return (
        <div>
            <h1 className="h3 fw-bold mb-1">Catálogo</h1>
            <p className="text-secondary mb-4">Categorías y productos con su unidad de medida y stock mínimo.</p>
            <ModuloTabs pestanas={[
                { clave: 'productos', titulo: 'Productos', icono: 'box-seam', contenido: <ProductosPanel /> },
                { clave: 'categorias', titulo: 'Categorías', icono: 'tags', contenido: <CategoriasPanel /> },
            ]} />
        </div>
    );
}
