import { useMemo } from 'react';
import PanelRecurso from '../../components/PanelRecurso.jsx';
import { SiNo } from '../../components/EstadoBadge.jsx';
import { useOpciones } from '../../hooks/useOpciones.js';
import { productoService } from '../../services/catalogoService.js';
import { ofertaService, proveedorService } from '../../services/proveedorService.js';
import { moneda } from '../../utils/formato.js';
import { cargarSelect, ETIQUETAS } from '../../utils/opciones.js';

// Campos del formulario: ambos selects se cargan desde la API (proveedores y productos).
const campos = [
    { name: 'proveedor', label: 'Proveedor', type: 'select', required: true, cargarOpciones: cargarSelect(proveedorService, ETIQUETAS.proveedor) },
    { name: 'producto', label: 'Producto', type: 'select', required: true, cargarOpciones: cargarSelect(productoService, ETIQUETAS.producto) },
    { name: 'codigo_proveedor', label: 'Código del proveedor', maxLength: 60 },
    { name: 'costo_referencial', label: 'Costo referencial (₡)', type: 'number', required: true, min: 0, step: '0.01' },
    { name: 'preferido', label: 'Proveedor preferido para este producto', type: 'checkbox', defecto: false },
];

const ORDENES = [
    { value: 'costo_referencial', label: 'Costo (menor a mayor)' },
    { value: '-costo_referencial', label: 'Costo (mayor a menor)' },
];

// Relación N:M proveedor-producto con datos propios (costo, código, preferencia).
export default function OfertasPanel({ onCambio }) {
    // Listas completas para los filtros y para traducir ids a nombres en la tabla.
    const proveedores = useOpciones(proveedorService, ETIQUETAS.proveedor);
    const productos = useOpciones(productoService, ETIQUETAS.producto);
    const filtros = useMemo(() => [
        { name: 'proveedor', label: 'Proveedor', opciones: proveedores.opciones },
        { name: 'producto', label: 'Producto', opciones: productos.opciones },
        { name: 'preferido', label: 'Preferido', opciones: [{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }] },
    ], [proveedores.opciones, productos.opciones]);

    const columnas = [
        { titulo: 'Proveedor', render: o => proveedores.mapa[String(o.proveedor)] || `#${o.proveedor}` },
        { titulo: 'Producto', render: o => productos.mapa[String(o.producto)] || `#${o.producto}` },
        { titulo: 'Código proveedor', render: o => o.codigo_proveedor || '—' },
        { titulo: 'Costo referencial', clase: 'text-end', render: o => moneda(o.costo_referencial) },
        { titulo: 'Preferido', render: o => <SiNo valor={o.preferido} /> },
    ];

    return (
        <PanelRecurso
            titulo="Ofertas proveedor-producto" singular="Oferta" servicio={ofertaService} campos={campos} columnas={columnas}
            busqueda="Buscar por proveedor, producto o SKU" filtros={filtros} ordenes={ORDENES}
            etiquetaFila={o => `#${o.id}`} onCambio={onCambio}
        />
    );
}
