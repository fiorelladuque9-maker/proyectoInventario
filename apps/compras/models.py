from django.conf import settings
from django.db import models


# La orden avanza por estados; las acciones de la API controlan esas transiciones.
class OrdenCompra(models.Model):
    class Estado(models.TextChoices):
        BORRADOR = "borrador", "Borrador"
        ENVIADA = "enviada", "Enviada"
        RECIBIDA = "recibida", "Recibida"
        CANCELADA = "cancelada", "Cancelada"

    proveedor = models.ForeignKey("proveedores.Proveedor", on_delete=models.PROTECT, related_name="ordenes")
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.BORRADOR)
    creada_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="ordenes_compra")
    creada_en = models.DateTimeField(auto_now_add=True)
    notas = models.TextField(blank=True)

    class Meta:
        ordering = ["-creada_en"]

    def __str__(self):
        return f"Orden #{self.pk} ({self.get_estado_display()})"


# Cada línea indica cuánto producto se pide y cuánto se ha recibido.
class LineaCompra(models.Model):
    orden = models.ForeignKey(OrdenCompra, on_delete=models.CASCADE, related_name="lineas")
    producto = models.ForeignKey("catalogo.Producto", on_delete=models.PROTECT, related_name="lineas_compra")
    cantidad = models.DecimalField(max_digits=12, decimal_places=3)
    costo_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    cantidad_recibida = models.DecimalField(max_digits=12, decimal_places=3, default=0)

    class Meta:
        constraints = [
            # Una orden no puede repetir el mismo producto en líneas distintas.
            models.UniqueConstraint(fields=["orden", "producto"], name="producto_unico_por_orden"),
            models.CheckConstraint(condition=models.Q(cantidad__gt=0), name="linea_compra_cantidad_positiva"),
            models.CheckConstraint(condition=models.Q(costo_unitario__gte=0), name="linea_compra_costo_no_negativo"),
            models.CheckConstraint(condition=models.Q(cantidad_recibida__gte=0), name="linea_compra_recibida_no_negativa"),
        ]

    def __str__(self):
        return f"{self.producto} x {self.cantidad}"
