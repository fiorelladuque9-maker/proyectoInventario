from rest_framework import serializers
from .models import ProductoProveedor, Proveedor


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = "__all__"


class ProductoProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoProveedor
        fields = "__all__"

    def validate_costo_referencial(self, value):
        if value < 0:
            raise serializers.ValidationError("El costo referencial no puede ser negativo.")
        return value
