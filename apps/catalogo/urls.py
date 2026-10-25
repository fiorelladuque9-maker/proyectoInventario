from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, ProductoViewSet

router = DefaultRouter()
router.register("categorias", CategoriaViewSet)
router.register("productos", ProductoViewSet)
urlpatterns = router.urls
