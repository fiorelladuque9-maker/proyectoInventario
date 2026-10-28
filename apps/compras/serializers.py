from rest_framework import serializers
from .models import LineaCompra, OrdenCompra


class OrdenCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdenCompra
        fields = "__all__"
        read_only_fields = ["creada_por", "creada_en", "estado"]

    # También considera los valores actuales para que PATCH respete las mismas reglas.
    def validate(self, attrs):
        proveedor = attrs.get("proveedor", getattr(self.instance, "proveedor", None))
        estado = attrs.get("estado", getattr(self.instance, "estado", None))
        if proveedor and not proveedor.activo:
            raise serializers.ValidationError({"proveedor": "No se pueden crear órdenes para un proveedor inactivo."})
        if self.instance and self.instance.estado in {OrdenCompra.Estado.RECIBIDA, OrdenCompra.Estado.CANCELADA}:
            if estado != self.instance.estado:
                raise serializers.ValidationError({"estado": "Una orden recibida o cancelada no puede reabrirse."})
        return attrs


class LineaCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineaCompra
        fields = "__all__"
        read_only_fields = ["cantidad_recibida"]

    # Verifica cantidades, costos y la relación comercial incluso en actualizaciones parciales.
    def validate(self, attrs):
        orden = attrs.get("orden", getattr(self.instance, "orden", None))
        producto = attrs.get("producto", getattr(self.instance, "producto", None))
        cantidad = attrs.get("cantidad", getattr(self.instance, "cantidad", None))
        costo = attrs.get("costo_unitario", getattr(self.instance, "costo_unitario", None))
        recibida = attrs.get("cantidad_recibida", getattr(self.instance, "cantidad_recibida", 0))
        if cantidad is not None and cantidad <= 0:
            raise serializers.ValidationError({"cantidad": "La cantidad debe ser mayor que cero."})
        if costo is not None and costo < 0:
            raise serializers.ValidationError({"costo_unitario": "El costo no puede ser negativo."})
        if cantidad is not None and recibida > cantidad:
            raise serializers.ValidationError({"cantidad_recibida": "La cantidad recibida no puede superar la ordenada."})
        if orden and orden.estado in {OrdenCompra.Estado.RECIBIDA, OrdenCompra.Estado.CANCELADA}:
            raise serializers.ValidationError("No se pueden modificar las líneas de una orden cerrada.")
        # El producto debe formar parte de la oferta del proveedor de esta orden.
        if orden and producto and orden.proveedor_id:
            if not producto.ofertas_proveedor.filter(proveedor=orden.proveedor).exists():
                raise serializers.ValidationError({"producto": "El producto no está asociado con el proveedor de la orden."})
        return attrs
