from django.contrib import admin
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


# Esta ruta pública permite comprobar rápidamente si la API está disponible.
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"estado": "ok", "servicio": "API de Inventario"})


# Cada aplicación conserva sus endpoints y recibe un nombre descriptivo para
# poder referenciarla fácilmente desde Django.
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="health-check"),
    path("api/v1/auth/token/", obtain_auth_token, name="api-token-auth"),
    path("api/v1/", include("apps.catalogo.urls")),
    path("api/v1/", include("apps.proveedores.urls")),
    path("api/v1/", include("apps.compras.urls")),
    path("api/v1/", include("apps.inventario.urls")),
    path("api/v1/", include("apps.conteos.urls")),
]
