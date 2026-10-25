from rest_framework.routers import DefaultRouter
from .views import AlmacenViewSet, ExistenciaViewSet, MovimientoViewSet

router = DefaultRouter()
router.register("almacenes", AlmacenViewSet)
router.register("existencias", ExistenciaViewSet)
router.register("movimientos", MovimientoViewSet)
urlpatterns = router.urls
