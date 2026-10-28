from rest_framework import serializers
from apps.inventario.models import Existencia
from .models import ConteoInventario, LineaConteo


class ConteoInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConteoInventario
        fields = "__all__"
        read_only_fields = ["creado_por", "creado_en", "cerrado_en", "estado"]


class LineaConteoSerializer(serializers.ModelSerializer):
    diferencia = serializers.DecimalField(max_digits=12, decimal_places=3, read_only=True, allow_null=True)

    class Meta:
        model = LineaConteo
        fields = "__all__"
        read_only_fields = ["cantidad_sistema", "diferencia"]

    # Una vez cerrado el conteo, sus líneas no deben cambiar; PATCH también se valida.
    def validate(self, attrs):
        conteo = attrs.get("conteo", getattr(self.instance, "conteo", None))
        producto = attrs.get("producto", getattr(self.instance, "producto", None))
        if conteo and conteo.estado != ConteoInventario.Estado.ABIERTO:
            raise serializers.ValidationError("No se pueden editar las líneas de un conteo cerrado.")
        cantidad_contada = attrs.get("cantidad_contada", getattr(self.instance, "cantidad_contada", None))
        if cantidad_contada is not None and cantidad_contada < 0:
            raise serializers.ValidationError({"cantidad_contada": "La cantidad contada no puede ser negativa."})
        if self.instance and producto != self.instance.producto:
            raise serializers.ValidationError({"producto": "No se puede cambiar el producto de una línea existente."})
        return attrs

    # Al iniciar una línea se guarda una fotografía del saldo que se va a comparar.
    def create(self, validated_data):
        conteo = validated_data["conteo"]
        producto = validated_data["producto"]
        existencia = Existencia.objects.filter(almacen=conteo.almacen, producto=producto).first()
        validated_data["cantidad_sistema"] = existencia.cantidad if existencia else 0
        return super().create(validated_data)
