from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.catalogo.models import Categoria, Producto
from apps.compras.models import LineaCompra, OrdenCompra
from apps.inventario.models import Almacen, Existencia, Movimiento
from apps.proveedores.models import ProductoProveedor, Proveedor


class OrdenCompraAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="operador", password="clave-prueba-123")
        group, _ = Group.objects.get_or_create(name="Operador")
        self.user.groups.add(group)
        token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        self.categoria = Categoria.objects.create(nombre="Papelería")
        self.proveedor = Proveedor.objects.create(nombre="Distribuidora Norte")
        self.producto = Producto.objects.create(sku="PAP-001", nombre="Papel", categoria=self.categoria)
        ProductoProveedor.objects.create(proveedor=self.proveedor, producto=self.producto, costo_referencial="10.00")
        self.otro_producto = Producto.objects.create(sku="PAP-002", nombre="Cartulina", categoria=self.categoria)
        self.almacen = Almacen.objects.create(nombre="Central")

    def crear_orden(self):
        response = self.client.post(
            "/api/v1/ordenes-compra/",
            {"proveedor": self.proveedor.pk, "notas": "Reposición mensual"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        return OrdenCompra.objects.get(pk=response.data["id"])

    def test_producto_no_asociado_al_proveedor_se_rechaza(self):
        order = self.crear_orden()
        response = self.client.post(
            "/api/v1/lineas-compra/",
            {"orden": order.pk, "producto": self.otro_producto.pk, "cantidad": "2", "costo_unitario": "8.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(LineaCompra.objects.filter(orden=order).exists())

    def test_no_se_envia_orden_sin_lineas(self):
        order = self.crear_orden()
        response = self.client.post(f"/api/v1/ordenes-compra/{order.pk}/enviar/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        order.refresh_from_db()
        self.assertEqual(order.estado, OrdenCompra.Estado.BORRADOR)

    def test_orden_borrador_no_se_puede_recibir(self):
        order = self.crear_orden()
        response = self.client.post(
            f"/api/v1/ordenes-compra/{order.pk}/recibir/",
            {"almacen": self.almacen.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Existencia.objects.filter(almacen=self.almacen).exists())

    def test_recibir_orden_enviada_aumenta_stock_y_registra_movimiento(self):
        order = self.crear_orden()
        line_response = self.client.post(
            "/api/v1/lineas-compra/",
            {"orden": order.pk, "producto": self.producto.pk, "cantidad": "4", "costo_unitario": "10.00"},
            format="json",
        )
        self.assertEqual(line_response.status_code, 201)
        send_response = self.client.post(f"/api/v1/ordenes-compra/{order.pk}/enviar/", {}, format="json")
        self.assertEqual(send_response.status_code, 200)

        response = self.client.post(
            f"/api/v1/ordenes-compra/{order.pk}/recibir/",
            {"almacen": self.almacen.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["estado"], OrdenCompra.Estado.RECIBIDA)
        self.assertEqual(Existencia.objects.get(almacen=self.almacen, producto=self.producto).cantidad, 4)
        self.assertEqual(Movimiento.objects.filter(referencia=f"Recepción de orden #{order.pk}").count(), 1)

    def test_orden_recibida_no_se_puede_recibir_dos_veces(self):
        order = self.crear_orden()
        self.client.post(
            "/api/v1/lineas-compra/",
            {"orden": order.pk, "producto": self.producto.pk, "cantidad": "4", "costo_unitario": "10.00"},
            format="json",
        )
        self.client.post(f"/api/v1/ordenes-compra/{order.pk}/enviar/", {}, format="json")
        self.client.post(f"/api/v1/ordenes-compra/{order.pk}/recibir/", {"almacen": self.almacen.pk}, format="json")

        response = self.client.post(
            f"/api/v1/ordenes-compra/{order.pk}/recibir/",
            {"almacen": self.almacen.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Existencia.objects.get(almacen=self.almacen, producto=self.producto).cantidad, 4)
