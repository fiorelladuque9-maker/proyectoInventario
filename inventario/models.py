from django.conf import settings
from django.db import models


class Almacen(models.Model):
    nombre = models.CharField(max_length=120, unique=True)
    ubicacion = models.CharField(max_length=200, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Existencia(models.Model):
    almacen = models.ForeignKey(Almacen, on_delete=models.PROTECT, related_name="existencias")
    producto = models.ForeignKey("catalogo.Producto", on_delete=models.PROTECT, related_name="existencias")
    cantidad = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["almacen", "producto"], name="existencia_producto_por_almacen_unica"),
            models.CheckConstraint(condition=models.Q(cantidad__gte=0), name="existencia_cantidad_no_negativa"),
        ]

    def __str__(self):
        return f"{self.producto} en {self.almacen}: {self.cantidad}"


class Movimiento(models.Model):
    class Tipo(models.TextChoices):
        ENTRADA = "entrada", "Entrada"
        SALIDA = "salida", "Salida"
        AJUSTE = "ajuste", "Ajuste"

    almacen = models.ForeignKey(Almacen, on_delete=models.PROTECT, related_name="movimientos")
    producto = models.ForeignKey("catalogo.Producto", on_delete=models.PROTECT, related_name="movimientos")
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    cantidad = models.DecimalField(max_digits=12, decimal_places=3)
    referencia = models.CharField(max_length=120, blank=True)
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="movimientos_inventario")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado_en"]
        constraints = [models.CheckConstraint(condition=models.Q(cantidad__gt=0), name="movimiento_cantidad_positiva")]

    def __str__(self):
        return f"{self.get_tipo_display()} {self.cantidad} {self.producto}"
