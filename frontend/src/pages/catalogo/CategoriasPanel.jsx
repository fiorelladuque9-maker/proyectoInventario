import PanelRecurso from '../../components/PanelRecurso.jsx';
import { SiNo } from '../../components/EstadoBadge.jsx';
import { categoriaService } from '../../services/catalogoService.js';
import { OPCIONES_ACTIVO } from '../../utils/opciones.js';

// CRUD de categorías: se configura PanelRecurso con sus campos de formulario, columnas, búsqueda, filtro y orden.
// Campos del formulario (la forma de cada campo está descrita en FormEntidad).
const campos = [
    { name: 'nombre', label: 'Nombre', required: true, maxLength: 100 },
    { name: 'activa', label: 'Activa', type: 'checkbox' },
];

// Columnas de la tabla: render recibe la fila devuelta por la API.
const columnas = [
    { titulo: 'ID', render: c => c.id },
    { titulo: 'Nombre', render: c => c.nombre },
    { titulo: 'Productos', render: c => c.cantidad_productos },
    { titulo: 'Activa', render: c => <SiNo valor={c.activa} /> },
];

export default function CategoriasPanel({ onCambio }) {
    return (
        <PanelRecurso
            titulo="Categorías" singular="Categoría" servicio={categoriaService} campos={campos} columnas={columnas}
            busqueda="Buscar por nombre" filtros={[{ name: 'activa', label: 'Activa', opciones: OPCIONES_ACTIVO }]}
            ordenes={[{ value: 'nombre', label: 'Nombre (A-Z)' }, { value: '-nombre', label: 'Nombre (Z-A)' }]}
            etiquetaFila={c => c.nombre} onCambio={onCambio}
        />
    );
}
