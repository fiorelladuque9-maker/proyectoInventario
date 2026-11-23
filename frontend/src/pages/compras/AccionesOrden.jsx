import { useState } from 'react';
import { getError } from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import Modal from '../../components/Modal.jsx';
import { enviarOrden, recibirOrden } from '../../services/compraService.js';
import { almacenService } from '../../services/inventarioService.js';
import { useOpciones } from '../../hooks/useOpciones.js';
import { ETIQUETAS } from '../../utils/opciones.js';

// Constante fuera del componente para que la referencia no cambie y no se recargue el listado en cada render.
const FILTRO_ACTIVOS = { activo: 'true' };

// Cambios de estado de una orden: enviar (borrador → enviada) y recibir (enviada → recibida).
// Se reutiliza en el listado y en el detalle de la orden.
export default function AccionesOrden({ orden, onCambio, setError, setExito }) {
    const { puedeEscribir } = useAuth();
    const [recibiendo, setRecibiendo] = useState(false); // muestra el modal de recepción
    const [almacen, setAlmacen] = useState(''); // almacén de destino elegido
    const [procesando, setProcesando] = useState(false);
    // Los almacenes activos se vuelven a consultar cada vez que se abre el modal.
    const almacenes = useOpciones(almacenService, ETIQUETAS.almacen, FILTRO_ACTIVOS, recibiendo ? 1 : 0);

    // El perfil de solo consulta no ve estas acciones (el backend igualmente respondería 403).
    if (!puedeEscribir) return null;

    // Borrador -> enviada, previa confirmación. Las reglas (p. ej. "debe tener líneas") las valida el backend.
    const enviar = async () => {
        if (!window.confirm(`¿Enviar la orden #${orden.id} al proveedor? Ya no estará en borrador.`)) return;
        setProcesando(true);
        try {
            await enviarOrden(orden.id);
            setError('');
            setExito(`Orden #${orden.id} enviada correctamente.`);
            onCambio();
        } catch (err) {
            setError(getError(err));
        } finally {
            setProcesando(false);
        }
    };

    // Enviada -> recibida en el almacén elegido; el backend genera las entradas de inventario.
    const recibir = async evento => {
        evento.preventDefault();
        setProcesando(true);
        try {
            await recibirOrden(orden.id, almacen);
            setError('');
            setExito(`Orden #${orden.id} recibida: el inventario del almacén fue actualizado.`);
            setRecibiendo(false);
            setAlmacen('');
            onCambio();
        } catch (err) {
            setError(getError(err));
            setRecibiendo(false);
        } finally {
            setProcesando(false);
        }
    };

    return (
        <>
            {orden.estado === 'borrador' && (
                <button className="btn btn-outline-success btn-sm ms-1" disabled={procesando} onClick={enviar}>
                    <i className="bi bi-send me-1" />Enviar
                </button>
            )}
            {orden.estado === 'enviada' && (
                <button className="btn btn-success btn-sm ms-1" disabled={procesando} onClick={() => setRecibiendo(true)}>
                    <i className="bi bi-box-arrow-in-down me-1" />Recibir
                </button>
            )}
            {recibiendo && (
                <Modal titulo={`Recibir orden #${orden.id}`} onClose={() => setRecibiendo(false)}>
                    <form onSubmit={recibir}>
                        <p className="text-secondary small">
                            La recepción es completa: cada línea genera una entrada en el almacén elegido.
                        </p>
                        <label className="form-label" htmlFor="almacen-recepcion">Almacén de destino *</label>
                        <select id="almacen-recepcion" className="form-select" value={almacen} required
                            onChange={e => setAlmacen(e.target.value)}>
                            <option value="">Seleccione...</option>
                            {almacenes.opciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <div className="d-flex gap-2 justify-content-end mt-4">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setRecibiendo(false)}>Cancelar</button>
                            <button type="submit" className="btn btn-success" disabled={procesando || !almacen}>
                                {procesando ? 'Recibiendo...' : 'Confirmar recepción'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
