import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Guardián de rutas: sin sesión redirige a /login; con sesión renderiza la ruta hija (<Outlet />).
export default function ProtectedRoute() {
    const { isAuthenticated, cargandoPerfil } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    // Se espera al perfil (rol y permisos) para no mostrar acciones incorrectas durante un instante.
    if (cargandoPerfil) {
        return (
            <div className="min-vh-100 d-grid place-items-center text-secondary" style={{ placeItems: 'center' }}>
                <div><span className="spinner-border spinner-border-sm me-2" />Cargando sesión...</div>
            </div>
        );
    }
    return <Outlet />;
}
