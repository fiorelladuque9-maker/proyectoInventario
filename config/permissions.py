from rest_framework.permissions import SAFE_METHODS, BasePermission


class InventarioRolePermission(BasePermission):
    """Consulta puede leer; operador puede crear/editar; administrador puede borrar."""

    message = "Su perfil no tiene permiso para realizar esta operación."

    def _groups(self, user):
        return set(user.groups.values_list("name", flat=True))

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        groups = self._groups(user)
        if request.method in SAFE_METHODS:
            return bool(groups.intersection({"Administrador", "Operador", "Consulta"}))
        if request.method == "DELETE":
            return "Administrador" in groups
        return bool(groups.intersection({"Administrador", "Operador"}))

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)
