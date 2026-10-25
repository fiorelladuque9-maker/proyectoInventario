from rest_framework.viewsets import ModelViewSet
from config.permissions import InventarioRolePermission
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer

class CategoriaViewSet(ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["activa"]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]

class ProductoViewSet(ModelViewSet):
    queryset = Producto.objects.select_related("categoria").all()
    serializer_class = ProductoSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["categoria", "unidad", "activo"]
    search_fields = ["sku", "nombre", "descripcion"]
    ordering_fields = ["nombre", "sku", "stock_minimo", "creado_en"]

