import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CatalogoPage from "./pages/CatalogoPage.jsx";
import ProveedoresPage from "./pages/ProveedoresPage.jsx";
import ComprasPage from "./pages/ComprasPage.jsx";
import CompraDetallePage from "./pages/CompraDetallePage.jsx";
import InventarioPage from "./pages/InventarioPage.jsx";
import ConteosPage from "./pages/ConteosPage.jsx";
import ConteoDetallePage from "./pages/ConteoDetallePage.jsx";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Si ya hay sesión iniciada, /login redirige al dashboard; si no, muestra el formulario de acceso.
function LoginRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />;
}

// Define todas las rutas de la SPA. AuthProvider comparte la sesión con todos los componentes.
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          {/* ProtectedRoute exige sesión; AppLayout aporta la barra de navegación común a todas las pantallas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/catalogo" element={<CatalogoPage />} />
              <Route path="/proveedores" element={<ProveedoresPage />} />
              <Route path="/compras" element={<ComprasPage />} />
              <Route path="/compras/:id" element={<CompraDetallePage />} />
              <Route path="/inventario" element={<InventarioPage />} />
              <Route path="/conteos" element={<ConteosPage />} />
              <Route path="/conteos/:id" element={<ConteoDetallePage />} />
            </Route>
          </Route>
          {/* Cualquier ruta desconocida vuelve al dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
