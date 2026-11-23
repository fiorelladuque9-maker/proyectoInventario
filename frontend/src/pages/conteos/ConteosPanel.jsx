import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import EstadoBadge from '../../components/EstadoBadge.jsx';
import PanelRecurso from '../../components/PanelRecurso.jsx';
import { useOpciones } from '../../hooks/useOpciones.js';
import { conteoService } from '../../services/conteoService.js';
import { almacenService } from '../../services/inventarioService.js';
import { fecha } from '../../utils/formato.js';
import { cargarSelect, ETIQUETAS } from '../../utils/opciones.js';
import AccionCerrar from './AccionCerrar.jsx';

const ESTADOS = [{ value: 'abierto', label: 'Abierto' }, { value: 'cerrado', label: 'Cerrado' }];

// Formulario: solo se elige el almacén a contar (entre los activos) y no se puede cambiar después.
const campos = [
    {
        name: 'almacen', label: 'Almacén a contar', type: 'select', required: true, soloCrear: true,
        cargarOpciones: cargarSelect(almacenService, ETIQUETAS.almacen, { activo: 'true' }),
    },
];

const ORDENES = [
    { value: '-creado_en', label: 'Más recientes' }, { value: 'creado_en', label: 'Más antiguos' },
    { value: '-cerrado_en', label: 'Cierre reciente' },
];

export default function ConteosPanel({ onCambio }) {
    const almacenes = useOpciones(almacenService, ETIQUETAS.almacen);
    const filtros = useMemo(() => [
        { name: 'estado', label: 'Estado', opciones: ESTADOS },
        { name: 'almacen', label: 'Almacén', opciones: almacenes.opciones },
    ], [almacenes.opciones]);

    const columnas = [
        { titulo: 'Conteo', render: c => `#${c.id}` },
        { titulo: 'Almacén', render: c => almacenes.mapa[String(c.almacen)] || `#${c.almacen}` },
        { titulo: 'Estado', render: c => <EstadoBadge valor={c.estado} /> },
        { titulo: 'Creado', render: c => fecha(c.creado_en) },
        { titulo: 'Cerrado', render: c => fecha(c.cerrado_en) },
    ];

    return (
        <PanelRecurso
            titulo="Conteos de inventario" singular="Conteo" textoNuevo="Nuevo conteo" servicio={conteoService}
            campos={campos} columnas={columnas} busqueda="Buscar por almacén" filtros={filtros} ordenes={ORDENES}
            // Un conteo cerrado ya no se puede editar.
            puedeEditar={c => c.estado === 'abierto'} etiquetaFila={c => `#${c.id}`} onCambio={onCambio}
            // Botones extra por fila: enlace al detalle y botón para cerrar el conteo.
            acciones={(conteo, recargar, { setError, setExito }) => (
                <>
                    <Link to={`/conteos/${conteo.id}`} className="btn btn-outline-secondary btn-sm" title="Ver detalle y líneas">
                        <i className="bi bi-eye me-1" />Detalle
                    </Link>
                    <AccionCerrar conteo={conteo} onCambio={recargar} setError={setError} setExito={setExito} />
                </>
            )}
        />
    );
}
