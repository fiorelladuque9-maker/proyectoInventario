from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


class RolesTestCase(APITestCase):
    """Base para pruebas: crea un usuario por perfil y facilita autenticarse con token."""

    PASSWORD = "clave-prueba-123"

    def crear_usuario(self, username, grupo=None):
        user = get_user_model().objects.create_user(username=username, password=self.PASSWORD)
        if grupo:
            user.groups.add(Group.objects.get_or_create(name=grupo)[0])
        Token.objects.get_or_create(user=user)
        return user

    def crear_usuarios_por_rol(self):
        self.administrador = self.crear_usuario("admin_prueba", "Administrador")
        self.operador = self.crear_usuario("operador_prueba", "Operador")
        self.consulta = self.crear_usuario("consulta_prueba", "Consulta")
        self.sin_grupo = self.crear_usuario("sin_grupo_prueba")

    def autenticar(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {user.auth_token.key}")

    def cerrar_sesion(self):
        self.client.credentials()
