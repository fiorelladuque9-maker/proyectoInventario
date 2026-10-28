from django.db.models import Count
from rest_framework.viewsets import ModelViewSet
from config.permissions import InventarioRolePermission
from .models import ProductoProveedor, Proveedor
from .serializers import ProductoProveedorSerializer, ProveedorSerializer


# Devuelve proveedores con su número de productos, filtros y búsqueda.
class ProveedorViewSet(ModelViewSet):
    # distinct=True evita contar dos veces un producto por las uniones de la relación N:M.
    queryset = Proveedor.objects.annotate(cantidad_productos=Count("productos", distinct=True)).all()
    serializer_class = ProveedorSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["activo"]
    search_fields = ["nombre", "identificacion", "correo"]
    ordering_fields = ["nombre"]


# Administra la relación y los datos comerciales entre proveedor y producto.
class ProductoProveedorViewSet(ModelViewSet):
    queryset = ProductoProveedor.objects.select_related("proveedor", "producto").all()
    serializer_class = ProductoProveedorSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["proveedor", "producto", "preferido"]
    search_fields = ["proveedor__nombre", "producto__nombre", "producto__sku"]
    ordering_fields = ["costo_referencial"]
