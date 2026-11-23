// Color de Bootstrap según el estado: órdenes, conteos, tipos de movimiento y activo/inactivo.
const COLORES = {
    borrador: 'secondary', enviada: 'primary', recibida: 'success', cancelada: 'dark',
    abierto: 'warning', cerrado: 'success',
    entrada: 'success', salida: 'danger', ajuste: 'info',
    activo: 'success', inactivo: 'secondary',
};

// Etiqueta de color con el texto del estado (valor devuelto por la API).
export default function EstadoBadge({ valor }) {
    return <span className={`badge text-bg-${COLORES[valor] || 'secondary'} text-capitalize`}>{valor}</span>;
}

// Etiqueta "Sí"/"No" para valores booleanos (p. ej. el campo activo).
export const SiNo =({ valor }) => (
    <span className={`badge text-bg-${valor ? 'success' : 'secondary'}`}>{valor ? 'Sí' : 'No'}</span>
);
