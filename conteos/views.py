from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from config.permissions import InventarioRolePermission
from apps.inventario.models import Movimiento
from apps.inventario.services import registrar_movimiento
from .models import ConteoInventario, LineaConteo
from .serializers import ConteoInventarioSerializer, LineaConteoSerializer


class ConteoInventarioViewSet(ModelViewSet):
    queryset = ConteoInventario.objects.select_related("almacen", "creado_por").prefetch_related("lineas__producto").all()
    serializer_class = ConteoInventarioSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["almacen", "estado"]
    search_fields = ["almacen__nombre"]
    ordering_fields = ["creado_en", "cerrado_en"]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=["post"])
    def cerrar(self, request, pk=None):
        with transaction.atomic():
            conteo = ConteoInventario.objects.select_for_update().get(pk=pk)
            if conteo.estado != ConteoInventario.Estado.ABIERTO:
                raise ValidationError({"estado": "El conteo ya está cerrado."})
            lineas = list(conteo.lineas.select_related("producto").all())
            if not lineas or any(linea.cantidad_contada is None for linea in lineas):
                raise ValidationError({"lineas": "Todas las líneas deben tener una cantidad contada antes de cerrar."})
            for linea in lineas:
                diferencia = linea.cantidad_contada - linea.cantidad_sistema
                if diferencia == 0:
                    continue
                tipo = Movimiento.Tipo.ENTRADA if diferencia > 0 else Movimiento.Tipo.SALIDA
                registrar_movimiento(
                    almacen=conteo.almacen,
                    producto=linea.producto,
                    tipo=tipo,
                    cantidad=abs(diferencia),
                    usuario=request.user,
                    referencia=f"Ajuste por conteo #{conteo.pk}",
                )
            conteo.estado = ConteoInventario.Estado.CERRADO
            conteo.cerrado_en = timezone.now()
            conteo.save(update_fields=["estado", "cerrado_en"])
        return Response(self.get_serializer(conteo).data, status=status.HTTP_200_OK)


class LineaConteoViewSet(ModelViewSet):
    queryset = LineaConteo.objects.select_related("conteo", "producto").all()
    serializer_class = LineaConteoSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["conteo", "producto"]
    search_fields = ["producto__sku", "producto__nombre"]
    ordering_fields = ["cantidad_sistema", "cantidad_contada"]
