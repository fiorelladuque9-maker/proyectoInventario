from rest_framework.viewsets import ModelViewSet
from config.permissions import InventarioRolePermission
from .models import ProductoProveedor, Proveedor
from .serializers import ProductoProveedorSerializer, ProveedorSerializer


class ProveedorViewSet(ModelViewSet):
    queryset = Proveedor.objects.prefetch_related("productos").all()
    serializer_class = ProveedorSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["activo"]
    search_fields = ["nombre", "identificacion", "correo"]
    ordering_fields = ["nombre"]


class ProductoProveedorViewSet(ModelViewSet):
    queryset = ProductoProveedor.objects.select_related("proveedor", "producto").all()
    serializer_class = ProductoProveedorSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["proveedor", "producto", "preferido"]
    search_fields = ["proveedor__nombre", "producto__nombre", "producto__sku"]
    ordering_fields = ["costo_referencial"]
