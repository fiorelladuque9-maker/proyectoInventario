from django.db import models


class Proveedor(models.Model):
    nombre = models.CharField(max_length=160, unique=True)
    identificacion = models.CharField(max_length=30, blank=True)
    correo = models.EmailField(blank=True)
    telefono = models.CharField(max_length=30, blank=True)
    activo = models.BooleanField(default=True)
    productos = models.ManyToManyField("catalogo.Producto", through="ProductoProveedor", related_name="proveedores")

    class Meta:
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class ProductoProveedor(models.Model):
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name="catalogo")
    producto = models.ForeignKey("catalogo.Producto", on_delete=models.PROTECT, related_name="ofertas_proveedor")
    codigo_proveedor = models.CharField(max_length=60, blank=True)
    costo_referencial = models.DecimalField(max_digits=12, decimal_places=2)
    preferido = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["proveedor", "producto"], name="proveedor_producto_unico"),
            models.CheckConstraint(condition=models.Q(costo_referencial__gte=0), name="oferta_costo_no_negativo"),
        ]

    def __str__(self):
        return f"{self.proveedor} - {self.producto}"
