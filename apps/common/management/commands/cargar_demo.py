from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token

from apps.catalogo.models import Categoria, Producto
from apps.compras.models import LineaCompra, OrdenCompra
from apps.conteos.models import ConteoInventario, LineaConteo
from apps.inventario.models import Almacen, Existencia, Movimiento
from apps.inventario.services import registrar_movimiento
from apps.proveedores.models import ProductoProveedor, Proveedor

USUARIOS = (
    ("admin_demo", "Administrador", "Admin12345!"),
    ("operador_demo", "Operador", "Operador12345!"),
    ("consulta_demo", "Consulta", "Consulta12345!"),
)


class Command(BaseCommand):
    help = "Crea roles, usuarios ficticios (uno por perfil) y datos de ejemplo. Es idempotente."

    def handle(self, *args, **options):
        call_command("crear_roles", verbosity=0)
        User = get_user_model()
        for username, grupo, clave in USUARIOS:
            user, creado = User.objects.get_or_create(username=username)
            if creado:
                user.set_password(clave)
                user.save()
            user.groups.set([Group.objects.get(name=grupo)])
            Token.objects.get_or_create(user=user)
        admin = User.objects.get(username="admin_demo")

        if Producto.objects.exists():
            self.stdout.write("Ya existen productos; solo se aseguraron los usuarios de prueba.")
            self._resumen()
            return

        cats = {n: Categoria.objects.get_or_create(nombre=n)[0] for n in ("Limpieza", "Papelería", "Alimentos", "Herramientas")}
        prods = {}
        for sku, nombre, cat, unidad, minimo in (
            ("LIM-001", "Detergente líquido", "Limpieza", "litro", "10"),
            ("LIM-002", "Desinfectante", "Limpieza", "litro", "8"),
            ("PAP-001", "Resma de papel carta", "Papelería", "caja", "5"),
            ("PAP-002", "Bolígrafos azules", "Papelería", "caja", "4"),
            ("ALI-001", "Arroz 50 kg", "Alimentos", "kg", "100"),
            ("ALI-002", "Frijoles", "Alimentos", "kg", "60"),
            ("HER-001", "Martillo", "Herramientas", "unidad", "3"),
        ):
            prods[sku] = Producto.objects.create(
                sku=sku, nombre=nombre, categoria=cats[cat], unidad=unidad, stock_minimo=Decimal(minimo)
            )

        provs = {}
        for nombre, ident, correo, tel in (
            ("Distribuidora Central", "3-101-123456", "ventas@central.example", "22220001"),
            ("Suministros del Pacífico", "3-101-654321", "info@pacifico.example", "22220002"),
        ):
            provs[nombre] = Proveedor.objects.create(nombre=nombre, identificacion=ident, correo=correo, telefono=tel)
        Proveedor.objects.create(nombre="Proveedor Inactivo S.A.", activo=False)

        for prov, sku, costo, pref in (
            ("Distribuidora Central", "LIM-001", "2500", True),
            ("Distribuidora Central", "LIM-002", "1800", False),
            ("Distribuidora Central", "ALI-001", "32000", True),
            ("Distribuidora Central", "ALI-002", "21000", False),
            ("Suministros del Pacífico", "PAP-001", "9500", True),
            ("Suministros del Pacífico", "PAP-002", "4200", False),
            ("Suministros del Pacífico", "HER-001", "6800", True),
        ):
            ProductoProveedor.objects.create(
                proveedor=provs[prov], producto=prods[sku], costo_referencial=Decimal(costo), preferido=pref
            )

        principal = Almacen.objects.create(nombre="Bodega Principal", ubicacion="Puntarenas, edificio A")
        secundario = Almacen.objects.create(nombre="Bodega Secundaria", ubicacion="Puntarenas, edificio B")
        Almacen.objects.create(nombre="Bodega Cerrada", ubicacion="Sin uso", activo=False)

        # Saldos iniciales mediante entradas reales para conservar el historial.
        for alm, sku, cant in (
            (principal, "LIM-001", "25"), (principal, "LIM-002", "3"), (principal, "PAP-001", "12"),
            (principal, "ALI-001", "40"), (principal, "HER-001", "6"),
            (secundario, "ALI-002", "80"), (secundario, "PAP-002", "2"),
        ):
            registrar_movimiento(
                almacen=alm, producto=prods[sku], tipo=Movimiento.Tipo.ENTRADA,
                cantidad=Decimal(cant), usuario=admin, referencia="Carga inicial",
            )

        borrador = OrdenCompra.objects.create(
            proveedor=provs["Distribuidora Central"], creada_por=admin, notas="Reposición mensual de limpieza"
        )
        LineaCompra.objects.create(orden=borrador, producto=prods["LIM-001"], cantidad=Decimal("20"), costo_unitario=Decimal("2500"))
        enviada = OrdenCompra.objects.create(
            proveedor=provs["Suministros del Pacífico"], creada_por=admin,
            estado=OrdenCompra.Estado.ENVIADA, notas="Pedido urgente de papelería",
        )
        LineaCompra.objects.create(orden=enviada, producto=prods["PAP-001"], cantidad=Decimal("10"), costo_unitario=Decimal("9500"))
        LineaCompra.objects.create(orden=enviada, producto=prods["HER-001"], cantidad=Decimal("2"), costo_unitario=Decimal("6800"))

        conteo = ConteoInventario.objects.create(almacen=principal, creado_por=admin)
        for sku in ("LIM-001", "PAP-001"):
            sistema = Existencia.objects.get(almacen=principal, producto=prods[sku]).cantidad
            LineaConteo.objects.create(conteo=conteo, producto=prods[sku], cantidad_sistema=sistema)
        self._resumen()

    def _resumen(self):
        self.stdout.write(self.style.SUCCESS("Datos de ejemplo listos. Usuarios ficticios:"))
        for username, grupo, clave in USUARIOS:
            self.stdout.write(f"  {username} / {clave}  ({grupo})")
