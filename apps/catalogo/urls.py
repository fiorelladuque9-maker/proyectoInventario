from django.urls import path
from . import views

urlpatterns =[
    path("categorias/",views.categoria_api,name="categorias_api"),
    path("categorias/<int:id>/",views.categoria_detalle_api,name="categorias_detalle_api"),
    path("productos/",views.productos_api,name="productos_api"),
    path("productos/<int:id>/",views.producto_detalle_api,name="producto_detalle_api"),
]
