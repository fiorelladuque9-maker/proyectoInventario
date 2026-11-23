import { useMemo } from 'react';
import PanelRecurso from '../../components/PanelRecurso.jsx';
import { SiNo } from '../../components/EstadoBadge.jsx';
import { useOpciones } from '../../hooks/useOpciones.js';
import { categoriaService, productoService } from '../../services/catalogoService.js';
import { numero } from '../../utils/formato.js';
import { cargarSelect, ETIQUETAS, OPCIONES_ACTIVO, UNIDADES } from '../../utils/opciones.js';

// CRUD de productos. La categoría se elige de un select cargado desde la API; la unidad es una lista fija.
const campos = [
    { name: 'sku', label: 'SKU', required: true, maxLength: 40 },
    { name: 'nombre', label: 'Nombre', required: true, maxLength: 160 },
    { name: 'categoria', label: 'Categoría', type: 'select', required: true, cargarOpciones: cargarSelect(categoriaService, ETIQUETAS.categoria) },
    { name: 'unidad', label: 'Unidad de medida', type: 'select', required: true, opciones: UNIDADES, defecto: 'unidad' },
    { name: 'stock_minimo', label: 'Stock mínimo', type: 'number', required: true, min: 0, step: '0.001', defecto: '0' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', columnas: 'col-md-12' },
    { name: 'activo', label: 'Activo', type: 'checkbox' },
];

// Opciones del selector "Ordenar por" (el valor se envía a la API como ?ordering=).
const ORDENES = [
    { value: 'nombre', label: 'Nombre (A-Z)' }, { value: '-nombre', label: 'Nombre (Z-A)' },
    { value: 'sku', label: 'SKU' }, { value: '-stock_minimo', label: 'Stock mínimo (mayor)' },
    { value: 'stock_minimo', label: 'Stock mínimo (menor)' }, { value: '-creado_en', label: 'Más recientes' },
];

export default function ProductosPanel({ onCambio }) {
    // Categorías cargadas una vez: sirven para el filtro y para mostrar el nombre en lugar del id en la tabla.
    const categorias = useOpciones(categoriaService, ETIQUETAS.categoria);
    const filtros = useMemo(() => [
        { name: 'categoria', label: 'Categoría', opciones: categorias.opciones },
        { name: 'unidad', label: 'Unidad', opciones: UNIDADES },
        { name: 'activo', label: 'Activo', opciones: OPCIONES_ACTIVO },
    ], [categorias.opciones]);

    const columnas = [
        { titulo: 'SKU', render: p => p.sku },
        { titulo: 'Nombre', render: p => p.nombre },
        { titulo: 'Categoría', render: p => categorias.mapa[String(p.categoria)] || `#${p.categoria}` },
        { titulo: 'Unidad', render: p => p.unidad },
        { titulo: 'Stock mínimo', clase: 'text-end', render: p => numero(p.stock_minimo) },
        // El stock total (suma de todos los almacenes) se pinta en rojo si está bajo el mínimo.
        {
            titulo: 'Stock total', clase: 'text-end',
            render: p => <span className={Number(p.stock_total) < Number(p.stock_minimo) ? 'text-danger fw-semibold' : ''}>{numero(p.stock_total)}</span>,
        },
        { titulo: 'Activo', render: p => <SiNo valor={p.activo} /> },
    ];

    return (
        <PanelRecurso
            titulo="Productos" singular="Producto" servicio={productoService} campos={campos} columnas={columnas}
            busqueda="Buscar por SKU, nombre o descripción" filtros={filtros} ordenes={ORDENES}
            etiquetaFila={p => p.sku} onCambio={onCambio}
        />
    );
}
