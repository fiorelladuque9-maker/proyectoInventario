from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.catalogo.models import Categoria, Producto
from apps.conteos.models import ConteoInventario, LineaConteo
from apps.inventario.models import Almacen, Existencia, Movimiento


class ConteoInventarioAPITests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(username="operador", password="clave-prueba-123")
        group, _ = Group.objects.get_or_create(name="Operador")
        user.groups.add(group)
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.user = user

        category = Categoria.objects.create(nombre="Oficina")
        self.producto = Producto.objects.create(sku="OFI-001", nombre="Marcador", categoria=category)
        self.almacen = Almacen.objects.create(nombre="Almacén principal")
        self.existencia = Existencia.objects.create(almacen=self.almacen, producto=self.producto, cantidad="5.000")

    def crear_conteo(self):
        return ConteoInventario.objects.create(almacen=self.almacen, creado_por=self.user)


    def test_cerrar_conteo_ajusta_stock_y_registra_movimiento(self):
        conteo = self.crear_conteo()
        LineaConteo.objects.create(
            conteo=conteo, producto=self.producto, cantidad_sistema=5, cantidad_contada=7
        )
        response = self.client.post(f"/api/v1/conteos/{conteo.pk}/cerrar/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.existencia.refresh_from_db()
        conteo.refresh_from_db()
        self.assertEqual(self.existencia.cantidad, 7)
        self.assertEqual(conteo.estado, ConteoInventario.Estado.CERRADO)
        self.assertEqual(Movimiento.objects.filter(referencia=f"Ajuste por conteo #{conteo.pk}").count(), 1)
