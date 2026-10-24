from django.contrib import admin
from .models import LineaCompra, OrdenCompra


class LineaCompraInline(admin.TabularInline):
    model = LineaCompra
    extra = 0


@admin.register(OrdenCompra)
class OrdenCompraAdmin(admin.ModelAdmin):
    list_display = ("id", "proveedor", "estado", "creada_por", "creada_en")
    list_filter = ("estado", "creada_en")
    search_fields = ("proveedor__nombre",)
    inlines = (LineaCompraInline,)
