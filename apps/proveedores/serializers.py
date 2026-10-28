from rest_framework import serializers
from .models import ProductoProveedor, Proveedor


class ProveedorSerializer(serializers.ModelSerializer):
    # La cantidad se calcula en la vista y solo se devuelve como dato de lectura.
    cantidad_productos = serializers.IntegerField(read_only=True)

    class Meta:
        model = Proveedor
        fields = [
            "id", "nombre", "identificacion", "correo", "telefono",
            "activo", "productos", "cantidad_productos",
        ]


class ProductoProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoProveedor
        fields = "__all__"

    # Un precio negativo no tiene sentido como costo de referencia.
    def validate_costo_referencial(self, value):
        if value < 0:
            raise serializers.ValidationError("El costo referencial no puede ser negativo.")
        return value
