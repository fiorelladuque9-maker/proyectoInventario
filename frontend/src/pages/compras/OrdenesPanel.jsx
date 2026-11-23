import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import EstadoBadge from '../../components/EstadoBadge.jsx';
import PanelRecurso from '../../components/PanelRecurso.jsx';
import { useOpciones } from '../../hooks/useOpciones.js';
import { ordenService } from '../../services/compraService.js';
import { proveedorService } from '../../services/proveedorService.js';
import { fecha } from '../../utils/formato.js';
import { cargarSelect, ETIQUETAS } from '../../utils/opciones.js';
import AccionesOrden from './AccionesOrden.jsx';

// Estados posibles de una orden, usados en el filtro.
const ESTADOS =['borrador', 'enviada', 'recibida', 'cancelada'].map(e => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }));

// Formulario: el proveedor solo se elige al crear (soloCrear) y únicamente entre los activos.
const campos = [
    {
        name: 'proveedor', label: 'Proveedor', type: 'select', required: true, soloCrear: true,
        cargarOpciones: cargarSelect(proveedorService, ETIQUETAS.proveedor, { activo: 'true' }),
        ayuda: 'Solo proveedores activos. El proveedor no cambia después de crear la orden.',
    },
    { name: 'notas', label: 'Notas', type: 'textarea', columnas: 'col-md-12' },
];

const ORDENES = [
    { value: '-creada_en', label: 'Más recientes' }, { value: 'creada_en', label: 'Más antiguas' },
    { value: 'estado', label: 'Estado' },
];

export default function OrdenesPanel({ onCambio }) {
    const proveedores = useOpciones(proveedorService, ETIQUETAS.proveedor);
    const filtros = useMemo(() => [
        { name: 'estado', label: 'Estado', opciones: ESTADOS },
        { name: 'proveedor', label: 'Proveedor', opciones: proveedores.opciones },
    ], [proveedores.opciones]);

    const columnas = [
        { titulo: 'Orden', render: o => `#${o.id}` },
        { titulo: 'Proveedor', render: o => proveedores.mapa[String(o.proveedor)] || `#${o.proveedor}` },
        { titulo: 'Estado', render: o => <EstadoBadge valor={o.estado} /> },
        { titulo: 'Creada', render: o => fecha(o.creada_en) },
        { titulo: 'Notas', render: o => o.notas || '—' },
    ];

    return (
        <PanelRecurso
            titulo="Órdenes de compra" singular="Orden de compra" textoNuevo="Nueva orden" servicio={ordenService}
            campos={campos} columnas={columnas} busqueda="Buscar por proveedor o notas" filtros={filtros} ordenes={ORDENES}
            // Las órdenes recibidas o canceladas ya no se pueden editar.
            puedeEditar={o => ['borrador', 'enviada'].includes(o.estado)}
            etiquetaFila={o => `#${o.id}`} onCambio={onCambio}
            // Botones extra por fila: enlace al detalle y acciones de negocio (enviar / recibir).
            acciones={(orden, recargar, { setError, setExito }) => (
                <>
                    <Link to={`/compras/${orden.id}`} className="btn btn-outline-secondary btn-sm" title="Ver detalle y líneas">
                        <i className="bi bi-eye me-1" />Detalle
                    </Link>
                    <AccionesOrden orden={orden} onCambio={recargar} setError={setError} setExito={setExito} />
                </>
            )}
        />
    );
}
