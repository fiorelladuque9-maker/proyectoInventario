from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Crea los perfiles Administrador, Operador y Consulta para la API."

    def handle(self, *args, **options):
        for name in ("Administrador", "Operador", "Consulta"):
            Group.objects.get_or_create(name=name)

        # Los roles se aplican en la API mediante InventarioRolePermission.
        # Se asignan permisos Django de lectura también para el panel de administración.
        read_permissions = Permission.objects.filter(
            content_type__app_label__in=["catalogo", "proveedores", "compras", "inventario", "conteos"],
            codename__startswith="view_",
        )
        Group.objects.get(name="Consulta").permissions.set(read_permissions)
        self.stdout.write(self.style.SUCCESS("Perfiles listos: Administrador, Operador y Consulta."))
