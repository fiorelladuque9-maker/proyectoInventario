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

API de comprobación: `GET http://127.0.0.1:8000/api/health/`  
Token: `POST http://127.0.0.1:8000/api/token/` con `username` y `password`.

Todos los demás endpoints requieren el encabezado `Authorization: Token <token>`. Los perfiles son `Administrador` (lectura, escritura y borrado), `Operador` (lectura y escritura) y `Consulta` (solo lectura). Asigna uno de esos grupos a cada usuario desde el panel de administración.

## Endpoints iniciales

- `categorias/`, `productos/`
- `proveedores/`, `productos-proveedor/`
- `ordenes-compra/`, `lineas-compra/`
- `almacenes/`, `existencias/`, `movimientos/`
- `conteos/`, `lineas-conteo/`

Acciones del proceso:

- `POST /api/ordenes-compra/{id}/enviar/`
- `POST /api/ordenes-compra/{id}/recibir/` con `{"almacen": 1}`
- `POST /api/movimientos/registrar-salida/` con `almacen`, `producto`, `cantidad` y `referencia`
- `GET /api/existencias/bajo-minimo/`
- `POST /api/conteos/{id}/cerrar/`

Las existencias y los movimientos se consultan mediante API; el saldo se actualiza al recibir compras, registrar salidas y cerrar conteos, para mantener el historial consistente.

## Configuración de PostgreSQL

Copie `.env.example` como `.env`, configure una base PostgreSQL y complete sus variables de conexión. Cambie `DB_ENGINE` a `postgresql`. No suba `.env` a GitHub.

## Estado actual

| Requisito | Estado |
|---|---|
| Autenticación por tokens | Hecho (`POST /api/token/`, pruebas en `apps/common/tests/`). |
| Roles y permisos (Administrador, Operador, Consulta) | Hecho (`config/permissions.py`, comando `crear_roles`, matriz de permisos probada en todos los módulos). |
| Dos módulos de negocio | Hecho: se implementaron cinco (catálogo, proveedores, compras, inventario y conteos). |
| Pruebas automatizadas (CRUD, reglas de negocio, permisos) | Hecho: 15 pruebas, todas correctas. |
| Colección de Postman | Hecho: carpeta `postman/`. |
| Documentación | README, modelo de datos y guía de Postman. Falta completar la tabla del equipo. |

## Equipo

| Integrante | Responsabilidad | GitHub |
|---|---|---|
| Por definir | Por definir | Por definir |
| Por definir | Por definir | Por definir |
| Por definir | Por definir | Por definir |


## Pruebas automatizadas

Las pruebas usan `APITestCase` y la base de datos temporal de Django. La suite tiene **15 casos** que cubren el token, el CRUD, las reglas de negocio y los permisos por perfil:

| Ubicación | Casos | Qué cubre |
|---|---|---|
| `apps/common/tests/` | 6 | Login correcto e incorrecto; usuario sin perfil (403); lectura permitida a los tres perfiles; Consulta no puede crear; Operador no puede borrar. |
| `apps/catalogo/tests/` | 3 | CRUD de productos: Operador crea, Administrador elimina y stock mínimo negativo rechazado. |
| `apps/proveedores/tests/` | 2 | Creación de proveedor y rechazo de nombre duplicado. |
| `apps/compras/tests/` | 2 | No se envía una orden sin líneas; recibir una orden aumenta el stock y registra el movimiento. |
| `apps/inventario/tests/` | 1 | Una salida mayor al stock se rechaza sin modificar la existencia. |
| `apps/conteos/tests/` | 1 | Cerrar un conteo ajusta la existencia y registra el movimiento. |

Ejecute todas las pruebas con:

```powershell
python manage.py test
```

También puede ejecutar un módulo específico, por ejemplo:

```powershell
python manage.py test apps.compras.tests
```

Resultado actual: 15 pruebas ejecutadas, todas correctas.

## Colección de Postman

Los archivos están en `postman/`:

- `inventario.postman_collection.json`: 30 peticiones agrupadas en 8 carpetas (autenticación, catálogo, proveedores, almacenes, compras, existencias y salidas, conteos y permisos por perfil). Cada petición incluye pruebas de Postman.
- `inventario-local.postman_environment.json`: variables `base_url` y credenciales de los tres perfiles.

Preparación:

1. Con el servidor activo, cree tres usuarios y asígnele a cada uno su grupo (`Administrador`, `Operador`, `Consulta`) desde `/admin/`. Puede usar los nombres del environment (`admin_postman`, `operador_postman`, `consulta_postman`) o cambiar las variables.
2. En Postman use **Import** con los dos archivos y seleccione el environment «Inventario - Local».
3. Ejecute la carpeta **1. Autenticación**: guarda los tres tokens automáticamente. La colección envía `Authorization: Token {{token}}`.
4. Ejecute las demás carpetas en orden (o use **Run collection**). Las peticiones guardan los identificadores que necesitan las siguientes, por lo que conviene usar una base de datos de desarrollo.

Resultado de la última ejecución con Newman: 42 verificaciones, 41 correctas. La que falla es la petición marcada `[Error conocido]`, que espera el comportamiento correcto.

## Errores conocidos (pendientes de corregir)

1. `apps/inventario/serializers.py`: `MovimientoSerializer` define `read_only_fields = fields` con `fields = "__all__"`, por lo que serializar un movimiento lanza error. Afecta a `POST /movimientos/registrar-salida/` y a `GET /movimientos/` cuando hay movimientos. Ninguna de las 15 pruebas automatizadas ejerce ese camino.
2. `config/settings.py` importa el backend de MySQL de forma incondicional (primeras líneas). Sin `mysqlclient` instalado el proyecto no arranca aunque se use PostgreSQL o SQLite.
3. El archivo `.env` incluido usa `DB_ENGINE=mysql`, mientras que este README describe PostgreSQL. Debe definirse el motor final de la entrega.
4. Dos listados muestran la advertencia `UnorderedObjectListWarning` (`Existencia` y `Producto` sin orden por defecto).

