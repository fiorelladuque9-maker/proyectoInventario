from django.db.models import ProtectedError, RestrictedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Responde 409 cuando un borrado choca con registros relacionados protegidos."""
    if isinstance(exc, (ProtectedError, RestrictedError)):
        return Response(
            {"detail": "No se puede eliminar el registro porque tiene información relacionada que depende de él."},
            status=status.HTTP_409_CONFLICT,
        )
    return exception_handler(exc, context)
