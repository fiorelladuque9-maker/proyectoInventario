from rest_framework import serializers
from .models import Categoria, Producto


class CategoriaSerializer(serializers.ModelSerializer):
    cantidad_productos = serializers.IntegerField(read_only=True)

    class Meta:
        model = Categoria
        fields = ["id", "nombre", "activa", "cantidad_productos"]


class ProductoSerializer(serializers.ModelSerializer):
    stock_total = serializers.DecimalField(max_digits=12, decimal_places=3, read_only=True)

    class Meta:
        model = Producto
        fields = [
            "id", "sku", "nombre", "descripcion", "categoria", "unidad",
            "stock_minimo", "activo", "creado_en", "stock_total",
        ]
        read_only_fields = ["creado_en", "stock_total"]

    def validate_stock_minimo(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock mínimo no puede ser negativo.")
        return value
