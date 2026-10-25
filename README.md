# API de Inventario y Abastecimiento

Backend académico para controlar productos, proveedores, compras, existencias y conteos físicos en una organización pequeña.

## Flujo del negocio

1. Se registra el catálogo de productos y sus proveedores.
2. El equipo crea una orden de compra para un proveedor y agrega sus líneas.
3. Se envía la orden; al recibirla en un almacén, se crea una entrada por cada línea.
4. Las salidas y ajustes generan movimientos auditables y actualizan las existencias.
5. Un conteo físico compara las cantidades observadas con las del sistema y registra las diferencias.

## Módulos

| Aplicación | Responsabilidad |
|---|---|
| `catalogo` | Categorías, productos, unidades y nivel mínimo de inventario. |
| `proveedores` | Proveedores y relación de productos con costo de referencia. |
| `compras` | Órdenes y líneas de compra, envío y recepción. |
| `inventario` | Almacenes, existencias, movimientos y consulta de productos bajo mínimo. |
| `conteos` | Conteos físicos y comparación contra las cantidades registradas. |

Relaciones: proveedor–orden (1:N), orden–líneas (1:N), producto–proveedor (N:M mediante `ProductoProveedor`), almacén–existencias (1:N), producto–existencias (1:N), conteo–líneas (1:N).

## Tecnologías

- Python 3.12 o superior
- Django 6.1 y Django REST Framework
- PostgreSQL como base de datos objetivo
- Tokens de DRF para autenticación

Para facilitar los primeros pasos, el proyecto usa SQLite cuando `DB_ENGINE` no está configurado como `postgresql`. La entrega final del curso debe ejecutarse con PostgreSQL o MySQL.

## Preparación local (Windows PowerShell)

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py crear_roles
python manage.py runserver
```

API de comprobación: `GET http://127.0.0.1:8000/api/v1/health/`  
Token: `POST http://127.0.0.1:8000/api/v1/auth/token/` con `username` y `password`.

Todos los demás endpoints requieren el encabezado `Authorization: Token <token>`. Los perfiles son `Administrador` (lectura, escritura y borrado), `Operador` (lectura y escritura) y `Consulta` (solo lectura). Asigna uno de esos grupos a cada usuario desde el panel de administración.

## Endpoints iniciales

- `categorias/`, `productos/`
- `proveedores/`, `productos-proveedor/`
- `ordenes-compra/`, `lineas-compra/`
- `almacenes/`, `existencias/`, `movimientos/`
- `conteos/`, `lineas-conteo/`

Acciones del proceso:

- `POST /api/v1/ordenes-compra/{id}/enviar/`
- `POST /api/v1/ordenes-compra/{id}/recibir/` con `{"almacen": 1}`
- `POST /api/v1/movimientos/registrar-salida/` con `almacen`, `producto`, `cantidad` y `referencia`
- `GET /api/v1/existencias/bajo-minimo/`
- `POST /api/v1/conteos/{id}/cerrar/`

Las existencias y los movimientos se consultan mediante API; el saldo se actualiza al recibir compras, registrar salidas y cerrar conteos, para mantener el historial consistente.

## Configuración de PostgreSQL

Copie `.env.example` como `.env`, configure una base PostgreSQL y complete sus variables de conexión. Cambie `DB_ENGINE` a `postgresql`. No suba `.env` a GitHub.

## Estado actual

Se creó la configuración de Django, los cinco módulos, modelos con restricciones relacionales, panel de administración, autenticación por token, permisos por grupo y endpoints iniciales. Las migraciones iniciales ya se generaron y `manage.py check` no encontró problemas. Se incorporaron 21 pruebas automatizadas, pendientes de ejecución en el entorno local. También faltan revisión funcional completa y colección Postman.

## Equipo

| Integrante | Responsabilidad | GitHub |
|---|---|---|
| Por definir | Por definir | Por definir |
| Por definir | Por definir | Por definir |
| Por definir | Por definir | Por definir |


## Pruebas automatizadas

Las pruebas usan `APITestCase` y la base de datos temporal de Django. La suite incluye 21 casos para CRUD de productos, filtros, paginación, permisos por perfil, validaciones de compras, salidas de inventario y cierre de conteos.

Ejecute todas las pruebas con:

```powershell
python manage.py test
```

También puede ejecutar una aplicación específica, por ejemplo:

```powershell
python manage.py test apps.compras.tests
```

Los casos están en `apps/catalogo/tests/`, `apps/compras/tests/`, `apps/inventario/tests/` y `apps/conteos/tests/`. La suite se incorporó al repositorio; falta ejecutarla en el entorno local y corregir cualquier incidencia que aparezca.

