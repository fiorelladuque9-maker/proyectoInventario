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
