import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getError } from '../api/client.js';
import Alerta from '../components/Alerta.jsx';
import EstadoBadge from '../components/EstadoBadge.jsx';
import PanelRecurso from '../components/PanelRecurso.jsx';
import { useOpciones } from '../hooks/useOpciones.js';
import { productoService } from '../services/catalogoService.js';
import { conteoService, lineaConteoService } from '../services/conteoService.js';
import { almacenService } from '../services/inventarioService.js';
import { fecha, numero } from '../utils/formato.js';
import { cargarSelect, ETIQUETAS } from '../utils/opciones.js';
import AccionCerrar from './conteos/AccionCerrar.jsx';

// Formulario de líneas: el producto se elige al agregar; la cantidad contada se puede completar o corregir luego.
const campos = [
    {
        name: 'producto', label: 'Producto', type: 'select', required: true, soloCrear: true,
        cargarOpciones: cargarSelect(productoService, ETIQUETAS.producto, { activo: 'true' }),
        ayuda: 'Al agregarlo se guarda una fotografía del saldo actual del sistema en el almacén.',
    },
    { name: 'cantidad_contada', label: 'Cantidad contada', type: 'number', min: 0, step: '0.001', ayuda: 'Obligatoria para poder cerrar el conteo.' },
];

// Detalle de un conteo (ruta /conteos/:id): datos del conteo y CRUD de sus líneas mientras esté abierto.
export default function ConteoDetallePage() {
    const { id } = useParams(); // id del conteo tomado de la URL
    const [conteo, setConteo] = useState(null);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [recarga, setRecarga] = useState(0); // al incrementarse, recarga el conteo y la tabla de líneas
    const productos = useOpciones(productoService, ETIQUETAS.producto);
    const almacenes = useOpciones(almacenService, ETIQUETAS.almacen);

    const cargar = useCallback(async () => {
        try {
            setConteo(await conteoService.obtener(id));
            setError('');
        } catch (err) {
            setError(getError(err));
        }
    }, [id]);

    useEffect(() => { cargar(); }, [cargar, recarga]);

    const abierto = conteo?.estado === 'abierto';
    const cambio = () => setRecarga(r => r + 1);

    const columnas = useMemo(() => [
        { titulo: 'Producto', render: l => productos.mapa[String(l.producto)] || `#${l.producto}` },
        { titulo: 'Sistema', clase: 'text-end', render: l => numero(l.cantidad_sistema) },
        { titulo: 'Contada', clase: 'text-end', render: l => (l.cantidad_contada === null ? <span className="text-secondary">Pendiente</span> : numero(l.cantidad_contada)) },
        // Diferencia = contada - sistema: verde si sobra, rojo si falta, gris si coincide.
        {
            titulo: 'Diferencia', clase: 'text-end',
            render: l => {
                if (l.diferencia === null) return '—';
                const d = Number(l.diferencia);
                return <span className={d === 0 ? 'text-secondary' : d > 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>{d > 0 ? '+' : ''}{numero(d)}</span>;
            },
        },
    ], [productos.mapa]);

    return (
        <div>
            <Link to="/conteos" className="small text-decoration-none"><i className="bi bi-arrow-left me-1" />Volver a conteos</Link>
            <h1 className="h3 fw-bold mt-2 mb-3">Conteo #{id}</h1>
            <Alerta mensaje={error} />
            <Alerta tipo="success" mensaje={exito} onClose={() => setExito('')} />

            {conteo && (
                <section className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4 d-flex flex-wrap gap-4 align-items-center">
                        <div><div className="small text-secondary">Almacén</div><div className="fw-semibold">{almacenes.mapa[String(conteo.almacen)] || `#${conteo.almacen}`}</div></div>
                        <div><div className="small text-secondary">Estado</div><EstadoBadge valor={conteo.estado} /></div>
                        <div><div className="small text-secondary">Creado</div><div>{fecha(conteo.creado_en)}</div></div>
                        <div className="flex-grow-1"><div className="small text-secondary">Cerrado</div><div>{fecha(conteo.cerrado_en)}</div></div>
                        <div><AccionCerrar conteo={conteo} onCambio={cambio} setError={setError} setExito={setExito} /></div>
                    </div>
                </section>
            )}

            {conteo && !abierto && <Alerta tipo="info" mensaje="Este conteo está cerrado: sus líneas quedaron bloqueadas." />}

            {conteo && (
                <PanelRecurso
                    titulo="Líneas del conteo" singular="Línea" textoNuevo="Agregar producto" servicio={lineaConteoService}
                    fijos={{ conteo: id }} recarga={recarga} campos={abierto ? campos : null} columnas={columnas}
                    // La línea siempre pertenece a este conteo: se agrega su id al cuerpo enviado.
                    aPayload={payload => ({ ...payload, conteo: Number(id) })}
                    sinEditar={!abierto} sinEliminar={!abierto} etiquetaFila={l => `#${l.id}`}
                    mensajeVacio="El conteo aún no tiene productos. Agregue los productos que va a contar."
                    onCambio={cambio}
                />
            )}
        </div>
    );
}
