from django.conf import settings
from django.db import models


class ConteoInventario(models.Model):
    class Estado(models.TextChoices):
        ABIERTO = "abierto", "Abierto"
        CERRADO = "cerrado", "Cerrado"

    almacen = models.ForeignKey("inventario.Almacen", on_delete=models.PROTECT, related_name="conteos")
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.ABIERTO)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="conteos_inventario")
    creado_en = models.DateTimeField(auto_now_add=True)
    cerrado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-creado_en"]

    def __str__(self):
        return f"Conteo #{self.pk} - {self.almacen}"


class LineaConteo(models.Model):
    conteo = models.ForeignKey(ConteoInventario, on_delete=models.CASCADE, related_name="lineas")
    producto = models.ForeignKey("catalogo.Producto", on_delete=models.PROTECT, related_name="lineas_conteo")
    cantidad_sistema = models.DecimalField(max_digits=12, decimal_places=3)
    cantidad_contada = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["conteo", "producto"], name="producto_unico_por_conteo"),
            models.CheckConstraint(condition=models.Q(cantidad_sistema__gte=0), name="conteo_sistema_no_negativo"),
            models.CheckConstraint(condition=models.Q(cantidad_contada__isnull=True) | models.Q(cantidad_contada__gte=0), name="conteo_fisico_no_negativo"),
        ]

    @property
    def diferencia(self):
        if self.cantidad_contada is None:
            return None
        return self.cantidad_contada - self.cantidad_sistema
