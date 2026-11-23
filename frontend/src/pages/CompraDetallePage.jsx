import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getError } from '../api/client.js';
import Alerta from '../components/Alerta.jsx';
import EstadoBadge from '../components/EstadoBadge.jsx';
import PanelRecurso from '../components/PanelRecurso.jsx';
import { useOpciones } from '../hooks/useOpciones.js';
import { productoService } from '../services/catalogoService.js';
import { lineaCompraService, ordenService } from '../services/compraService.js';
import { ofertaService, proveedorService } from '../services/proveedorService.js';
import { fecha, moneda, numero } from '../utils/formato.js';
import { ETIQUETAS } from '../utils/opciones.js';
import AccionesOrden from './compras/AccionesOrden.jsx';

// Detalle de una orden (ruta /compras/:id): datos de la orden y CRUD de sus líneas.
export default function CompraDetallePage() {
    const { id } = useParams(); // id de la orden tomado de la URL
    const [orden, setOrden] = useState(null);
    const [proveedor, setProveedor] = useState(null);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [recarga, setRecarga] = useState(0); // al incrementarse, recarga la orden y la tabla de líneas
    const productos = useOpciones(productoService, ETIQUETAS.producto);

    // Consulta la orden y su proveedor.
    const cargar = useCallback(async () => {
        try {
            const o = await ordenService.obtener(id);
            setOrden(o);
            setProveedor(await proveedorService.obtener(o.proveedor));
            setError('');
        } catch (err) {
            setError(getError(err));
        }
    }, [id]);

    useEffect(() => { cargar(); }, [cargar, recarga]);

    // Solo se pueden elegir productos que el proveedor de la orden ofrece (regla del backend).
    const campos = useMemo(() => orden ? [
        {
            name: 'producto', label: 'Producto del proveedor', type: 'select', required: true, soloCrear: true,
            claveOpciones: String(orden.proveedor),
            cargarOpciones: async () => {
                const ofertas = await ofertaService.todos({ proveedor: orden.proveedor });
                return ofertas.map(o => ({ value: String(o.producto), label: productos.mapa[String(o.producto)] || `Producto #${o.producto}` }));
            },
        },
        { name: 'cantidad', label: 'Cantidad', type: 'number', required: true, minExclusivo: 0, step: '0.001' },
        { name: 'costo_unitario', label: 'Costo unitario (₡)', type: 'number', required: true, min: 0, step: '0.01' },
    ] : [], [orden, productos.mapa]);

    const cambio = () => setRecarga(r => r + 1);
    // Una orden recibida o cancelada queda de solo lectura (sin agregar, editar ni eliminar líneas).
    const cerrada = orden && ['recibida', 'cancelada'].includes(orden.estado);

    const columnas = [
        { titulo: 'Producto', render: l => productos.mapa[String(l.producto)] || `#${l.producto}` },
        { titulo: 'Cantidad', clase: 'text-end', render: l => numero(l.cantidad) },
        { titulo: 'Costo unitario', clase: 'text-end', render: l => moneda(l.costo_unitario) },
        { titulo: 'Subtotal', clase: 'text-end', render: l => moneda(Number(l.cantidad) * Number(l.costo_unitario)) },
        { titulo: 'Recibida', clase: 'text-end', render: l => numero(l.cantidad_recibida) },
    ];

    return (
        <div>
            <Link to="/compras" className="small text-decoration-none"><i className="bi bi-arrow-left me-1" />Volver a compras</Link>
            <h1 className="h3 fw-bold mt-2 mb-3">Orden de compra #{id}</h1>
            <Alerta mensaje={error} />
            <Alerta tipo="success" mensaje={exito} onClose={() => setExito('')} />

            {orden && (
                <section className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4 d-flex flex-wrap gap-4 align-items-center">
                        <div><div className="small text-secondary">Proveedor</div><div className="fw-semibold">{proveedor?.nombre || '...'}</div></div>
                        <div><div className="small text-secondary">Estado</div><EstadoBadge valor={orden.estado} /></div>
                        <div><div className="small text-secondary">Creada</div><div>{fecha(orden.creada_en)}</div></div>
                        <div className="flex-grow-1"><div className="small text-secondary">Notas</div><div>{orden.notas || '—'}</div></div>
                        <div><AccionesOrden orden={orden} onCambio={cambio} setError={setError} setExito={setExito} /></div>
                    </div>
                </section>
            )}

            {orden && cerrada && (
                <Alerta tipo="info" mensaje="Esta orden está cerrada: sus líneas ya no se pueden modificar." />
            )}

            {orden && (
                <PanelRecurso
                    titulo="Líneas de la orden" singular="Línea" textoNuevo="Agregar producto" servicio={lineaCompraService}
                    fijos={{ orden: id }} recarga={recarga} campos={cerrada ? null : campos} columnas={columnas}
                    // La línea siempre pertenece a esta orden: se agrega su id al cuerpo enviado.
                    aPayload={payload => ({ ...payload, orden: Number(id) })}
                    sinEditar={cerrada} sinEliminar={cerrada} etiquetaFila={l => `#${l.id}`}
                    mensajeVacio="La orden aún no tiene productos. Agregue al menos uno para poder enviarla."
                    onCambio={cambio}
                />
            )}
        </div>
    );
}
