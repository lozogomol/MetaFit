from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .models import Usuario, Perfil, MedicionCorporal
from .serializers import (
    UsuarioSerializer,
    PerfilSerializer,
    RegistroSerializer,
    LoginSerializer,
    MedicionCorporalSerializer,
)


class RegistroView(APIView):
    """
    Endpoint para el Registro de nuevos usuarios con rol y perfil inicial.
    Retorna los datos del usuario creado y su token de autenticación.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()
            token = Token.objects.get(user=usuario)
            usuario_data = UsuarioSerializer(usuario).data

            return Response({
                "mensaje": "Usuario registrado exitosamente en Meta Fit.",
                "token": token.key,
                "usuario": usuario_data,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    Endpoint para el Acceso (Login) de usuarios.
    Valida credenciales y retorna el token de autenticación junto con los datos de rol y perfil.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.validated_data['usuario']
            token_key = serializer.validated_data['token']
            usuario_data = UsuarioSerializer(usuario).data

            return Response({
                "mensaje": f"Bienvenido de nuevo, {usuario.username}.",
                "token": token_key,
                "usuario": usuario_data,
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PerfilView(generics.RetrieveUpdateAPIView):
    """
    Endpoint para consultar y actualizar el perfil del usuario autenticado (edad, estatura, peso, objetivo).
    Requiere Header: Authorization: Token <token_key>
    """
    serializer_class = PerfilSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Garantizar que siempre exista el perfil aunque haya sido creado por superuser directo
        perfil, _ = Perfil.objects.get_or_create(usuario=self.request.user)
        return perfil


class UsuarioActualView(APIView):
    """
    Endpoint para obtener los detalles completos del usuario en sesión.
    Requiere Header: Authorization: Token <token_key>
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MedicionCorporalListCreateView(generics.ListCreateAPIView):
    """
    Endpoint para consultar el historial y registrar nuevas mediciones corporales (% grasa, masa magra, IMC).
    Requiere Header: Authorization: Token <token_key>
    """
    serializer_class = MedicionCorporalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MedicionCorporal.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


import base64
from django.core.files.base import ContentFile
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .ia_service import AnalizadorCorporal

class AnalizarImagenView(APIView):
    """
    Endpoint para subir una imagen y obtener predicción de peso y estatura usando la IA.
    No requiere autenticación ya que se usa en el registro.
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        archivo_imagen = None
        
        if 'imagen_base64' in request.data:
            img_data = request.data['imagen_base64']
            if ';base64,' in img_data:
                img_data = img_data.split(';base64,')[1]
            archivo_imagen = ContentFile(base64.b64decode(img_data), name='upload.jpg')
        elif 'imagen' in request.FILES:
            archivo_imagen = request.FILES['imagen']
        else:
            return Response({'error': 'No se encontró la imagen en la petición.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            peso, estatura = AnalizadorCorporal.predecir(archivo_imagen)
            
            # El modelo puede arrojar la estatura en metros (ej: 1.9).
            # Si es menor a 3, asumimos que son metros y lo convertimos a centímetros.
            if estatura < 3.0:
                estatura = estatura * 100
                
            return Response({
                'peso': round(peso, 1),
                'estatura': round(estatura, 1)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
