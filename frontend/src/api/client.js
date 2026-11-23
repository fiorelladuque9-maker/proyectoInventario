// Cliente HTTP único de la aplicación (axios) y utilidades para traducir los errores de la API.
import axios from 'axios';

// La URL base se centraliza aquí y se configura con VITE_API_URL (ver .env.example).
const baseURL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');
// Claves con las que se guarda la sesión en sessionStorage (se pierde al cerrar la pestaña).
export const TOKEN_KEY = 'inventario_token';
export const USER_KEY = 'inventario_username';

// Instancia compartida: todas las peticiones salen con la misma URL base y un tiempo máximo de 12 s.
export const api = axios.create({ baseURL, timeout: 12000 });

// Interceptor de petición: añade automáticamente "Authorization: Token ..." si hay sesión.
api.interceptors.request.use(config => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Token ${token}`;
    return config;
});

// Si el servidor responde 401 con una sesión activa, el token ya no es válido: se cierra la sesión local.
let alExpirar = null;
export const registrarAlExpirar = fn => { alExpirar = fn; };
api.interceptors.response.use(
    respuesta => respuesta,
    error => {
        if (error.response?.status === 401 && sessionStorage.getItem(TOKEN_KEY) && alExpirar) alExpirar();
        return Promise.reject(error);
    },
);

// Convierte un nombre de campo de la API ("stock_minimo") en una etiqueta legible ("Stock minimo").
const etiqueta = campo => {
    const texto = campo.replace(/_/g, ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// Convierte el JSON de errores de DRF ({campo: [mensajes]}) en texto comprensible.
function aTexto(data, prefijo = '') {
    if (typeof data === 'string') return prefijo ? `${prefijo}: ${data}` : data;
    if (Array.isArray(data)) return data.map(item => aTexto(item, prefijo)).filter(Boolean).join(' ');
    if (data && typeof data === 'object') {
        return Object.entries(data)
            .map(([clave, valor]) => aTexto(valor, ['detail', 'non_field_errors'].includes(clave) ? prefijo : etiqueta(clave)))
            .filter(Boolean)
            .join(' · ');
    }
    return '';
}

// Mensajes por código HTTP (400, 401, 403, 404, 409) y fallos de red.
export function getError(error) {
    if (!error.response) return 'No se puede conectar con la API. Compruebe que Django esté en ejecución.';
    const { status, data } = error.response;
    const detalle = typeof data === 'string' && data.trim().startsWith('<') ? '' : aTexto(data);
    switch (status) {
        case 400: return detalle || 'Los datos enviados no son válidos.';
        case 401: return 'Su sesión no es válida o expiró. Inicie sesión de nuevo.';
        case 403: return detalle || 'Su perfil no tiene permiso para realizar esta operación.';
        case 404: return 'El registro solicitado no existe o ya fue eliminado.';
        case 409: return detalle || 'La operación entra en conflicto con otros registros.';
        default: return status >= 500
            ? 'Error interno del servidor. Intente de nuevo o revise el backend.'
            : detalle || `Error HTTP ${status}`;
    }
}
