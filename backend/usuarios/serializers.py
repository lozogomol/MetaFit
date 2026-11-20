from rest_framework import serializers
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .models import Usuario, Perfil, MedicionCorporal


class MedicionCorporalSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicionCorporal
        fields = [
            'id', 'fecha', 'peso', 'estatura', 'edad', 'genero',
            'porcentaje_grasa', 'masa_grasa_kg', 'masa_magra_kg',
            'masa_muscular_kg', 'imc', 'categoria_imc', 'categoria_grasa',
            'agua_corporal_porcentaje', 'agua_corporal_litros',
            'tasa_metabolica_basal', 'nivel_grasa_visceral'
        ]
        read_only_fields = ['id', 'fecha']


class PerfilSerializer(serializers.ModelSerializer):
    imc = serializers.FloatField(read_only=True)
    porcentaje_grasa = serializers.FloatField(read_only=True)
    masa_grasa_kg = serializers.FloatField(read_only=True)
    masa_magra_kg = serializers.FloatField(read_only=True)
    masa_muscular_kg = serializers.FloatField(read_only=True)
    agua_corporal_porcentaje = serializers.FloatField(read_only=True)
    agua_corporal_litros = serializers.FloatField(read_only=True)
    tasa_metabolica_basal = serializers.FloatField(read_only=True)
    nivel_grasa_visceral = serializers.IntegerField(read_only=True)
    categoria_grasa = serializers.CharField(read_only=True)

    class Meta:
        model = Perfil
        fields = [
            'id', 'edad', 'estatura', 'peso', 'genero', 'objetivo_principal',
            'imc', 'porcentaje_grasa', 'masa_grasa_kg', 'masa_magra_kg',
            'masa_muscular_kg', 'agua_corporal_porcentaje', 'agua_corporal_litros',
            'tasa_metabolica_basal', 'nivel_grasa_visceral', 'categoria_grasa',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UsuarioSerializer(serializers.ModelSerializer):
    perfil = PerfilSerializer(read_only=True)

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol', 'perfil']
        read_only_fields = ['id', 'rol']


class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=6,
        help_text="Contraseña de al menos 6 caracteres"
    )
    # Campos opcionales iniciales para el Perfil
    edad = serializers.IntegerField(required=False, allow_null=True, min_value=10, max_value=120)
    estatura = serializers.FloatField(required=False, allow_null=True, min_value=50.0, max_value=260.0)
    peso = serializers.FloatField(required=False, allow_null=True, min_value=20.0, max_value=350.0)
    genero = serializers.CharField(required=False, allow_blank=True, max_length=1)
    objetivo_principal = serializers.CharField(required=False, allow_blank=True, max_length=120)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'rol', 'edad', 'estatura', 'peso', 'genero', 'objetivo_principal'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        # Extraer campos pertenecientes al Perfil
        edad = validated_data.pop('edad', None)
        estatura = validated_data.pop('estatura', None)
        peso = validated_data.pop('peso', None)
        genero = validated_data.pop('genero', '')
        objetivo_principal = validated_data.pop('objetivo_principal', '')
        password = validated_data.pop('password')
        rol = validated_data.get('rol', Usuario.ROL_USUARIO)

        # Crear el usuario usando create_user para hashear la contraseña correctamente
        usuario = Usuario.objects.create_user(
            password=password,
            **validated_data
        )

        # Si se registra con rol Administrador, otorgar flags de staff en Django
        if rol == Usuario.ROL_ADMINISTRADOR:
            usuario.is_staff = True
            usuario.save(update_fields=['is_staff'])

        # Crear el perfil vinculado uno a uno
        Perfil.objects.create(
            usuario=usuario,
            edad=edad,
            estatura=estatura,
            peso=peso,
            genero=genero,
            objetivo_principal=objetivo_principal
        )

        # Crear el token de autenticación para el nuevo usuario
        Token.objects.create(user=usuario)

        return usuario


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if not username or not password:
            raise serializers.ValidationError('Debe ingresar tanto el nombre de usuario como la contraseña.')

        usuario = authenticate(username=username, password=password)

        if not usuario:
            raise serializers.ValidationError('Credenciales inválidas. Verifica tu usuario y contraseña.')

        if not usuario.is_active:
            raise serializers.ValidationError('La cuenta de este usuario está desactivada.')

        token, _ = Token.objects.get_or_create(user=usuario)
        attrs['usuario'] = usuario
        attrs['token'] = token.key
        return attrs
