"""Pruebas de los endpoints añadidos para el frontend: perfil, logout y 409 en borrados protegidos."""
from apps.catalogo.models import Categoria, Producto

from .helpers import RolesTestCase


class SesionFrontendTests(RolesTestCase):
    def setUp(self):
        self.crear_usuarios_por_rol()

    def test_me_devuelve_perfil_y_permisos(self):
        esperado = {
            "admin_prueba": ("Administrador", True, True),
            "operador_prueba": ("Operador", True, False),
            "consulta_prueba": ("Consulta", False, False),
        }
        for user in (self.administrador, self.operador, self.consulta):
            self.autenticar(user)
            data = self.client.get("/api/v1/auth/me/").json()
            self.assertEqual((data["rol"], data["puede_escribir"], data["puede_eliminar"]), esperado[user.username])

    def test_me_sin_token_devuelve_401(self):
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 401)

    def test_logout_revoca_el_token(self):
        self.autenticar(self.consulta)
        self.assertEqual(self.client.post("/api/v1/auth/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/v1/categorias/").status_code, 401)

    def test_borrar_categoria_con_productos_devuelve_409(self):
        categoria = Categoria.objects.create(nombre="Con productos")
        Producto.objects.create(sku="X-1", nombre="X", categoria=categoria)
        self.autenticar(self.administrador)
        self.assertEqual(self.client.delete(f"/api/v1/categorias/{categoria.id}/").status_code, 409)

    def test_cors_permite_el_origen_del_frontend(self):
        resp = self.client.options(
            "/api/v1/auth/token/",
            HTTP_ORIGIN="http://localhost:5173",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        )
        self.assertEqual(resp.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173")


class BorradoLineasCerradasTests(RolesTestCase):
    def setUp(self):
        self.crear_usuarios_por_rol()
        self.autenticar(self.administrador)

    def test_no_se_borran_lineas_de_conteo_cerrado(self):
        from apps.conteos.models import ConteoInventario, LineaConteo
        from apps.inventario.models import Almacen

        categoria = Categoria.objects.create(nombre="C")
        producto = Producto.objects.create(sku="P-1", nombre="P", categoria=categoria)
        conteo = ConteoInventario.objects.create(
            almacen=Almacen.objects.create(nombre="A"), creado_por=self.administrador, estado="cerrado"
        )
        linea = LineaConteo.objects.create(conteo=conteo, producto=producto, cantidad_sistema=0, cantidad_contada=0)
        self.assertEqual(self.client.delete(f"/api/v1/lineas-conteo/{linea.id}/").status_code, 400)

    def test_no_se_borran_lineas_de_orden_recibida(self):
        from apps.compras.models import LineaCompra, OrdenCompra
        from apps.proveedores.models import Proveedor

        categoria = Categoria.objects.create(nombre="C")
        producto = Producto.objects.create(sku="P-1", nombre="P", categoria=categoria)
        orden = OrdenCompra.objects.create(
            proveedor=Proveedor.objects.create(nombre="Prov"), creada_por=self.administrador, estado="recibida"
        )
        linea = LineaCompra.objects.create(orden=orden, producto=producto, cantidad=1, costo_unitario=1)
        self.assertEqual(self.client.delete(f"/api/v1/lineas-compra/{linea.id}/").status_code, 400)
