from django.contrib import admin
from .models import Almacen, Existencia, Movimiento


@admin.register(Almacen)
class AlmacenAdmin(admin.ModelAdmin):
    list_display = ("nombre", "ubicacion", "activo")
    search_fields = ("nombre", "ubicacion")
    list_filter = ("activo",)


@admin.register(Existencia)
class ExistenciaAdmin(admin.ModelAdmin):
    list_display = ("producto", "almacen", "cantidad")
    search_fields = ("producto__sku", "producto__nombre", "almacen__nombre")
    list_filter = ("almacen",)


@admin.register(Movimiento)
class MovimientoAdmin(admin.ModelAdmin):
    list_display = ("producto", "almacen", "tipo", "cantidad", "registrado_por", "creado_en")
    list_filter = ("tipo", "almacen", "creado_en")
    search_fields = ("producto__sku", "producto__nombre", "referencia")
