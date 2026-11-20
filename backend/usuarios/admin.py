from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Perfil, MedicionCorporal


class PerfilInline(admin.StackedInline):
    model = Perfil
    can_delete = False
    verbose_name = 'Perfil Fitness'
    verbose_name_plural = 'Perfil Fitness'


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    """
    Configuración personalizada del modelo Usuario en Django Admin con campo 'rol'.
    """
    fieldsets = UserAdmin.fieldsets + (
        ('Rol en Meta Fit', {'fields': ('rol',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Rol en Meta Fit', {'fields': ('rol',)}),
    )
    list_display = ('username', 'email', 'rol', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('rol', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    inlines = [PerfilInline]


@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'edad', 'estatura', 'peso', 'objetivo_principal', 'updated_at')
    search_fields = ('usuario__username', 'usuario__email', 'objetivo_principal')
    list_filter = ('objetivo_principal',)


@admin.register(MedicionCorporal)
class MedicionCorporalAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'fecha', 'peso', 'porcentaje_grasa', 'categoria_grasa', 'imc')
    search_fields = ('usuario__username', 'categoria_grasa')
    list_filter = ('genero', 'categoria_grasa', 'fecha')
