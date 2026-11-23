import PanelRecurso from '../../components/PanelRecurso.jsx';
import { SiNo } from '../../components/EstadoBadge.jsx';
import { proveedorService } from '../../services/proveedorService.js';
import { OPCIONES_ACTIVO } from '../../utils/opciones.js';

// CRUD de proveedores. Identificación, correo y teléfono son opcionales.
const campos = [
    { name: 'nombre', label: 'Nombre', required: true, maxLength: 160 },
    { name: 'identificacion', label: 'Identificación', maxLength: 30 },
    { name: 'correo', label: 'Correo', type: 'email', maxLength: 254 },
    // soloNumeros: el campo solo acepta dígitos (sin letras, guiones ni espacios).
    { name: 'telefono', label: 'Teléfono', maxLength: 30, soloNumeros: true, ayuda: 'Solo números, sin guiones ni espacios.' },
    { name: 'activo', label: 'Activo', type: 'checkbox' },
];

const columnas = [
    { titulo: 'ID', render: p => p.id },
    { titulo: 'Nombre', render: p => p.nombre },
    { titulo: 'Identificación', render: p => p.identificacion || '—' },
    { titulo: 'Correo', render: p => p.correo || '—' },
    { titulo: 'Teléfono', render: p => p.telefono || '—' },
    { titulo: 'Productos', render: p => p.cantidad_productos },
    { titulo: 'Activo', render: p => <SiNo valor={p.activo} /> },
];

export default function ProveedoresPanel({ onCambio }) {
    return (
        <PanelRecurso
            titulo="Proveedores" singular="Proveedor" servicio={proveedorService} campos={campos} columnas={columnas}
            busqueda="Buscar por nombre, identificación o correo"
            filtros={[{ name: 'activo', label: 'Activo', opciones: OPCIONES_ACTIVO }]}
            ordenes={[{ value: 'nombre', label: 'Nombre (A-Z)' }, { value: '-nombre', label: 'Nombre (Z-A)' }]}
            etiquetaFila={p => p.nombre} onCambio={onCambio}
        />
    );
}
