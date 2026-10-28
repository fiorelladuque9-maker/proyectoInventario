"""CRUD y reglas del módulo de proveedores y de su relación con productos."""
from apps.common.tests.helpers import RolesTestCase
from apps.proveedores.models import Proveedor


class ProveedorAPITests(RolesTestCase):
    def setUp(self):
        self.crear_usuarios_por_rol()
        self.url = "/api/v1/proveedores/"

    def datos(self, **extra):
        data = {"nombre": "Distribuidora Sur", "identificacion": "3-101-123456",
                "correo": "ventas@sur.test", "telefono": "2222-0000", "activo": True}
        data.update(extra)
        return data

    def test_operador_crea_proveedor(self):
        self.autenticar(self.operador)
        response = self.client.post(self.url, self.datos(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Proveedor.objects.filter(nombre="Distribuidora Sur").exists())

    def test_nombre_duplicado_se_rechaza(self):
        Proveedor.objects.create(nombre="Distribuidora Sur")
        self.autenticar(self.operador)
        response = self.client.post(self.url, self.datos(), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("nombre", response.data)
