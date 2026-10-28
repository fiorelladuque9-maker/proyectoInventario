from rest_framework import serializers
from .models import Almacen, Existencia, Movimiento


class AlmacenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Almacen
        fields = "__all__"


# El saldo se consulta; solo los procesos de negocio autorizados pueden cambiarlo.
class ExistenciaSerializer(serializers.ModelSerializer):
    producto_sku = serializers.CharField(source="producto.sku", read_only=True)
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    almacen_nombre = serializers.CharField(source="almacen.nombre", read_only=True)

    class Meta:
        model = Existencia
        fields = ["id", "almacen", "almacen_nombre", "producto", "producto_sku", "producto_nombre", "cantidad"]
        read_only_fields = fields


# El historial es de solo lectura desde el CRUD; se agrega mediante acciones de negocio.
class MovimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movimiento
        fields = "__all__"
        read_only_fields = fields
