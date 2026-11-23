import { useState } from 'react';
import { getError } from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { cerrarConteo } from '../../services/conteoService.js';

// Cierra el conteo: el backend concilia diferencias y genera los movimientos de ajuste.
export default function AccionCerrar({ conteo, onCambio, setError, setExito }) {
    const { puedeEscribir } = useAuth();
    const [procesando, setProcesando] = useState(false);
    // Solo se muestra a quien puede escribir y mientras el conteo siga abierto.
    if (!puedeEscribir || conteo.estado !== 'abierto') return null;

    const cerrar = async () => {
        if (!window.confirm(`¿Cerrar el conteo #${conteo.id}? Se ajustará el inventario con las diferencias y las líneas quedarán bloqueadas.`)) return;
        setProcesando(true);
        try {
            await cerrarConteo(conteo.id);
            setError('');
            setExito(`Conteo #${conteo.id} cerrado: las diferencias se registraron como ajustes de inventario.`);
            onCambio();
        } catch (err) {
            setError(getError(err));
        } finally {
            setProcesando(false);
        }
    };

    return (
        <button className="btn btn-success btn-sm ms-1" disabled={procesando} onClick={cerrar}>
            <i className="bi bi-lock me-1" />{procesando ? 'Cerrando...' : 'Cerrar conteo'}
        </button>
    );
}
