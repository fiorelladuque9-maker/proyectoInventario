import { useMemo, useState } from 'react';
import PanelRecurso from '../../components/PanelRecurso.jsx';
import { useOpciones } from '../../hooks/useOpciones.js';
import { productoService } from '../../services/catalogoService.js';
import { almacenService, existenciaBajoMinimoService, existenciaService } from '../../services/inventarioService.js';
import { numero } from '../../utils/formato.js';
import { ETIQUETAS } from '../../utils/opciones.js';

const columnas = [
    { titulo: 'Almacén', render: e => e.almacen_nombre },
    { titulo: 'SKU', render: e => e.producto_sku },
    { titulo: 'Producto', render: e => e.producto_nombre },
    { titulo: 'Saldo', clase: 'text-end', render: e => numero(e.cantidad) },
];

const ORDENES = [
    { value: 'producto__nombre', label: 'Producto (A-Z)' },
    { value: 'cantidad', label: 'Saldo (menor)' },
    { value: '-cantidad', label: 'Saldo (mayor)' },
];

// Solo lectura: el saldo cambia únicamente con recepciones, salidas y cierres de conteo.
export default function ExistenciasPanel() {
    // Interruptor que cambia el origen de datos: existencias normales o endpoint /existencias/bajo-minimo/.
    const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);
    const almacenes = useOpciones(almacenService, ETIQUETAS.almacen);
    const productos = useOpciones(productoService, ETIQUETAS.producto);
    const filtros = useMemo(() => [
        { name: 'almacen', label: 'Almacén', opciones: almacenes.opciones },
        { name: 'producto', label: 'Producto', opciones: productos.opciones },
    ], [almacenes.opciones, productos.opciones]);

    return (
        <div>
            <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" role="switch" id="bajo-minimo" checked={soloBajoMinimo}
                    onChange={e => setSoloBajoMinimo(e.target.checked)} />
                <label className="form-check-label" htmlFor="bajo-minimo">
                    Mostrar solo existencias por debajo del stock mínimo
                </label>
            </div>
            <PanelRecurso
                // La "key" reinicia el panel (página, filtros) al alternar entre las dos vistas.
                key={soloBajoMinimo ? 'bajo' : 'todas'}
                titulo={soloBajoMinimo ? 'Existencias bajo el mínimo' : 'Existencias por almacén'} singular="Existencia"
                servicio={soloBajoMinimo ? existenciaBajoMinimoService : existenciaService} columnas={columnas}
                busqueda="Buscar por SKU, producto o almacén" filtros={filtros} ordenes={ORDENES}
                mensajeVacio={soloBajoMinimo ? 'Ninguna existencia está por debajo de su mínimo.' : undefined}
            />
        </div>
    );
}
