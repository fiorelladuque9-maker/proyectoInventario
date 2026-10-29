# API Backend de Gestión de Inventario y Abastecimiento

API REST desarrollada con **Python**, **Django** y **Django REST Framework (DRF)** para la gestión centralizada de inventario, catálogo de productos, proveedores, órdenes de compra y conteos físicos de almacén.

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura de Módulos](#arquitectura-de-módulos)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Mapeo de Roles y Permisos](#mapeo-de-roles-y-permisos)
- [Endpoints Principales](#endpoints-principales)
- [Pruebas Automatizadas](#pruebas-automatizadas)
- [Colección de Postman](#colección-de-postman)
- [Limitaciones Conocidas y Notas Técnicas](#limitaciones-conocidas-y-notas-técnicas)

---

## Visión General

El sistema atiende la necesidad operativa de una pequeña o mediana organización para llevar el control de stock en tiempo real. Permite:
- Mantener un catálogo de productos estructurado por categorías.
- Registrar proveedores y gestionar catálogos de ofertas/costos de productos.
- Crear, enviar y recibir órdenes de compra que alimentan automáticamente el inventario.
- Controlar existencias físicas por almacén y registrar movimientos de auditoría (entradas/salidas).
- Efectuar conteos físicos periódicos para conciliar las existencias del sistema contra la realidad en almacén.

---

## Arquitectura de Módulos

El proyecto está segmentado en **5 módulos de negocio** y **1 de soporte**:

1. **`apps.catalogo`**: Control de categorías, productos, SKU, unidades de medida y stock mínimo.
2. **`apps.proveedores`**: Gestión de proveedores y ofertas comerciales (relación N:M entre producto y proveedor con precios de referencia).
3. **`apps.compras`**: Órdenes de compra y sus líneas de detalle. Gestiona el flujo `borrador` $\rightarrow$ `enviada` $\rightarrow$ `recibida`.
4. **`apps.inventario`**: Administración de almacenes, saldos (`Existencia`) y registro histórico de auditoría (`Movimiento`).
5. **`apps.conteos`**: Auditoría y toma de inventario físico por almacén; concilia diferencias y ajusta automáticamente las existencias.
6. **`apps.common`**: Módulo transversal de soporte (no expone modelos); incluye utilidades, clases de permisos y el comando de inicialización de roles.

---

## Requisitos Previos

- **Python 3.10+**
- **Virtualenv / venv**
- Base de datos relacional: **SQLite** (por defecto para desarrollo local) o **PostgreSQL** / **MySQL**.
- Git

---

## Instalación y Configuración

Sigue estos pasos para desplegar el entorno de desarrollo desde una instalación limpia:

### 1. Clonar el repositorio
```bash
git clone https://github.com/fiorelladuque9-maker/proyectoInventario.git
cd proyectoInventario
```

### 2. Crear y activar el entorno virtual
En Linux/macOS:
```bash
python3 -m venv venv
source venv/bin/activate
```

En Windows:
```cmd
python -m venv venv
venv\Scripts\activate
```

### 3. Instalar dependencias
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configurar variables de entorno
Copia la plantilla de variables de entorno y ajusta los valores según tu configuración local:
```bash
cp .env.example .env
```

> **Nota:** Por defecto, si no se define `DB_ENGINE`, el proyecto utilizará SQLite (`db.sqlite3`). Para PostgreSQL o MySQL, actualiza las variables `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT`.

### 5. Ejecutar migraciones de base de datos
```bash
python manage.py migrate
```

### 6. Inicializar Roles y Perfiles
Ejecuta el comando personalizado e idempotente para crear los grupos de seguridad obligatorios (`Administrador`, `Operador`, `Consulta`):
```bash
python manage.py crear_roles
```

### 7. Crear Superusuario (Administrador del Sistema)
```bash
python manage.py createsuperuser
```

### 8. Iniciar el servidor de desarrollo
```bash
python manage.py runserver
```
La API estará disponible en: `http://127.0.0.1:8000/api/v1/`

---

## Mapeo de Roles y Permisos

El sistema implementa seguridad basada en roles mediante `TokenAuthentication` y la clase personalizada `InventarioRolePermission`.

### Perfiles de Usuario

- **`Administrador`**: Acceso total al sistema (Lectura, Creación, Actualización y Eliminación / `DELETE`).
- **`Operador`**: Acceso operativo (Lectura, Creación, Edición y ejecución de Acciones de Negocio). No puede eliminar registros.
- **`Consulta`**: Acceso exclusivo de solo lectura (`GET`, `HEAD`, `OPTIONS`).

### Matriz de Permisos General

| Método HTTP | Administrador | Operador | Consulta | Sin Grupo / Sin Token |
| :--- | :---: | :---: | :---: | :---: |
| **GET / HEAD / OPTIONS** | Permitido | Permitido | Permitido | 403 / 401 |
| **POST / PUT / PATCH** | Permitido | Permitido | 403 | 403 / 401 |
| **DELETE** | Permitido | 403 | 403 | 403 / 401 |
| **Acciones Especiales (Ej. Recepción, Salida, Cierre)** | Permitido | Permitido | 403 | 403 / 401 |

---

## Endpoints Principales

Todos los endpoints requieren la cabecera `Authorization: Token <token>` (excepto salud y obtención de token).

### Autenticación y Salud
- `POST /api/v1/auth/token/`: Obtención de token con `username` y `password`.
- `GET /api/v1/health/`: Estado de salud del servicio (público).

### Módulos CRUD
- **Categorías**: `/api/v1/categorias/`
- **Productos**: `/api/v1/productos/` (incluye ordenamiento, filtros por categoría/activo y cálculo de `stock_total`).
- **Proveedores**: `/api/v1/proveedores/`
- **Ofertas Proveedor-Producto**: `/api/v1/productos-proveedor/`
- **Órdenes de Compra**: `/api/v1/ordenes-compra/`
- **Líneas de Compra**: `/api/v1/lineas-compra/`
- **Almacenes**: `/api/v1/almacenes/`
- **Existencias**: `/api/v1/existencias/` (Solo Lectura)
- **Movimientos**: `/api/v1/movimientos/` (Solo Lectura)
- **Conteos**: `/api/v1/conteos/`
- **Líneas de Conteo**: `/api/v1/lineas-conteo/`

### Acciones de Negocio Destacadas
- `POST /api/v1/ordenes-compra/{id}/enviar/`: Pasa una orden de borrador a enviada.
- `POST /api/v1/ordenes-compra/{id}/recibir/`: Recibe la orden e incrementa el inventario en el almacén destino.
- `GET /api/v1/existencias/bajo-minimo/`: Muestra saldos por almacén que están por debajo del `stock_minimo` del producto.
- `POST /api/v1/movimientos/registrar-salida/`: Registra una salida manual validando que exista saldo suficiente.
- `POST /api/v1/conteos/{id}/cerrar/`: Procesa las diferencias contadas y genera automáticamente las entradas/salidas de ajuste.

---

## Pruebas Automatizadas

Para ejecutar el paquete completo de pruebas unitarias e integración:

```bash
python manage.py test
```

### Cobertura de Pruebas
La suite incluye pruebas sobre:
- Autenticación por token y comprobación de permisos (HTTP 401 y 403) para los tres roles.
- Validación de reglas de negocio en compras (envío de órdenes vacías, recepción duplicada).
- Integridad en movimientos de inventario y rechazo de salidas sin saldo suficiente.
- Captura de fotografía de saldo al crear líneas de conteo y conciliación al cerrar.
- Filtros, búsqueda y paginación en listados.

---

## Colección de Postman

El repositorio incluye en la raíz el archivo exportado de la colección y su entorno para pruebas de integración:
- **Colección:** `Postman_Collection.json`
- **Entorno:** `Postman_Environment.json`

Permite probar más de 20 peticiones documentadas, incluyendo flujos de error esperados (`400`, `401`, `403`, `404`).

---

## Limitaciones Conocidas y Notas Técnicas

1. **Recepción de Órdenes:** Las órdenes de compra se reciben únicamente de forma completa (`cantidad_recibida = cantidad`). La recepción parcial no está habilitada.
2. **Edición de Conteos CERRADOS:** Una vez que un conteo de inventario se marca como `cerrado`, sus líneas de detalle quedan bloqueadas contra cualquier edición posterior.
3. **Índice Raíz de Routers (`/api/v1/`):** Al usar múltiples `DefaultRouter` bajo el mismo prefijo raíz, la vista navegable predeterminada de DRF puede ocultar algunos índices del router. Los endpoints directos operan de manera totalmente independiente y normal.
4. **Instalación de MySQL:** El archivo `settings.py` incluye soporte para adaptadores de MySQL. En entornos donde no se requiera dicho motor, asegúrese de tener configuradas correctamente las dependencias del sistema operativo o utilizar el motor por defecto SQLite/PostgreSQL.