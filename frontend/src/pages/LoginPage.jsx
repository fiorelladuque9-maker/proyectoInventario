import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

// Pantalla de acceso: valida credenciales contra Django y, si son correctas, entra al dashboard.
export default function LoginPage() {
  // "aviso" trae mensajes como "sesión expirada" cuando el token dejó de ser válido.
  const { login, aviso } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Envía el formulario: muestra el error devuelto por login() o navega al dashboard.
  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <div className="card login-card shadow-lg border-0">
        <div className="card-body p-4 p-md-5">
          <div className="brand-icon">
            <i className="bi bi-box-seam" />
          </div>
          <h1 className="h3 fw-bold text-center">Inventario</h1>
          <p className="text-secondary text-center mb-4">Inicio de sesión</p>
          {aviso && !error && (
            <div className="alert alert-warning" role="alert">
              {aviso}
            </div>
          )}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Usuario
              </label>
              <input
                id="username"
                className="form-control form-control-lg"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="form-control form-control-lg"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-100"
            >
              {loading ? "Verificando…" : "Ingresar"}
            </button>
          </form>
          <p className="text-center text-secondary small mt-4 mb-0">
            Autenticación con Django REST Framework
          </p>
        </div>
      </div>
    </main>
  );
}
