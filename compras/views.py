from django.db import transaction
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from apps.inventario.models import Almacen, Movimiento
from apps.inventario.services import registrar_movimiento
from config.permissions import InventarioRolePermission
from .models import LineaCompra, OrdenCompra
from .serializers import LineaCompraSerializer, OrdenCompraSerializer


class OrdenCompraViewSet(ModelViewSet):
    queryset = OrdenCompra.objects.select_related("proveedor", "creada_por").prefetch_related("lineas__producto").all()
    serializer_class = OrdenCompraSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["proveedor", "estado"]
    search_fields = ["proveedor__nombre", "notas"]
    ordering_fields = ["creada_en", "estado"]

    def perform_create(self, serializer):
        serializer.save(creada_por=self.request.user)

    @action(detail=True, methods=["post"])
    def enviar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado != OrdenCompra.Estado.BORRADOR:
            raise ValidationError({"estado": "Solo se puede enviar una orden en borrador."})
        if not orden.lineas.exists():
            raise ValidationError({"lineas": "Agregue al menos un producto antes de enviar la orden."})
        orden.estado = OrdenCompra.Estado.ENVIADA
        orden.save(update_fields=["estado"])
        return Response(self.get_serializer(orden).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def recibir(self, request, pk=None):
        with transaction.atomic():
            orden = OrdenCompra.objects.select_for_update().get(pk=pk)
            if orden.estado != OrdenCompra.Estado.ENVIADA:
                raise ValidationError({"estado": "Solo se puede recibir una orden enviada."})
            try:
                almacen = Almacen.objects.get(pk=request.data.get("almacen"), activo=True)
            except (Almacen.DoesNotExist, TypeError, ValueError):
                raise ValidationError({"almacen": "Indique un almacén activo válido."})
            lineas = list(orden.lineas.select_related("producto").all())
            if not lineas:
                raise ValidationError({"lineas": "La orden no tiene productos."})
            for linea in lineas:
                registrar_movimiento(
                    almacen=almacen,
                    producto=linea.producto,
                    tipo=Movimiento.Tipo.ENTRADA,
                    cantidad=linea.cantidad,
                    usuario=request.user,
                    referencia=f"Recepción de orden #{orden.pk}",
                )
                linea.cantidad_recibida = linea.cantidad
                linea.save(update_fields=["cantidad_recibida"])
            orden.estado = OrdenCompra.Estado.RECIBIDA
            orden.save(update_fields=["estado"])
        orden.refresh_from_db()
        return Response(self.get_serializer(orden).data, status=status.HTTP_200_OK)


class LineaCompraViewSet(ModelViewSet):
    queryset = LineaCompra.objects.select_related("orden", "producto").all()
    serializer_class = LineaCompraSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["orden", "producto"]
    search_fields = ["producto__sku", "producto__nombre"]
    ordering_fields = ["cantidad", "costo_unitario"]
