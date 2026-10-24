from rest_framework.routers import DefaultRouter
from .views import ProductoProveedorViewSet, ProveedorViewSet

router = DefaultRouter()
router.register("proveedores", ProveedorViewSet)
router.register("productos-proveedor", ProductoProveedorViewSet)
urlpatterns = router.urls
