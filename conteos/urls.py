from rest_framework.routers import DefaultRouter
from .views import ConteoInventarioViewSet, LineaConteoViewSet

router = DefaultRouter()
router.register("conteos", ConteoInventarioViewSet)
router.register("lineas-conteo", LineaConteoViewSet)
urlpatterns = router.urls
