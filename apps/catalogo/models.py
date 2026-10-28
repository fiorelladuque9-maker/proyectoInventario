from django.db import models


# Las categorías agrupan productos y evitan repetir su clasificación.
class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ["nombre"]
        verbose_name_plural = "categorías"

    def __str__(self):
        return self.nombre


# Producto guarda el identificador de catálogo y su nivel mínimo de existencias.
class Producto(models.Model):
    class Unidad(models.TextChoices):
        UNIDAD = "unidad", "Unidad"
        KILOGRAMO = "kg", "Kilogramo"
        LITRO = "litro", "Litro"
        CAJA = "caja", "Caja"

    sku = models.CharField(max_length=40, unique=True)
    nombre = models.CharField(max_length=160)
    descripcion = models.TextField(blank=True)
    # PROTECT evita borrar una categoría que todavía tenga productos.
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name="productos")
    unidad = models.CharField(max_length=10, choices=Unidad.choices, default=Unidad.UNIDAD)
    stock_minimo = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nombre"]
        # La base de datos también protege la regla de que el mínimo no sea negativo.
        constraints = [models.CheckConstraint(condition=models.Q(stock_minimo__gte=0), name="producto_stock_minimo_no_negativo")]

    def __str__(self):
        return f"{self.sku} - {self.nombre}"
