from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.catalogo.models import Categoria, Producto


class ProductoAPITests(APITestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Limpieza")
        self.operador = self.crear_usuario("operador", "Operador")
        self.consulta = self.crear_usuario("consulta", "Consulta")
        self.administrador = self.crear_usuario("administrador", "Administrador")
        self.url = reverse("producto-list")

    def crear_usuario(self, username, grupo_nombre):
        user = get_user_model().objects.create_user(username=username, password="clave-prueba-123")
        grupo, _ = Group.objects.get_or_create(name=grupo_nombre)
        user.groups.add(grupo)
        Token.objects.get_or_create(user=user)
        return user

    def autenticar(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {user.auth_token.key}")

    def datos_producto(self, **overrides):
        data = {
            "sku": "JAB-001",
            "nombre": "Jabón",
            "descripcion": "Jabón de limpieza",
            "categoria": self.categoria.pk,
            "unidad": "unidad",
            "stock_minimo": "5.000",
            "activo": True,
        }
        data.update(overrides)
        return data

    def test_operador_crea_producto(self):
        self.autenticar(self.operador)
        response = self.client.post(self.url, self.datos_producto(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Producto.objects.filter(sku="JAB-001").exists())


    def test_administrador_elimina_producto(self):
        product = Producto.objects.create(sku="JAB-001", nombre="Jabón", categoria=self.categoria)
        self.autenticar(self.administrador)
        response = self.client.delete(reverse("producto-detail", args=[product.pk]))
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Producto.objects.filter(pk=product.pk).exists())

    def test_stock_minimo_negativo_se_rechaza(self):
        self.autenticar(self.operador)
        response = self.client.post(self.url, self.datos_producto(stock_minimo="-1"), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("stock_minimo", response.data)
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.catalogo.models import Categoria, Producto


# Estas pruebas cubren CRUD, filtros, paginación, validaciones y perfiles de acceso.
class ProductoAPITests(APITestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Limpieza")
        self.operador = self.crear_usuario("operador", "Operador")
        self.consulta = self.crear_usuario("consulta", "Consulta")
        self.administrador = self.crear_usuario("administrador", "Administrador")
        self.url = reverse("producto-list")

    def crear_usuario(self, username, grupo_nombre):
        user = get_user_model().objects.create_user(username=username, password="clave-prueba-123")
        grupo, _ = Group.objects.get_or_create(name=grupo_nombre)
        user.groups.add(grupo)
        Token.objects.get_or_create(user=user)
        return user

    def autenticar(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {user.auth_token.key}")

    def datos_producto(self, **overrides):
        data = {
            "sku": "JAB-001",
            "nombre": "Jabón",
            "descripcion": "Jabón de limpieza",
            "categoria": self.categoria.pk,
            "unidad": "unidad",
            "stock_minimo": "5.000",
            "activo": True,
        }
        data.update(overrides)
        return data

    # Operador puede crear un producto y la API responde 201.
    def test_operador_crea_producto(self):
        self.autenticar(self.operador)
        response = self.client.post(self.url, self.datos_producto(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Producto.objects.filter(sku="JAB-001").exists())

    # El filtro devuelve solo los productos de la categoría solicitada.
    def test_lista_productos_filtrada_por_categoria(self):
        otra_categoria = Categoria.objects.create(nombre="Alimentos")
        Producto.objects.create(sku="JAB-001", nombre="Jabón", categoria=self.categoria)
        Producto.objects.create(sku="ARR-001", nombre="Arroz", categoria=otra_categoria)
        self.autenticar(self.operador)
        response = self.client.get(self.url, {"categoria": self.categoria.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["sku"], "JAB-001")

    # Un usuario autenticado puede consultar el detalle de un producto.
    def test_consulta_detalle_producto(self):
        product = Producto.objects.create(sku="JAB-001", nombre="Jabón", categoria=self.categoria)
        self.autenticar(self.operador)
        response = self.client.get(reverse("producto-detail", args=[product.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["nombre"], "Jabón")

    # PATCH cambia solo el nombre y conserva el resto del producto.
    def test_operador_actualiza_producto(self):
        product = Producto.objects.create(sku="JAB-001", nombre="Jabón", categoria=self.categoria)
        self.autenticar(self.operador)
        response = self.client.patch(
            reverse("producto-detail", args=[product.pk]),
            {"nombre": "Jabón líquido"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        product.refresh_from_db()
        self.assertEqual(product.nombre, "Jabón líquido")

    # Solo Administrador puede eliminar y recibe 204.
    def test_administrador_elimina_producto(self):
        product = Producto.objects.create(sku="JAB-001", nombre="Jabón", categoria=self.categoria)
        self.autenticar(self.administrador)
        response = self.client.delete(reverse("producto-detail", args=[product.pk]))
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Producto.objects.filter(pk=product.pk).exists())

    # Una regla inválida se rechaza con 400 y señala el campo afectado.
    def test_stock_minimo_negativo_se_rechaza(self):
        self.autenticar(self.operador)
        response = self.client.post(self.url, self.datos_producto(stock_minimo="-1"), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("stock_minimo", response.data)

    # Sin token no se permite consultar la API protegida.
    def test_usuario_sin_token_recibe_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    # Consulta puede leer, pero no crear; la respuesta esperada es 403.
    def test_perfil_consulta_no_puede_crear_producto(self):
        self.autenticar(self.consulta)
        response = self.client.post(self.url, self.datos_producto(), format="json")
        self.assertEqual(response.status_code, 403)

    # Operador escribe, pero el borrado está reservado a Administrador.
    def test_operador_no_puede_eliminar_producto(self):
        product = Producto.objects.create(sku="JAB-001", nombre="Jabón", categoria=self.categoria)
        self.autenticar(self.operador)
        response = self.client.delete(reverse("producto-detail", args=[product.pk]))
        self.assertEqual(response.status_code, 403)

    # Con 21 productos y páginas de 20, la segunda página contiene uno.
    def test_lista_productos_paginada(self):
        Producto.objects.bulk_create([
            Producto(sku=f"SKU-{number:03}", nombre=f"Producto {number}", categoria=self.categoria)
            for number in range(21)
        ])
        self.autenticar(self.operador)
        response = self.client.get(self.url, {"page": 2})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 21)
        self.assertEqual(len(response.data["results"]), 1)
