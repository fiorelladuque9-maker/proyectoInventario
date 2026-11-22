from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.authtoken.models import Token


def _rol_de(user):
    """Devuelve el perfil efectivo del usuario (el superusuario cuenta como Administrador)."""
    if user.is_superuser:
        return "Administrador"
    grupos = set(user.groups.values_list("name", flat=True))
    for rol in ("Administrador", "Operador", "Consulta"):
        if rol in grupos:
            return rol
    return None


# El frontend la consulta tras el login para adaptar las acciones visibles al perfil.
# La autorización real sigue aplicándose en cada endpoint (InventarioRolePermission).
@api_view(["GET"])
def me_view(request):
    rol = _rol_de(request.user)
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "rol": rol,
        "puede_escribir": rol in {"Administrador", "Operador"},
        "puede_eliminar": rol == "Administrador",
    })


# Revoca el token del servidor: el logout invalida realmente la credencial.
@api_view(["POST"])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=204)
