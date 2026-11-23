import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getError, registrarAlExpirar, TOKEN_KEY, USER_KEY } from '../api/client.js';

// Contexto de autenticación: comparte token, usuario, rol y permisos con toda la aplicación (hook useAuth).
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // El estado se inicializa desde sessionStorage para conservar la sesión al recargar la página.
    const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
    const [username, setUsername] = useState(() => sessionStorage.getItem(USER_KEY) || '');
    const [perfil, setPerfil] = useState(null); // datos de GET /auth/me/ (rol y permisos)
    const [aviso, setAviso] = useState(''); // mensaje para el login (p. ej. sesión expirada)
    const [perfilFallo, setPerfilFallo] = useState(false); // evita reintentar en bucle si /auth/me/ falla

    // Borra la sesión local (token, usuario y perfil).
    const limpiarSesion = useCallback(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        setToken(null);
        setUsername('');
        setPerfil(null);
        setPerfilFallo(false);
    }, []);

    // Perfil real (rol y permisos) consultado al backend; la autorización definitiva la hace Django.
    const cargarPerfil = useCallback(async () => {
        const { data } = await api.get('/auth/me/');
        setPerfil(data);
        return data;
    }, []);

    // Cuando el interceptor de axios detecta un 401, cierra la sesión local y deja un aviso en el login.
    useEffect(() => {
        registrarAlExpirar(() => {
            limpiarSesion();
            setAviso('Su sesión expiró o fue revocada. Inicie sesión de nuevo.');
        });
    }, [limpiarSesion]);

    // Al recargar la página con un token guardado, se recupera el perfil.
    useEffect(() => {
        if (token && !perfil && !perfilFallo) cargarPerfil().catch(() => setPerfilFallo(true));
    }, [token, perfil, perfilFallo, cargarPerfil]);

    // Login: pide el token a Django, lo guarda, carga el perfil (rol) y actualiza el estado.
    async function login(usuario, password) {
        try {
            const { data } = await api.post('/auth/token/', { username: usuario, password });
            if (!data?.token) throw new Error('El servidor no devolvió el token.');
            sessionStorage.setItem(TOKEN_KEY, data.token);
            sessionStorage.setItem(USER_KEY, usuario);
            setAviso('');
            await cargarPerfil();
            setToken(data.token);
            setUsername(usuario);
        } catch (error) {
            limpiarSesion();
            if (error.response?.status === 400) throw new Error('Usuario o contraseña incorrectos.');
            throw new Error(error.response || !error.request ? getError(error) : error.message);
        }
    }

    // El logout revoca el token en el servidor (POST /auth/logout/) y limpia la sesión local.
    async function logout() {
        try {
            await api.post('/auth/logout/');
        } catch {
            // Aunque falle la revocación remota, la sesión local siempre se limpia.
        }
        limpiarSesion();
    }

    // Valores expuestos a los componentes. puedeEscribir/puedeEliminar solo adaptan la interfaz;
    // la autorización real la aplica siempre el backend.
    const value = {
        login, logout, token, username, perfil, aviso,
        cargandoPerfil: Boolean(token) && !perfil && !perfilFallo,
        isAuthenticated: Boolean(token),
        rol: perfil?.rol ?? null,
        puedeEscribir: Boolean(perfil?.puede_escribir),
        puedeEliminar: Boolean(perfil?.puede_eliminar),
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
