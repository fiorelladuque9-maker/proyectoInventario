import ModuloTabs from '../components/ModuloTabs.jsx';
import AlmacenesPanel from './inventario/AlmacenesPanel.jsx';
import ExistenciasPanel from './inventario/ExistenciasPanel.jsx';
import MovimientosPanel from './inventario/MovimientosPanel.jsx';

// Módulo Inventario: existencias y movimientos (consulta) y almacenes (CRUD), en pestañas.
export default function InventarioPage() {
    return (
        <div>
            <h1 className="h3 fw-bold mb-1">Inventario</h1>
            <p className="text-secondary mb-4">
                Saldos por almacén y auditoría de movimientos. Los saldos solo cambian por recepciones, salidas y conteos.
            </p>
            <ModuloTabs pestanas={[
                { clave: 'existencias', titulo: 'Existencias', icono: 'boxes', contenido: <ExistenciasPanel /> },
                { clave: 'movimientos', titulo: 'Movimientos', icono: 'arrow-left-right', contenido: <MovimientosPanel /> },
                { clave: 'almacenes', titulo: 'Almacenes', icono: 'building', contenido: <AlmacenesPanel /> },
            ]} />
        </div>
    );
}
