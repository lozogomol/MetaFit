from django.urls import path
from .views import (
    RegistroView,
    LoginView,
    PerfilView,
    UsuarioActualView,
    MedicionCorporalListCreateView,
    AnalizarImagenView,
)

urlpatterns = [
    path('registro/', RegistroView.as_view(), name='usuario-registro'),
    path('login/', LoginView.as_view(), name='usuario-login'),
    path('perfil/', PerfilView.as_view(), name='usuario-perfil'),
    path('me/', UsuarioActualView.as_view(), name='usuario-me'),
    path('mediciones/', MedicionCorporalListCreateView.as_view(), name='usuario-mediciones'),
    path('analizar-imagen/', AnalizarImagenView.as_view(), name='usuario-analizar-imagen'),
]
