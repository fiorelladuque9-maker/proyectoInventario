// Funciones de formato con la configuración regional de Costa Rica (es-CR).
// Todas devuelven "—" cuando no hay valor.

// Fecha y hora cortas (p. ej. 22/11/26, 14:30).
export const fecha =valor => (valor ? new Date(valor).toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

// Cantidades con separador de miles y hasta 3 decimales.
export const numero =valor => (valor === null || valor === undefined || valor === ''
    ? '—'
    : Number(valor).toLocaleString('es-CR', { maximumFractionDigits: 3 }));

// Montos en colones con 2 decimales.
export const moneda =valor => (valor === null || valor === undefined || valor === ''
    ? '—'
    : `₡${Number(valor).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
