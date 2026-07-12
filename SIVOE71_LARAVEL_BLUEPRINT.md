# SIVOE-71 Laravel Blueprint

## Objetivo

SIVOE-71 es el Sistema Integral de Vuelo y Operaciones del Escuadron 71. La plataforma centraliza gestion de pilotos, escuela, planes de vuelo, misiones, flota, mantenimiento y bitacoras operacionales.

## Stack

- Frontend: Blade, HTML5, CSS3, Bootstrap 5, JavaScript.
- Backend: PHP 8, Laravel 10/11.
- Base de datos: MySQL 8.
- Autenticacion recomendada: Laravel Breeze o Laravel Fortify.
- Roles y permisos: `spatie/laravel-permission`.

## Modulos

- Dashboard operacional: metricas, estado del sistema, misiones activas.
- Operaciones: misiones, briefings, paquetes aereos, ROE y horarios.
- Plan de vuelo: rutas, waypoints, frecuencias, combustible y alternos.
- Flota: inventario, modelos, disponibilidad y horas.
- Escuela: FR1, CR1, cursos, instructores, evaluaciones y progreso.
- Academia de vuelo: fases I-VI, creacion de cursos, instructores y evaluaciones.
- Personal: pilotos, callsigns, rangos, roles, horas y certificaciones.
- Mantenimiento: reportes, severidad, estado tecnico y bitacora.
- Bitacora de vuelo: registro, edicion, eliminacion, historial, filtros y acumulados de horas.
- Inteligencia: teatro, amenazas, objetivos, mapas y documentos.
- Comunicaciones: frecuencias, canales y procedimientos radio.
- Area privada de pilotos: registro, login, recuperacion de contrasena, roles y dashboard personalizado.

## Modulo 2: Area privada de pilotos

### Autenticacion

- Registro de aspirantes y personal interno.
- Login por email/callsign y contrasena.
- Recuperacion de contrasena por email.
- Verificacion de email recomendada para altas nuevas.

### Roles

- Administrador: gestion completa del sistema, usuarios, roles, permisos, configuracion y auditoria.
- Comandante: operaciones, aprobacion de misiones, asignaciones y supervision operacional.
- Instructor: escuela, evaluaciones, progreso academico y certificaciones.
- Piloto: misiones asignadas, bitacora, briefings y certificaciones propias.
- Aspirante: solicitud de ingreso, ruta de formacion inicial y requisitos pendientes.

### Dashboard personalizado

Cada rol debe ver metricas, accesos rapidos y permisos ajustados a su responsabilidad operacional. El prototipo `sivoe71.html` incluye un selector de rol para demostrar estas vistas antes de conectarlas a Laravel.

## Modulo 3: Bitacora de vuelo

### Registro de vuelo

- Fecha.
- Piloto.
- Callsign.
- Aeronave.
- Mapa.
- Mision.
- Hora inicio.
- Hora fin.
- Horas voladas calculadas automaticamente.
- Instructor.
- Observaciones.
- Escuadrilla para clasificacion y filtrado operacional.

### Funciones

- Crear registro.
- Editar registro.
- Eliminar registro.
- Consultar historial.
- Filtrar por fecha, aeronave, piloto y escuadrilla.
- Generar horas acumuladas, horas por aeronave y horas por mes.

### Persistencia MySQL

Usar la tabla `flight_logs` incluida en `sivoe71_schema.sql`. El controlador debe validar con Form Request, calcular `flown_hours` en el backend a partir de `start_time` y `end_time`, y exponer consultas agregadas con `SUM(flown_hours)` agrupadas por aeronave y por mes.

## Modulo 4: Academia de vuelo

### Cursos base

- Fase I Familiarizacion.
- Fase II Navegacion.
- Fase III Formacion.
- Fase IV Combate BVR.
- Fase V Combate WVR.
- Fase VI Operaciones Nocturnas.

### Funciones

- Crear cursos.
- Asignar instructor.
- Registrar evaluaciones.
- Consultar cursos activos y evaluaciones recientes.

### Resultados de evaluacion

- Aprobado.
- Requiere Refuerzo.
- No Aprobado.

### Persistencia MySQL

Usar `academy_courses` para la definicion del curso/fase/instructor y `academy_evaluations` para cada evaluacion de alumno. El resultado debe validarse con el enum `Aprobado`, `Requiere Refuerzo` o `No Aprobado`.

## Modelos Laravel

- `User`
- `Aircraft`
- `Mission`
- `FlightPlan`
- `MissionAssignment`
- `FlightLog`
- `AcademyCourse`
- `AcademyEvaluation`
- `TrainingRecord`
- `MaintenanceLog`

## Rutas sugeridas

```php
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::resource('missions', MissionController::class);
    Route::resource('flight-plans', FlightPlanController::class);
    Route::resource('aircraft', AircraftController::class);
    Route::resource('flight-logs', FlightLogController::class);
    Route::resource('academy-courses', AcademyCourseController::class);
    Route::post('academy-courses/{academyCourse}/evaluations', [AcademyEvaluationController::class, 'store'])->name('academy-evaluations.store');
    Route::resource('training-records', TrainingRecordController::class);
    Route::resource('maintenance-logs', MaintenanceLogController::class);
    Route::resource('personnel', PersonnelController::class);
    Route::get('/private-area', PrivateAreaController::class)->name('private-area');
});
```

## Estructura Blade recomendada

```text
resources/views/
  layouts/
    app.blade.php
    sidebar.blade.php
    topbar.blade.php
  dashboard.blade.php
  missions/
    index.blade.php
    create.blade.php
    show.blade.php
    edit.blade.php
  aircraft/
  flight-logs/
    index.blade.php
    create.blade.php
    edit.blade.php
    show.blade.php
  academy/
    index.blade.php
    create-course.blade.php
    edit-course.blade.php
    evaluations.blade.php
  training/
  maintenance/
  personnel/
```

## Migracion del prototipo

El archivo `sivoe71.html` puede dividirse asi:

- CSS global a `resources/css/app.css`.
- Sidebar y topbar a parciales Blade.
- Tablas del dashboard a componentes Blade.
- Datos estaticos a consultas Eloquent.
- Formulario de acceso a Laravel Breeze/Fortify.
- Area privada del Modulo 2 a vistas Blade conectadas con `spatie/laravel-permission`.
- Modulo 4 a `academy/index.blade.php`, con formularios separados para cursos y evaluaciones.

## Semillas iniciales

Crear seeders para:

- Roles: administrador, comandante, instructor, piloto, aspirante.
- Aeronaves: F/A-18C, F-16C, F-14, A-10C, AH-64D, UH-60, UH-1H, T-45.
- Cursos: Fase I Familiarizacion, Fase II Navegacion, Fase III Formacion, Fase IV Combate BVR, Fase V Combate WVR, Fase VI Operaciones Nocturnas.
- Misiones demo: entrenamiento FR1, CAP naval, strike coordinado.

## Seguridad

- Autenticacion obligatoria para modulos internos.
- Politicas Laravel por modulo.
- Auditoria de creacion, modificacion y cierre de misiones.
- Validacion estricta de formularios con Form Requests.
- Backups programados de MySQL.
