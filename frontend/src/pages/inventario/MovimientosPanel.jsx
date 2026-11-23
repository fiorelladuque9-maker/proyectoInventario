import { useMemo } from 'react';
import EstadoBadge from '../../components/EstadoBadge.jsx';
import PanelRecurso from '../../components/PanelRecurso.jsx';
import { useOpciones } from '../../hooks/useOpciones.js';
import { productoService } from '../../services/catalogoService.js';
import { almacenService, salidaService } from '../../services/inventarioService.js';
import { fecha, numero } from '../../utils/formato.js';
import { cargarSelect, ETIQUETAS } from '../../utils/opciones.js';

// Tipos de movimiento para el filtro: entrada (recepciones), salida (manual) y ajuste (cierre de conteo).
const TIPOS =[{ value: 'entrada', label: 'Entrada' }, { value: 'salida', label: 'Salida' }, { value: 'ajuste', label: 'Ajuste' }];

const ORDENES = [
    { value: '-creado_en', label: 'Más recientes' }, { value: 'creado_en', label: 'Más antiguos' },
    { value: '-cantidad', label: 'Cantidad (mayor)' }, { value: 'cantidad', label: 'Cantidad (menor)' },
];

// El formulario registra una salida manual (acción de negocio); el historial no se edita ni se elimina.
const campos = [
    { name: 'almacen', label: 'Almacén', type: 'select', required: true, cargarOpciones: cargarSelect(almacenService, ETIQUETAS.almacen, { activo: 'true' }) },
    { name: 'producto', label: 'Producto', type: 'select', required: true, cargarOpciones: cargarSelect(productoService, ETIQUETAS.producto, { activo: 'true' }) },
    { name: 'cantidad', label: 'Cantidad', type: 'number', required: true, minExclusivo: 0, step: '0.001' },
    { name: 'referencia', label: 'Referencia / motivo', maxLength: 120 },
];

// Historial de movimientos con filtros; el botón "Registrar salida" usa salidaService (POST movimientos/registrar-salida/).
export default function MovimientosPanel({ onCambio }) {
    const almacenes = useOpciones(almacenService, ETIQUETAS.almacen);
    const productos = useOpciones(productoService, ETIQUETAS.producto);
    const filtros = useMemo(() => [
        { name: 'tipo', label: 'Tipo', opciones: TIPOS },
        { name: 'almacen', label: 'Almacén', opciones: almacenes.opciones },
        { name: 'producto', label: 'Producto', opciones: productos.opciones },
    ], [almacenes.opciones, productos.opciones]);

    const columnas = [
        { titulo: 'Fecha', render: m => fecha(m.creado_en) },
        { titulo: 'Tipo', render: m => <EstadoBadge valor={m.tipo} /> },
        { titulo: 'Almacén', render: m => almacenes.mapa[String(m.almacen)] || `#${m.almacen}` },
        { titulo: 'Producto', render: m => productos.mapa[String(m.producto)] || `#${m.producto}` },
        { titulo: 'Cantidad', clase: 'text-end', render: m => numero(m.cantidad) },
        { titulo: 'Referencia', render: m => m.referencia || '—' },
    ];

    return (
        <PanelRecurso
            titulo="Historial de movimientos" singular="Salida" textoNuevo="Registrar salida" servicio={salidaService}
            campos={campos} columnas={columnas} sinEditar sinEliminar busqueda="Buscar por referencia, SKU o producto"
            filtros={filtros} ordenes={ORDENES} onCambio={onCambio}
        />
    );
}
