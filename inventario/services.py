from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Existencia, Movimiento


@transaction.atomic
def registrar_movimiento(*, almacen, producto, tipo, cantidad, usuario, referencia=""):
    """Registra un movimiento y mantiene la existencia en la misma transacción."""
    if cantidad <= 0:
        raise ValidationError({"cantidad": "La cantidad debe ser mayor que cero."})

    existencia, _ = Existencia.objects.get_or_create(
        almacen=almacen,
        producto=producto,
        defaults={"cantidad": 0},
    )
    existencia = Existencia.objects.select_for_update().get(pk=existencia.pk)

    if tipo == Movimiento.Tipo.SALIDA:
        if existencia.cantidad < cantidad:
            raise ValidationError({"cantidad": "No hay existencias suficientes para registrar esta salida."})
        existencia.cantidad -= cantidad
    elif tipo == Movimiento.Tipo.ENTRADA:
        existencia.cantidad += cantidad
    else:
        raise ValidationError({"tipo": "Use entrada o salida para modificar existencias."})

    existencia.save(update_fields=["cantidad"])
    return Movimiento.objects.create(
        almacen=almacen,
        producto=producto,
        tipo=tipo,
        cantidad=cantidad,
        referencia=referencia,
        registrado_por=usuario,
    )
