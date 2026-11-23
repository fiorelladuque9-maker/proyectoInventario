import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getError } from '../api/client.js';
import Alerta from '../components/Alerta.jsx';
import { MODULOS } from '../components/AppLayout.jsx';
import EstadoBadge from '../components/EstadoBadge.jsx';
import { cargarDashboard } from '../services/dashboardService.js';
import { fecha, numero } from '../utils/formato.js';

// Tarjeta de un indicador numérico; al hacer clic lleva al módulo relacionado (prop "a").
function Indicador({ titulo, valor, icono, color, a }) {
    return (
        <div className="col-6 col-lg-4 col-xl-2">
            <Link to={a} className="text-decoration-none">
                <div className="card border-0 shadow-sm h-100 stat-card">
                    <div className="card-body">
                        <div className={`stat-icon text-bg-${color}`}><i className={`bi bi-${icono}`} /></div>
                        <div className="display-6 fw-bold text-dark mt-2">{valor}</div>
                        <div className="small text-secondary">{titulo}</div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

// Resumen operativo: indicadores, alertas de stock bajo, últimos movimientos y accesos a los módulos.
export default function DashboardPage() {
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState('');

    // Carga los indicadores una sola vez al abrir la pantalla.
    useEffect(() => {
        let activo = true;
        cargarDashboard()
            .then(d => { if (activo) setDatos(d); })
            .catch(err => { if (activo) setError(getError(err)); });
        return () => { activo = false; };
    }, []);

    return (
        <div>
            <h1 className="h3 fw-bold mb-1">Dashboard</h1>
            <p className="text-secondary mb-4">Resumen operativo calculado en tiempo real desde la API.</p>
            <Alerta mensaje={error} />

            {!datos && !error && (
                <div className="alert alert-info"><span className="spinner-border spinner-border-sm me-2" />Cargando indicadores...</div>
            )}

            {datos && (
                <>
                    <div className="row g-3 mb-4">
                        <Indicador titulo="Productos activos" valor={datos.productos} icono="tags" color="primary" a="/catalogo" />
                        <Indicador titulo="Proveedores activos" valor={datos.proveedores} icono="truck" color="info" a="/proveedores" />
                        <Indicador titulo="Órdenes por recibir" valor={datos.ordenesEnviadas} icono="cart-check" color="success" a="/compras" />
                        <Indicador titulo="Órdenes en borrador" valor={datos.ordenesBorrador} icono="pencil-square" color="secondary" a="/compras" />
                        <Indicador titulo="Existencias bajo mínimo" valor={datos.bajoMinimo} icono="exclamation-triangle" color="danger" a="/inventario" />
                        <Indicador titulo="Conteos abiertos" valor={datos.conteosAbiertos} icono="clipboard-check" color="warning" a="/conteos" />
                    </div>

                    {/* Dos tablas resumen: existencias bajo el mínimo y últimos 5 movimientos */}
                    <div className="row g-4 mb-4">
                        <div className="col-lg-6">
                            <section className="card border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <h2 className="h5 fw-bold mb-3"><i className="bi bi-exclamation-triangle text-danger me-2" />Alertas de stock bajo</h2>
                                    {datos.alertas.length === 0 ? (
                                        <p className="text-secondary mb-0">Ninguna existencia está por debajo de su mínimo.</p>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-sm align-middle mb-0">
                                                <thead><tr><th>Producto</th><th>Almacén</th><th className="text-end">Saldo</th></tr></thead>
                                                <tbody>
                                                    {datos.alertas.map(e => (
                                                        <tr key={e.id}>
                                                            <td>{e.producto_sku} · {e.producto_nombre}</td>
                                                            <td>{e.almacen_nombre}</td>
                                                            <td className="text-end text-danger fw-semibold">{numero(e.cantidad)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                        <div className="col-lg-6">
                            <section className="card border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <h2 className="h5 fw-bold mb-3"><i className="bi bi-arrow-left-right me-2 text-primary" />Últimos movimientos</h2>
                                    {datos.movimientos.length === 0 ? (
                                        <p className="text-secondary mb-0">Aún no hay movimientos registrados.</p>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-sm align-middle mb-0">
                                                <thead><tr><th>Fecha</th><th>Tipo</th><th className="text-end">Cantidad</th><th>Referencia</th></tr></thead>
                                                <tbody>
                                                    {datos.movimientos.map(m => (
                                                        <tr key={m.id}>
                                                            <td>{fecha(m.creado_en)}</td>
                                                            <td><EstadoBadge valor={m.tipo} /></td>
                                                            <td className="text-end">{numero(m.cantidad)}</td>
                                                            <td>{m.referencia || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </>
            )}

            <h2 className="h5 fw-bold mb-3">Módulos</h2>
            <div className="row g-3">
                {MODULOS.filter(m => m.descripcion).map(m => (
                    <div className="col-12 col-md-6 col-xl" key={m.ruta}>
                        <Link to={m.ruta} className="text-decoration-none">
                            <div className="card border-0 shadow-sm h-100 stat-card">
                                <div className="card-body">
                                    <i className={`bi bi-${m.icono} fs-2 text-primary`} />
                                    <div className="fw-bold text-dark mt-2">{m.titulo}</div>
                                    <div className="small text-secondary">{m.descripcion}</div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
