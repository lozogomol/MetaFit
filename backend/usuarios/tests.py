from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from .models import Usuario, Perfil


class UsuarioModelTests(TestCase):
    def test_crear_usuario_con_rol_por_defecto(self):
        user = Usuario.objects.create_user(
            username='atleta1',
            password='password123',
            email='atleta1@metafit.app'
        )
        self.assertEqual(user.rol, Usuario.ROL_USUARIO)
        self.assertTrue(user.es_usuario_estandar)
        self.assertFalse(user.es_administrador)

    def test_crear_usuario_con_rol_administrador(self):
        admin_user = Usuario.objects.create_user(
            username='admin1',
            password='password123',
            rol=Usuario.ROL_ADMINISTRADOR
        )
        self.assertEqual(admin_user.rol, Usuario.ROL_ADMINISTRADOR)
        self.assertTrue(admin_user.es_administrador)


class PerfilModelTests(TestCase):
    def test_crear_perfil_enlazado_a_usuario(self):
        user = Usuario.objects.create_user(
            username='juan_perez',
            password='password123'
        )
        perfil = Perfil.objects.create(
            usuario=user,
            edad=28,
            estatura=180.5,
            peso=78.2,
            objetivo_principal='Ganar Masa Muscular'
        )
        self.assertEqual(user.perfil.edad, 28)
        self.assertEqual(user.perfil.estatura, 180.5)
        self.assertEqual(user.perfil.peso, 78.2)
        self.assertEqual(user.perfil.objetivo_principal, 'Ganar Masa Muscular')


class UsuarioAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.registro_url = reverse('usuario-registro')
        self.login_url = reverse('usuario-login')
        self.perfil_url = reverse('usuario-perfil')

    def test_registro_usuario_exitoso_con_token_y_perfil(self):
        payload = {
            'username': 'nuevo_usuario',
            'email': 'nuevo@metafit.app',
            'password': 'SuperPassword123!',
            'first_name': 'Nuevo',
            'last_name': 'Atleta',
            'rol': 'Usuario',
            'edad': 25,
            'estatura': 175.0,
            'peso': 70.0,
            'objetivo_principal': 'Perder Grasa'
        }
        response = self.client.post(self.registro_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('usuario', response.data)

        # Verificar en base de datos
        usuario = Usuario.objects.get(username='nuevo_usuario')
        self.assertEqual(usuario.rol, 'Usuario')
        self.assertEqual(usuario.perfil.edad, 25)
        self.assertEqual(usuario.perfil.estatura, 175.0)
        self.assertEqual(usuario.perfil.peso, 70.0)
        self.assertEqual(usuario.perfil.objetivo_principal, 'Perder Grasa')

        # Verificar que el token coincide
        token = Token.objects.get(user=usuario)
        self.assertEqual(response.data['token'], token.key)

    def test_login_usuario_exitoso_devuelve_token(self):
        # Crear usuario primero
        usuario = Usuario.objects.create_user(
            username='user_login',
            password='Password123!',
            email='login@metafit.app'
        )
        Perfil.objects.create(usuario=usuario, edad=30, estatura=172.0, peso=68.5)

        payload = {
            'username': 'user_login',
            'password': 'Password123!'
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['usuario']['username'], 'user_login')

    def test_login_credenciales_invalidas(self):
        payload = {
            'username': 'no_existe',
            'password': 'wrong_password'
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_consultar_y_actualizar_perfil_autenticado(self):
        usuario = Usuario.objects.create_user(
            username='user_perfil',
            password='Password123!'
        )
        perfil = Perfil.objects.create(
            usuario=usuario,
            edad=24,
            estatura=170.0,
            peso=65.0,
            objetivo_principal='Resistencia'
        )
        token, _ = Token.objects.get_or_create(user=usuario)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

        # GET perfil
        get_response = self.client.get(self.perfil_url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data['edad'], 24)

        # PATCH / PUT perfil
        update_payload = {
            'edad': 25,
            'peso': 67.5,
            'objetivo_principal': 'Hipertrofia'
        }
        patch_response = self.client.patch(self.perfil_url, update_payload, format='json')
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        perfil.refresh_from_db()
        self.assertEqual(perfil.edad, 25)
        self.assertEqual(perfil.peso, 67.5)
        self.assertEqual(perfil.objetivo_principal, 'Hipertrofia')
        # Verificar campos calculados en la respuesta
        self.assertIn('porcentaje_grasa', patch_response.data)
        self.assertIn('imc', patch_response.data)
        self.assertIn('masa_magra_kg', patch_response.data)
        self.assertIn('tasa_metabolica_basal', patch_response.data)
        self.assertIn('categoria_grasa', patch_response.data)

    def test_medicion_corporal_historial_y_registro(self):
        usuario = Usuario.objects.create_user(
            username='user_mediciones',
            password='Password123!'
        )
        token, _ = Token.objects.get_or_create(user=usuario)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        mediciones_url = reverse('usuario-mediciones')

        # Registrar nueva medición corporal
        payload = {
            'estatura': 178.0,
            'peso': 75.0,
            'edad': 26,
            'genero': 'M',
            'porcentaje_grasa': 15.2,
            'masa_grasa_kg': 11.4,
            'masa_magra_kg': 63.6,
            'masa_muscular_kg': 34.3,
            'imc': 23.7,
            'categoria_imc': 'Peso Normal / Saludable',
            'categoria_grasa': 'Fitness',
            'agua_corporal_porcentaje': 61.9,
            'agua_corporal_litros': 46.4,
            'tasa_metabolica_basal': 1743.0,
            'nivel_grasa_visceral': 4
        }
        post_response = self.client.post(mediciones_url, payload, format='json')
        self.assertEqual(post_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(post_response.data['porcentaje_grasa'], 15.2)
        self.assertEqual(post_response.data['categoria_grasa'], 'Fitness')

        # Listar mediciones
        get_response = self.client.get(mediciones_url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        # La paginación por defecto de DRF entrega {'count': 1, 'results': [...]}
        resultados = get_response.data.get('results', get_response.data)
        self.assertEqual(len(resultados), 1)
        self.assertEqual(resultados[0]['porcentaje_grasa'], 15.2)


