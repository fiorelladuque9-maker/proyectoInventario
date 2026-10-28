from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.catalogo.models import Categoria, Producto
from apps.inventario.models import Almacen, Existencia, Movimiento


class InventarioAPITests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(username="operador", password="clave-prueba-123")
        group, _ = Group.objects.get_or_create(name="Operador")
        user.groups.add(group)
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        category = Categoria.objects.create(nombre="Insumos")
        self.producto = Producto.objects.create(
            sku="INS-001", nombre="Guantes", categoria=category, stock_minimo="5.000"
        )
        self.almacen = Almacen.objects.create(nombre="Bodega")
        self.existencia = Existencia.objects.create(almacen=self.almacen, producto=self.producto, cantidad="3.000")


    def test_salida_mayor_al_stock_se_rechaza(self):
        response = self.client.post(
            "/api/v1/movimientos/registrar-salida/",
            {"almacen": self.almacen.pk, "producto": self.producto.pk, "cantidad": "4"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.existencia.refresh_from_db()
        self.assertEqual(self.existencia.cantidad, 3)
        self.assertEqual(Movimiento.objects.count(), 0)
