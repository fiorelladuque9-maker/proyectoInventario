from rest_framework.routers import DefaultRouter
from .views import LineaCompraViewSet, OrdenCompraViewSet

router = DefaultRouter()
router.register("ordenes-compra", OrdenCompraViewSet)
router.register("lineas-compra", LineaCompraViewSet)
urlpatterns = router.urls
