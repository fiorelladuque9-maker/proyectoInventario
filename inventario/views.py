from django.db.models import F
from decimal import Decimal, InvalidOperation
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from config.permissions import InventarioRolePermission
from apps.catalogo.models import Producto
from .models import Almacen, Existencia, Movimiento
from .serializers import AlmacenSerializer, ExistenciaSerializer, MovimientoSerializer


class AlmacenViewSet(ModelViewSet):
    queryset = Almacen.objects.all()
    serializer_class = AlmacenSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["activo"]
    search_fields = ["nombre", "ubicacion"]
    ordering_fields = ["nombre"]


class ExistenciaViewSet(ReadOnlyModelViewSet):
    queryset = Existencia.objects.select_related("producto", "almacen").all()
    serializer_class = ExistenciaSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["almacen", "producto"]
    search_fields = ["producto__sku", "producto__nombre", "almacen__nombre"]
    ordering_fields = ["cantidad", "producto__nombre"]

    @action(detail=False, methods=["get"], url_path="bajo-minimo")
    def bajo_minimo(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(
            cantidad__lt=F("producto__stock_minimo")
        )
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page if page is not None else queryset, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)


class MovimientoViewSet(ReadOnlyModelViewSet):
    queryset = Movimiento.objects.select_related("producto", "almacen", "registrado_por").all()
    serializer_class = MovimientoSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["almacen", "producto", "tipo"]
    search_fields = ["referencia", "producto__sku", "producto__nombre"]
    ordering_fields = ["creado_en", "cantidad"]

    @action(detail=False, methods=["post"], url_path="registrar-salida")
    def registrar_salida(self, request):
        from .services import registrar_movimiento

        try:
            almacen = Almacen.objects.get(pk=request.data.get("almacen"), activo=True)
            producto = Producto.objects.get(pk=request.data.get("producto"), activo=True)
        except (Almacen.DoesNotExist, Producto.DoesNotExist, TypeError, ValueError):
            raise ValidationError({"referencia": "El almacén o el producto no existe o está inactivo."})
        try:
            cantidad = Decimal(str(request.data.get("cantidad")))
        except (InvalidOperation, TypeError, ValueError) as exc:
            raise ValidationError({"cantidad": "Indique una cantidad numérica positiva."}) from exc
        movimiento = registrar_movimiento(
            almacen=almacen,
            producto=producto,
            tipo=Movimiento.Tipo.SALIDA,
            cantidad=cantidad,
            usuario=request.user,
            referencia=request.data.get("referencia", ""),
        )
        return Response(self.get_serializer(movimiento).data, status=status.HTTP_201_CREATED)
