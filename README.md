# Meta Fit 🏋️‍♂️

> Plataforma integral de entrenamiento, rutinas y seguimiento de condición física con arquitectura modular desacoplada: **Backend en Django REST Framework** y **Frontend móvil/multiplataforma en Flutter** con diseño de alta gama estilo iOS.

---

## 📐 Arquitectura General del Proyecto

```
Meta Fit/
├── backend/                  # Proyecto Base Django 6 + Django REST Framework
│   ├── config/               # Configuración principal (settings, urls, wsgi, asgi)
│   ├── manage.py             # Script de administración de Django
│   ├── db.sqlite3            # Base de datos SQLite inicial
│   ├── requirements.txt      # Dependencias (Django, DRF, Cors-headers)
│   └── venv/                 # Entorno virtual aislado
│
├── frontend/                 # Aplicación Flutter (iOS, Android, Web, Desktop)
│   ├── lib/
│   │   ├── acceso/           # Inicio de Sesión (pantalla_acceso.dart)
│   │   ├── registro/         # Creación de Cuentas y Datos Físicos (pantalla_registro.dart)
│   │   ├── carga/            # Splash Screen Inicial (pantalla_carga.dart)
│   │   ├── dashboard/        # Dashboard Principal y Navbar (pantalla_dashboard.dart)
│   │   ├── estado/           # Diagnóstico y Silueta Humana de Grasa (figura_humana.dart, pantalla_estado.dart)
│   │   ├── evaluacion/       # Evaluación Inicial y Cálculo de Grasa (pantalla_evaluacion.dart)
│   │   ├── rutinas/          # Catálogo de Rutinas de Entrenamiento (pantalla_rutinas.dart)
│   │   ├── ejercicios/       # Directorio de Ejercicios por Grupo Muscular (pantalla_ejercicios.dart)
│   │   ├── perfil/           # Perfil de Usuario y Ajustes (pantalla_perfil.dart)
│   │   ├── modelos/          # Modelos de Datos (usuario.dart, rutina.dart, ejercicio.dart)
│   │   ├── servicios/        # Lógica de Sesión y Estado (sesion_servicio.dart)
│   │   ├── componentes/      # UI Reutilizable (boton.dart, campo_texto.dart, colores.dart)
│   │   └── main.dart         # Punto de entrada de la aplicación
│   ├── test/                 # Pruebas automatizadas completas
│   └── pubspec.yaml          # Dependencias y configuración de Flutter
│
└── README.md                 # Documentación y guía de arranque
```

---

## 🚀 Guía de Arranque Paso a Paso

### 1. Requisitos Previos

- **Python**: 3.10 o superior (instalado y en el PATH)
- **Flutter SDK**: 3.24 o superior (con soporte para Dart 3.5+)
- **Navegador web / Emulador**: Chrome, Edge o emulador de Android/iOS

---

### 2. Puesta en Marcha del Backend (Django)

El backend ya cuenta con su entorno virtual (`venv`), modelos de base de datos migrados y un comando para cargar datos de prueba.

#### Paso 2.1: Abrir terminal en la carpeta backend
```bash
cd backend
```

#### Paso 2.2: Activar el entorno virtual
- En **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- En **Windows (CMD)**:
  ```cmd
  .\venv\Scripts\activate.bat
  ```
- En **macOS / Linux**:
  ```bash
  source venv/bin/activate
  ```

#### Paso 2.3: Instalar dependencias (si es necesario)
```bash
pip install -r requirements.txt
```

#### Paso 2.4: Ejecutar migraciones iniciales de base de datos
```bash
python manage.py migrate
```

#### Paso 2.5: Crear un superusuario para el panel de administración
```bash
python manage.py createsuperuser
```

#### Paso 2.6: Iniciar el servidor local
```bash
python manage.py runserver
```

✅ El servidor estará escuchando en `http://127.0.0.1:8000/`.

#### Acceso al Panel Administrativo:
- **URL**: `http://127.0.0.1:8000/admin/`


---

### 3. Puesta en Marcha del Frontend (Flutter)

El frontend incluye un sistema de diseño con estilo iOS (Apple Fitness / Human Interface Guidelines), soporte para modo oscuro/claro automático y sincronización inteligente con la API de Django (con modo offline de respaldo).

#### Paso 3.1: Abrir terminal en la carpeta frontend
```bash
cd frontend
```

#### Paso 3.2: Descargar dependencias
```bash
flutter pub get
```

#### Paso 3.3: Verificar dispositivos disponibles
```bash
flutter devices
```

#### Paso 3.4: Ejecutar la aplicación

- **En Navegador Web (Chrome o Edge)**:
  ```bash
  flutter run -d chrome
  ```
  o
  ```bash
  flutter run -d edge
  ```

- **En Emulador Android o Dispositivo Físico**:
  ```bash
  flutter run
  ```

> 💡 **Nota de Conectividad con Emulador Android**:
> Si pruebas en un emulador de Android oficial, la dirección del localhost es `10.0.2.2:8000` en lugar de `127.0.0.1:8000`. Puedes ajustar `baseUrl` en `frontend/lib/services/api_service.dart`.

#### Paso 3.5: Ejecutar pruebas y análisis de código
```bash
flutter analyze
flutter test
```

---

## 🎨 Características de Diseño (Frontend iOS Style)

- **Tarjetas Modulares y Minimalismo**: Bordes suaves redondeados (14px) inspirados en la estética limpia de iOS.
- **Jerarquía Tipográfica San Francisco**: Textos oscuros de alta legibilidad sobre fondos blanco puro.
- **Paleta Oficial Rojo Carmesí / Salmón**: Color primario `#dc143c` (Shade 600) con escala armónica desde el 50 (`#fff0f1`) hasta el 950 (`#4f0216`).
- **Navegación Fluida**: Transiciones sutiles tipo Fade y Cupertino entre pantallas de carga, acceso y registro.
- **Arquitectura Modular**: Carpetas independientes por vista (`acceso`, `registro`, `carga`) y componentes UI desacoplados (`componentes`).


