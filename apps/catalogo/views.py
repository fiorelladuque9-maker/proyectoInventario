from decimal import Decimal

from django.db.models import Count, DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework.viewsets import ModelViewSet
from config.permissions import InventarioRolePermission
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer


# ModelViewSet ofrece las operaciones CRUD estándar para categorías.
class CategoriaViewSet(ModelViewSet):
    # Cuenta los productos por categoría en la consulta, sin una consulta adicional por fila.
    queryset = Categoria.objects.annotate(cantidad_productos=Count("productos")).all()
    serializer_class = CategoriaSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["activa"]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]


# El catálogo expone CRUD, búsqueda y filtros para encontrar productos.
class ProductoViewSet(ModelViewSet):
    # Trae la categoría relacionada y calcula el stock sumando todos los almacenes.
    # Coalesce convierte el resultado nulo en cero para productos sin existencias.
    queryset = (
        Producto.objects.select_related("categoria")
        .annotate(
            stock_total=Coalesce(
                Sum("existencias__cantidad"),
                Value(Decimal("0.000")),
                output_field=DecimalField(max_digits=12, decimal_places=3),
            )
        )
        .all()
    )
    serializer_class = ProductoSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["categoria", "unidad", "activo"]
    search_fields = ["sku", "nombre", "descripcion"]
    ordering_fields = ["nombre", "sku", "stock_minimo", "creado_en"]



