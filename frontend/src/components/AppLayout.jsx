import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

// Módulos de la aplicación: alimentan el menú lateral, el menú móvil y las tarjetas del dashboard.
// "fin: true" hace que el enlace del Dashboard solo se marque activo en "/" exacto.
export const MODULOS = [
    { ruta: '/', titulo: 'Dashboard', icono: 'speedometer2', fin: true },
    { ruta: '/catalogo', titulo: 'Catálogo', icono: 'tags', descripcion: 'Categorías y productos' },
    { ruta: '/proveedores', titulo: 'Proveedores', icono: 'truck', descripcion: 'Proveedores y ofertas' },
    { ruta: '/compras', titulo: 'Compras', icono: 'cart-check', descripcion: 'Órdenes de compra' },
    { ruta: '/inventario', titulo: 'Inventario', icono: 'boxes', descripcion: 'Almacenes, existencias y movimientos' },
    { ruta: '/conteos', titulo: 'Conteos', icono: 'clipboard-check', descripcion: 'Conteos físicos y ajustes' },
];

// Estructura común de las pantallas autenticadas: menú lateral, barra superior (usuario, rol y "Salir")
// y, en <Outlet />, la pantalla de la ruta activa.
export default function AppLayout() {
    const { username, rol, logout } = useAuth();
    const navigate = useNavigate();
    // Cierra la sesión (revoca el token en el servidor) y vuelve al login.
    const salir = async () => {
        await logout();
        navigate('/login', { replace: true });
    };
    const clase = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`;
    return (
        <div className="app-shell">
            <aside className="app-sidebar">
                <div className="sidebar-brand">
                    <i className="bi bi-box-seam me-2" />
                    Inventario
                </div>
                <p className="sidebar-label">ADMINISTRACIÓN</p>
                <nav className="nav flex-column gap-2" aria-label="Menú principal">
                    {MODULOS.map(m => (
                        <NavLink key={m.ruta} to={m.ruta} end={m.fin} className={clase}>
                            <i className={`bi bi-${m.icono}`} />
                            {m.titulo}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-bottom">React + Django REST Framework</div>
            </aside>
            <div className="app-main">
                <header className="app-topbar">
                    <span className="d-md-none fw-bold text-primary">
                        <i className="bi bi-box-seam me-2" />Inventario
                    </span>
                    <div className="ms-auto d-flex align-items-center gap-3">
                        <span className="small text-secondary">
                            <i className="bi bi-person-circle me-2" />
                            {username}
                            {rol && <span className="badge text-bg-primary ms-2">{rol}</span>}
                        </span>
                        <button className="btn btn-outline-danger btn-sm" onClick={salir}>
                            <i className="bi bi-box-arrow-right me-1" />
                            Salir
                        </button>
                    </div>
                </header>
                {/* Menú horizontal desplazable que reemplaza al lateral en pantallas pequeñas */}
                <nav className="mobile-links d-md-none px-3 pt-3 d-flex gap-2" aria-label="Menú móvil">
                    {MODULOS.map(m => (
                        <NavLink key={m.ruta} to={m.ruta} end={m.fin} className="btn btn-outline-primary btn-sm text-nowrap">
                            <i className={`bi bi-${m.icono} me-1`} />{m.titulo}
                        </NavLink>
                    ))}
                </nav>
                <main className="container-fluid p-3 p-md-4 p-lg-5">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
