from django.contrib import admin
from .models import ConteoInventario, LineaConteo


class LineaConteoInline(admin.TabularInline):
    model = LineaConteo
    extra = 0
    readonly_fields = ("cantidad_sistema",)


@admin.register(ConteoInventario)
class ConteoInventarioAdmin(admin.ModelAdmin):
    list_display = ("id", "almacen", "estado", "creado_por", "creado_en", "cerrado_en")
    list_filter = ("estado", "almacen", "creado_en")
    inlines = (LineaConteoInline,)
