import PanelRecurso from '../../components/PanelRecurso.jsx';
import { SiNo } from '../../components/EstadoBadge.jsx';
import { almacenService } from '../../services/inventarioService.js';
import { OPCIONES_ACTIVO } from '../../utils/opciones.js';

// CRUD de almacenes (bodegas donde se guardan las existencias).
const campos = [
    { name: 'nombre', label: 'Nombre', required: true, maxLength: 120 },
    { name: 'ubicacion', label: 'Ubicación', maxLength: 200 },
    { name: 'activo', label: 'Activo', type: 'checkbox' },
];

const columnas = [
    { titulo: 'ID', render: a => a.id },
    { titulo: 'Nombre', render: a => a.nombre },
    { titulo: 'Ubicación', render: a => a.ubicacion || '—' },
    { titulo: 'Activo', render: a => <SiNo valor={a.activo} /> },
];

export default function AlmacenesPanel({ onCambio }) {
    return (
        <PanelRecurso
            titulo="Almacenes" singular="Almacén" servicio={almacenService} campos={campos} columnas={columnas}
            busqueda="Buscar por nombre o ubicación" filtros={[{ name: 'activo', label: 'Activo', opciones: OPCIONES_ACTIVO }]}
            ordenes={[{ value: 'nombre', label: 'Nombre (A-Z)' }, { value: '-nombre', label: 'Nombre (Z-A)' }]}
            etiquetaFila={a => a.nombre} onCambio={onCambio}
        />
    );
}
