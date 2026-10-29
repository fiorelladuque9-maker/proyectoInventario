"""Pruebas de autenticación por token y de la matriz de permisos de los tres perfiles."""
from apps.catalogo.models import Categoria
from apps.inventario.models import Almacen
from apps.proveedores.models import Proveedor

from .helpers import RolesTestCase

LISTADOS = [
    "/api/categorias/",
    "/api/productos/",
    "/api/proveedores/",
    "/api/productos-proveedor/",
    "/api/ordenes-compra/",
    "/api/lineas-compra/",
    "/api/almacenes/",
    "/api/existencias/",
    "/api/movimientos/",
    "/api/conteos/",
    "/api/lineas-conteo/",
]


class TokenAPITests(RolesTestCase):
    def setUp(self):
        self.crear_usuarios_por_rol()
        self.url = "/api/token/"


    def test_login_correcto_devuelve_token(self):
        response = self.client.post(
            self.url, {"username": "operador_prueba", "password": self.PASSWORD}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["token"], self.operador.auth_token.key)

    def test_login_con_clave_incorrecta_se_rechaza(self):
        response = self.client.post(
            self.url, {"username": "operador_prueba", "password": "incorrecta"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertNotIn("token", response.data)


class PermisosPorPerfilTests(RolesTestCase):
    def setUp(self):
        self.crear_usuarios_por_rol()
        self.categoria = Categoria.objects.create(nombre="Base")
        self.proveedor = Proveedor.objects.create(nombre="Proveedor Base")
        self.almacen = Almacen.objects.create(nombre="Almacén Base")


    def test_usuario_sin_perfil_recibe_403_en_todos_los_listados(self):
        self.autenticar(self.sin_grupo)
        for url in LISTADOS:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 403)

    def test_los_tres_perfiles_pueden_leer_todos_los_listados(self):
        for usuario in (self.administrador, self.operador, self.consulta):
            self.autenticar(usuario)
            for url in LISTADOS:
                with self.subTest(usuario=usuario.username, url=url):
                    self.assertEqual(self.client.get(url).status_code, 200)

    def test_consulta_no_puede_crear_en_ningun_modulo(self):
        self.autenticar(self.consulta)
        intentos = {
            "/api/categorias/": {"nombre": "Nueva"},
            "/api/proveedores/": {"nombre": "Nuevo proveedor"},
            "/api/almacenes/": {"nombre": "Nuevo almacén"},
            "/api/ordenes-compra/": {"proveedor": self.proveedor.pk},
            "/api/conteos/": {"almacen": self.almacen.pk},
        }
        for url, datos in intentos.items():
            with self.subTest(url=url):
                self.assertEqual(self.client.post(url, datos, format="json").status_code, 403)


    def test_operador_no_puede_borrar_en_ningun_modulo(self):
        self.autenticar(self.operador)
        for url in (
            f"/api/categorias/{self.categoria.pk}/",
            f"/api/proveedores/{self.proveedor.pk}/",
            f"/api/almacenes/{self.almacen.pk}/",
        ):
            with self.subTest(url=url):
                self.assertEqual(self.client.delete(url).status_code, 403)
        self.assertTrue(Proveedor.objects.filter(pk=self.proveedor.pk).exists())
