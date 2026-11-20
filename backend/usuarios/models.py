from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class Usuario(AbstractUser):
    """
    Custom User Model que extiende AbstractUser para añadir soporte de roles en Meta Fit.
    """
    ROL_ADMINISTRADOR = 'Administrador'
    ROL_USUARIO = 'Usuario'

    ROL_CHOICES = [
        (ROL_ADMINISTRADOR, 'Administrador'),
        (ROL_USUARIO, 'Usuario'),
    ]

    rol = models.CharField(
        max_length=20,
        choices=ROL_CHOICES,
        default=ROL_USUARIO,
        help_text="Rol del usuario en la plataforma (Administrador o Usuario)"
    )

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.username} ({self.rol})"

    @property
    def es_administrador(self):
        return self.rol == self.ROL_ADMINISTRADOR

    @property
    def es_usuario_estandar(self):
        return self.rol == self.ROL_USUARIO


class Perfil(models.Model):
    """
    Modelo Perfil vinculado uno a uno con el Usuario para almacenar métricas antropométricas y objetivos fitness.
    """
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil'
    )
    edad = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Edad del usuario en años"
    )
    estatura = models.FloatField(
        null=True,
        blank=True,
        help_text="Estatura en centímetros (ej: 175.5)"
    )
    peso = models.FloatField(
        null=True,
        blank=True,
        help_text="Peso corporal en kilogramos (ej: 72.0)"
    )
    GENERO_MASCULINO = 'M'
    GENERO_FEMENINO = 'F'
    GENERO_CHOICES = [
        (GENERO_MASCULINO, 'Masculino'),
        (GENERO_FEMENINO, 'Femenino'),
    ]
    genero = models.CharField(
        max_length=1,
        choices=GENERO_CHOICES,
        blank=True,
        default='',
        help_text="Género biológico (M o F)"
    )
    objetivo_principal = models.CharField(
        max_length=120,
        blank=True,
        default='',
        help_text="Objetivo principal (ej: Ganar masa muscular, Perder grasa, Salud cardiovascular)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Perfil'
        verbose_name_plural = 'Perfiles'

    def __str__(self):
        return f"Perfil de {self.usuario.username}"

    @property
    def imc(self):
        if not self.estatura or self.estatura <= 0 or not self.peso:
            return 0.0
        altura_m = self.estatura / 100.0
        return round(self.peso / (altura_m * altura_m), 2)

    @property
    def porcentaje_grasa(self):
        # Fórmula de Deurenberg para adultos
        if self.imc <= 0 or not self.edad:
            return 0.0
        sexo_factor = 1.0 if self.genero == self.GENERO_MASCULINO else 0.0
        grasa = (1.20 * self.imc) + (0.23 * self.edad) - (10.8 * sexo_factor) - 5.4
        return max(round(grasa, 1), 0.0)

    @property
    def masa_grasa_kg(self):
        if not self.peso:
            return 0.0
        return round((self.peso * self.porcentaje_grasa) / 100.0, 2)

    @property
    def masa_magra_kg(self):
        if not self.peso:
            return 0.0
        return round(max(self.peso - self.masa_grasa_kg, 0.0), 2)

    @property
    def masa_muscular_kg(self):
        factor = 0.54 if self.genero == self.GENERO_MASCULINO else 0.50
        return round(self.masa_magra_kg * factor, 2)

    @property
    def agua_corporal_litros(self):
        return round(self.masa_magra_kg * 0.73, 2)

    @property
    def agua_corporal_porcentaje(self):
        if not self.peso or self.peso <= 0:
            return 0.0
        return round((self.agua_corporal_litros / self.peso) * 100.0, 1)

    @property
    def tasa_metabolica_basal(self):
        # Fórmula de Katch-McArdle basada en masa magra (LBM)
        if self.masa_magra_kg <= 0:
            return 0.0
        return round(370 + (21.6 * self.masa_magra_kg), 0)

    @property
    def nivel_grasa_visceral(self):
        if self.imc <= 0:
            return 1
        if self.imc < 25:
            return 4
        elif self.imc < 30:
            return 8
        elif self.imc < 35:
            return 11
        else:
            return 14

    @property
    def categoria_grasa(self):
        # Tabla ACE (American Council on Exercise)
        grasa = self.porcentaje_grasa
        if self.genero == self.GENERO_MASCULINO:
            if grasa < 2.0:
                return 'Muy Bajo'
            elif grasa <= 5.0:
                return 'Grasa Esencial'
            elif grasa <= 13.9:
                return 'Atleta'
            elif grasa <= 17.9:
                return 'Fitness'
            elif grasa <= 24.9:
                return 'Aceptable'
            elif grasa <= 29.9:
                return 'Elevado'
            else:
                return 'Crítico / Obesidad'
        else:
            if grasa < 10.0:
                return 'Muy Bajo'
            elif grasa <= 13.9:
                return 'Grasa Esencial'
            elif grasa <= 20.9:
                return 'Atleta'
            elif grasa <= 24.9:
                return 'Fitness'
            elif grasa <= 31.9:
                return 'Aceptable'
            elif grasa <= 37.9:
                return 'Elevado'
            else:
                return 'Crítico / Obesidad'


class MedicionCorporal(models.Model):
    """
    Tabla de registro y seguimiento histórico de mediciones y composición corporal.
    Almacena porcentajes de grasa, masa magra, muscular, agua, TMB e IMC a lo largo del tiempo.
    """
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mediciones'
    )
    fecha = models.DateTimeField(auto_now_add=True)
    peso = models.FloatField(help_text="Peso en kilogramos")
    estatura = models.FloatField(help_text="Estatura en centímetros")
    edad = models.PositiveIntegerField(help_text="Edad en años")
    genero = models.CharField(
        max_length=1,
        choices=Perfil.GENERO_CHOICES,
        default=Perfil.GENERO_MASCULINO
    )
    porcentaje_grasa = models.FloatField(
        help_text="Porcentaje de grasa corporal (%)"
    )
    masa_grasa_kg = models.FloatField(
        help_text="Masa grasa calculada en kg"
    )
    masa_magra_kg = models.FloatField(
        help_text="Masa libre de grasa / magra en kg"
    )
    masa_muscular_kg = models.FloatField(
        help_text="Masa muscular esquelética estimada en kg"
    )
    imc = models.FloatField(
        help_text="Índice de Masa Corporal (IMC)"
    )
    categoria_imc = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text="Clasificación OMS del IMC"
    )
    categoria_grasa = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text="Categoría ACE de grasa corporal"
    )
    agua_corporal_porcentaje = models.FloatField(
        null=True,
        blank=True,
        help_text="Porcentaje de agua corporal total (%)"
    )
    agua_corporal_litros = models.FloatField(
        null=True,
        blank=True,
        help_text="Litros de agua corporal total"
    )
    tasa_metabolica_basal = models.FloatField(
        null=True,
        blank=True,
        help_text="Tasa metabólica basal (TMB) en kcal/día"
    )
    nivel_grasa_visceral = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Nivel estimado de grasa visceral (1-12)"
    )

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Medición Corporal'
        verbose_name_plural = 'Mediciones Corporales'

    def __str__(self):
        return f"{self.usuario.username} - {self.porcentaje_grasa}% Grasa ({self.fecha.strftime('%Y-%m-%d')})"
