from django.contrib import admin
from .models import ProductoProveedor, Proveedor


class ProductoProveedorInline(admin.TabularInline):
    model = ProductoProveedor
    extra = 0


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ("nombre", "identificacion", "correo", "telefono", "activo")
    search_fields = ("nombre", "identificacion", "correo")
    list_filter = ("activo",)
    inlines = (ProductoProveedorInline,)
