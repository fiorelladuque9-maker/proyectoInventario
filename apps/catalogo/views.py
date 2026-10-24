from rest_framework.viewsets import ModelViewSet
from config.permissions import InventarioRolePermission
from .models import Categoria, Producto
from .serializers import CategoriaSerializer, ProductoSerializer

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Categoria,Producto
from .serializers import CategoriaSerializer,ProductoSerializer



class CategoriaViewSet(ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["activa"]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]



@api_view(["GET", "POST"])
def categoria_api(request):
    if request.method == "GET":
        categorias = Categoria.objects.all().order_by("nombre")

        activa = request.query_params.get("activa")
        if activa is not None:
            if activa.lower() not in ["true", "false"]:
                return Response(
                    {"activa": "Utilice true o false."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            categorias = categorias.filter(activa=activa.lower() == "true")

        serializer = CategoriaSerializer(categorias, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == "POST":
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response(
                {"detail": "Se requiere un usuario administrador."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CategoriaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET","PUT","PATCH","DELETE"])
def categoria_detalle_api(request,id):
    try:
        categoria = Categoria.objects.get(id=id)
    except Categoria.DoesNotExist:
        return Response({"error":"Categoria no encontrada."},status=status.HTTP_404_NOT_FOUND)

    if request.method =="GET":
        return Response(CategoriaSerializer(categoria).data)

    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({"detail":"Se requiere un usuario adminitrador."},status=status.HTTP_403_FORBIDDEN)

    if request.method in ["PUT","PATCH"]:
        serializer = CategoriaSerializer(categoria,data=request.data,partial=request.method =="PATCH")

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

    if request.method=="DELETE":
        categoria.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class ProductoViewSet(ModelViewSet):
    queryset = Producto.objects.select_related("categoria").all()
    serializer_class = ProductoSerializer
    permission_classes = [InventarioRolePermission]
    filterset_fields = ["categoria", "unidad", "activo"]
    search_fields = ["sku", "nombre", "descripcion"]
    ordering_fields = ["nombre", "sku", "stock_minimo", "creado_en"]


@api_view(["GET","POST"])
def productos_api(request):
    if request.method =="GET":
        productos=Producto.objects.select_related("categoria").all().order_by("nombre")
        categoria=request.query_params.get("categoria")
        buscar = request.query_params.get("buscar")

        if categoria:
            productos=productos.filter(categoria_id=categoria)

        if buscar:
            productos=productos.filter(nombre__icontains=buscar)

        serializer=ProductoSerializer(productos,many=True)
        return Response(serializer.data,status=status.HTTP_201_CREATED)


@api_view(["GET","POST"])
def productos_api(request):
    if request.method =="GET":
        productos = Producto.objects.select_related("categoria").all().order_by("nombre")

        categoria=request.query_params.get("categoria")
        buscar = request.query_params.get("buscar")

        if categoria:
            productos=productos.filter(categoria_id=categoria)

        if buscar:
            productos = productos.filter(nombre__icontains=buscar)


        serializer=ProductoSerializer(productos,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)

    if request.method =="POST":
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({"detail":"Se requiere un usurio administrador"},status=status.HTTP_403_FORBIDDEN)

        serializer=ProductoSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.data,status=status.HTTP_201_CREATED)

        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET","PUT","PATCH","DELETE"])
def producto_detalle_api(request,id):
    try:
        producto=Producto.objects.get(id=id)
    except Producto.DoesNotExist:
        return Response({"error":"Producto no encontrado"},status=status.HTTP_404_NOT_FOUND)

    if request.method=="GET":
        return Response(ProductoSerializer(producto).data)

    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({"detail":"Se requiere un usuario administrador"},status=status.HTTP_403_FORBIDDEN)

    if request.method in ["PUT","PATCH"]:
        serializer=ProductoSerializer(producto,data=request.data,partial=request.method =="PATCH")

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_200_OK)

        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    
    if request.method=="DELETE":
        producto.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
        


