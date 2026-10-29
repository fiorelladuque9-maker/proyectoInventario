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
    path('admin/', admin.site.urls),
    path('api/token/', obtain_auth_token, name='api_token'),
    path('api/health/', health_check, name='api_health'),
    path('api/catalogo/', include('apps.catalogo.urls'), name='api_catalogo'),
    path('api/proveedores/', include('apps.proveedores.urls'), name='api_proveedores'),
    path('api/compras/', include('apps.compras.urls'), name='api_compras'),
    path('api/inventario/', include('apps.inventario.urls'), name='api_inventario'),
    path('api/conteos/', include('apps.conteos.urls'), name='api_conteos'),
]
