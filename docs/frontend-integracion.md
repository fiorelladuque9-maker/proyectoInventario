# Integración del frontend (Proyecto 2)

Documento de análisis y evidencias del frontend React que consume la API del Proyecto 1.

## 1. Mapa de pantallas

| Ruta | Pantalla | Contenido |
| :--- | :--- | :--- |
| `/login` | Login | Usuario y contraseña; obtiene el token real de Django |
| `/` | Dashboard | 6 indicadores, alertas de stock bajo, últimos movimientos y accesos a los módulos |
| `/catalogo?tab=productos` · `?tab=categorias` | Catálogo | CRUD de productos y de categorías |
| `/proveedores?tab=proveedores` · `?tab=ofertas` | Proveedores | CRUD de proveedores y de ofertas proveedor-producto (N:M) |
| `/compras` | Compras | CRUD de órdenes, enviar y recibir |
| `/compras/:id` | Detalle de orden | Datos de la orden y CRUD de sus líneas |
| `/inventario?tab=existencias` · `movimientos` · `almacenes` | Inventario | Existencias (solo lectura + bajo mínimo), historial + registrar salida, CRUD de almacenes |
| `/conteos` | Conteos | CRUD de conteos y cierre |
| `/conteos/:id` | Detalle de conteo | Datos del conteo y CRUD de sus líneas |

## 2. Inventario de endpoints (Proyecto 1) y su uso en la interfaz

Prefijo `/api/v1/`. Todos exigen `Authorization: Token <token>` salvo `health/` y `auth/token/`. Los listados son paginados (`count`, `next`, `previous`, `results`, 20 por página) y aceptan `search`, `ordering`, `page` y los filtros indicados.

| Recurso | Métodos | Filtros | Búsqueda (`search`) | Orden (`ordering`) |
| :--- | :--- | :--- | :--- | :--- |
| `categorias/` | GET POST PUT PATCH DELETE | `activa` | nombre | nombre |
| `productos/` | GET POST PUT PATCH DELETE | `categoria`, `unidad`, `activo` | sku, nombre, descripción | nombre, sku, stock_minimo, creado_en |
| `proveedores/` | GET POST PUT PATCH DELETE | `activo` | nombre, identificación, correo | nombre |
| `productos-proveedor/` | GET POST PUT PATCH DELETE | `proveedor`, `producto`, `preferido` | proveedor, producto, sku | costo_referencial |
| `ordenes-compra/` | GET POST PUT PATCH DELETE | `proveedor`, `estado` | proveedor, notas | creada_en, estado |
| `lineas-compra/` | GET POST PUT PATCH DELETE | `orden`, `producto` | sku, producto | cantidad, costo_unitario |
| `almacenes/` | GET POST PUT PATCH DELETE | `activo` | nombre, ubicación | nombre |
| `existencias/` | GET | `almacen`, `producto` | sku, producto, almacén | cantidad, producto__nombre |
| `movimientos/` | GET | `almacen`, `producto`, `tipo` | referencia, sku, producto | creado_en, cantidad |
| `conteos/` | GET POST PUT PATCH DELETE | `almacen`, `estado` | almacén | creado_en, cerrado_en |
| `lineas-conteo/` | GET POST PUT PATCH DELETE | `conteo`, `producto` | sku, producto | cantidad_sistema, cantidad_contada |

Acciones de negocio: `POST ordenes-compra/{id}/enviar/`, `POST ordenes-compra/{id}/recibir/` (body `{almacen}`), `GET existencias/bajo-minimo/`, `POST movimientos/registrar-salida/` (body `{almacen, producto, cantidad, referencia}`), `POST conteos/{id}/cerrar/`.

Códigos de respuesta: 200/201/204 éxito · 400 validación o regla de negocio · 401 sin token o token inválido · 403 perfil sin permiso · 404 no existe · 409 borrado bloqueado por relaciones.

### Ampliaciones del backend (justificadas)

| Cambio | Motivo | Seguridad |
| :--- | :--- | :--- |
| `django-cors-headers` + `CORS_ALLOWED_ORIGINS` | Sin CORS el navegador bloquea todas las peticiones del frontend (origen distinto) | Solo se autorizan los orígenes configurados en `.env` |
| `GET /api/v1/auth/me/` | El frontend necesita conocer el perfil (rol) para adaptar las acciones visibles | Requiere token; solo lectura; no sustituye la autorización de cada endpoint |
| `POST /api/v1/auth/logout/` | Permitir **revocar** el token en el servidor al cerrar sesión | Requiere token; elimina únicamente el token del usuario autenticado |
| Manejador de excepciones: `ProtectedError` → **409** | Borrar una categoría/proveedor/producto con datos relacionados devolvía un error 500 | Endurece el comportamiento; no relaja ninguna regla |
| `DELETE` de líneas de orden recibida/cancelada y de líneas de conteo cerrado → 400 | El serializador bloqueaba editar, pero el borrado quedaba permitido (hueco de integridad) | Refuerza las reglas 8 y 10 del Proyecto 1 |

Pruebas añadidas: `apps/common/tests/test_sesion_frontend.py` (perfil, logout, 409, CORS y borrado de líneas cerradas).

## 3. Matriz de pantallas y endpoints

| Pantalla / acción de la interfaz | Método y ruta |
| :--- | :--- |
| Login | `POST auth/token/` → `GET auth/me/` |
| Logout | `POST auth/logout/` (revoca el token) |
| Dashboard: indicadores | `GET productos/?activo=true`, `proveedores/?activo=true`, `ordenes-compra/?estado=enviada`, `…?estado=borrador`, `conteos/?estado=abierto`, `existencias/bajo-minimo/`, `movimientos/?ordering=-creado_en`, `categorias/`, `almacenes/` |
| Catálogo · listar / buscar / filtrar / ordenar / paginar | `GET productos/?search=&categoria=&unidad=&activo=&ordering=&page=` |
| Catálogo · crear / editar / eliminar producto | `POST productos/` · `PUT productos/{id}/` · `DELETE productos/{id}/` |
| Catálogo · categorías (CRUD) | `GET/POST categorias/` · `PUT/DELETE categorias/{id}/` |
| Proveedores (CRUD) | `GET/POST proveedores/` · `PUT/DELETE proveedores/{id}/` |
| Ofertas (CRUD, selectores de proveedor y producto) | `GET/POST productos-proveedor/` · `PUT/DELETE productos-proveedor/{id}/` |
| Compras · listar / filtrar por estado y proveedor | `GET ordenes-compra/?estado=&proveedor=&search=&ordering=` |
| Compras · crear / editar / eliminar orden | `POST ordenes-compra/` · `PUT/DELETE ordenes-compra/{id}/` |
| Compras · enviar orden | `POST ordenes-compra/{id}/enviar/` |
| Compras · recibir orden | `POST ordenes-compra/{id}/recibir/` |
| Detalle de orden · datos | `GET ordenes-compra/{id}/`, `GET proveedores/{proveedor}/` |
| Detalle de orden · líneas (CRUD) | `GET lineas-compra/?orden={id}` · `POST lineas-compra/` · `PUT/DELETE lineas-compra/{id}/` |
| Detalle de orden · productos del proveedor (selector) | `GET productos-proveedor/?proveedor={id}` |
| Inventario · existencias / solo bajo mínimo | `GET existencias/` · `GET existencias/bajo-minimo/` |
| Inventario · movimientos | `GET movimientos/?tipo=&almacen=&producto=&search=&ordering=` |
| Inventario · registrar salida | `POST movimientos/registrar-salida/` |
| Inventario · almacenes (CRUD) | `GET/POST almacenes/` · `PUT/DELETE almacenes/{id}/` |
| Conteos · listar / crear / editar / eliminar | `GET/POST conteos/` · `PUT/DELETE conteos/{id}/` |
| Conteos · cerrar | `POST conteos/{id}/cerrar/` |
| Detalle de conteo · líneas (CRUD) | `GET lineas-conteo/?conteo={id}` · `POST lineas-conteo/` · `PUT/DELETE lineas-conteo/{id}/` |

## 4. Matriz de perfiles y permisos

La autorización la aplica Django (`InventarioRolePermission`). El frontend solo adapta lo visible según `GET auth/me/`; si se manipula la interfaz, la API sigue devolviendo 403.

| Acción | Administrador | Operador | Consulta | Sin token |
| :--- | :---: | :---: | :---: | :---: |
| Ver todos los módulos (GET) | Sí | Sí | Sí | 401 |
| Botón «Nuevo…» y formularios (POST/PUT) | Sí | Sí | No visible · API 403 | 401 |
| Enviar / recibir orden, registrar salida, cerrar conteo | Sí | Sí | No visible · API 403 | 401 |
| Botón eliminar (DELETE) | Sí | No visible · API 403 | No visible · API 403 | 401 |

## 5. Escenarios manuales (con datos demo)

Se ejecutaron de forma automatizada con un navegador real (Chrome headless) contra el backend real; todos pasaron. La combinación de filtros del escenario 6 se verificó además directamente contra la API. Capturas en `docs/capturas/`.

| # | Escenario | Resultado esperado | Captura |
| :-: | :--- | :--- | :--- |
| 1 | Login con credenciales incorrectas | Mensaje «Usuario o contraseña incorrectos» | `login.png` |
| 2 | Abrir `/catalogo` sin sesión | Redirige a `/login` | — |
| 3 | Login `admin_demo` | Dashboard con indicadores reales y rol visible | `dashboard.png` |
| 4 | Navegación entre módulos sin recargar la página | La URL y el contenido cambian (SPA) | `productos.png` |
| 5 | Buscar «arroz» en productos | Solo productos coincidentes (búsqueda del servidor) | `productos.png` |
| 6 | Filtros combinados (categoría + activo) y orden | Resultados del servidor, con botón «Limpiar» | `productos.png` |
| 7 | Crear producto con SKU repetido | Error 400 legible: «Sku: …» | `error-validacion.png` |
| 8 | Crear, editar (valores precargados) y eliminar producto | Alertas de éxito y tabla actualizada | `productos.png` |
| 9 | Eliminar categoría con productos | Error 409 legible | `error-409.png` |
| 10 | Crear orden, enviarla sin líneas | Regla de negocio: «Agregue al menos un producto…» | `compra-detalle.png` |
| 11 | Agregar línea (solo productos del proveedor), enviar y recibir en un almacén | Estado `recibida`, inventario actualizado, líneas bloqueadas | `compra-detalle.png` |
| 12 | Registrar salida mayor al saldo | Error 400: «No hay existencias suficientes…» | `inventario.png` |
| 13 | Cerrar conteo con líneas sin contar | Error: «Todas las líneas deben tener una cantidad contada…» | `conteo-detalle.png` |
| 14 | Contar líneas y cerrar conteo | Estado `cerrado`, ajustes registrados | `conteos.png` |
| 15 | `consulta_demo` abre el catálogo | Sin botones de crear/editar/eliminar; la API responde 403 a un POST | `consulta.png` |
| 16 | `operador_demo` abre el catálogo | Puede editar; no ve eliminar | — |
| 17 | Token inválido/revocado | 401 → vuelve al login con aviso de sesión expirada | `sesion-expirada.png` |
| 18 | Logout | Se limpia el token local y redirige a `/login` | — |
| 19 | Vista móvil (390 px) | Sin desbordamiento horizontal; menú desplazable | `movil.png` |

## 6. Limitaciones

- El token de DRF **no caduca por tiempo**; por eso se añadió `POST auth/logout/`, que lo elimina en el servidor. Si ese llamado falla (p. ej. sin red), la sesión local se limpia igualmente.
- El token se guarda en `sessionStorage` (se pierde al cerrar la pestaña).
- Paginación fija en 20 registros por página (configuración del backend).
- La recepción de órdenes es completa (no hay recepción parcial), igual que en el Proyecto 1.
- Existencias y movimientos son de solo lectura: se modifican únicamente mediante recepciones, salidas y cierres de conteo (justifica que el módulo de Inventario tenga CRUD completo solo en Almacenes). Los otros cuatro módulos (Catálogo, Proveedores, Compras y Conteos) tienen CRUD completo.
