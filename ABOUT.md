# Sobre el Proyecto EV71

## Que es

EV71 es la pagina web oficial del **Escuadron 71**, una comunidad virtual de simulacion aerea militar dedicada a **DCS World**. El escuadron esta compuesto por pilotos virtuales de Latinoamerica que participan en entrenamiento tactico, operaciones coordinadas y misiones conjuntas dentro del simulador DCS World.

El sitio web sirve como la presencia publica del escuadron, mostrando la flota de aeronaves, operaciones, galeria de vuelos, y proporcionando un formulario de postulacion para nuevos aspirantes. A futuro, el sitio integrara un sistema de gestion interna (SIVOE-71) con autenticacion, bitacora de vuelos, academia y dashboards operacionales.

## Equipo

El proyecto es desarrollado por el equipo del Escuadron 71, con contribuciones de miembros que participan en el desarrollo web, diseno y operaciones del escuadron.

## Arquitectura

### Frontend: Astro + TailwindCSS + SCSS

El sitio esta construido con **Astro v7** como framework principal. Astro genera HTML estatico de alto rendimiento sin JavaScript innecesario. Los estilos se manejan con **TailwindCSS** para clases utility y **SCSS** para estilos complejos, variables de marca y mixins.

**Tipografia:**
- Titulos: **Oswald** (sans-serif, bold, uppercase)
- Cuerpo: **Rajdhani** (sans-serif, regular)

**Colores de marca:**
- Naranja EV71: `#ff7a00`
- Verde militar: `#7f8d58`
- Dorado: `#c8a44d`
- Fondo oscuro: `#0c1117`
- Panel: `#111821`

### Islands: React para interactividad

Para componentes que requieren interaccion del usuario (formularios, dashboards, filtros, modales), se utilizan **React Islands** con las directivas `client:*` de Astro. Esto permite mantener el rendimiento de Astro para contenido estatico mientras se agrega interactividad solo donde se necesita.

Ejemplo de uso:
```astro
---
import ApplicationForm from '../islands/ApplicationForm.tsx';
---

<ApplicationForm client:load />
```

### Backend: Supabase

**Supabase** se utiliza como Backend-as-a-Service para:

- **Autenticacion:** Login, registro, recuperacion de contrasena, sesiones.
- **Base de datos:** PostgreSQL para usuarios, misiones, bitacoras, academias.
- **Storage:** Almacenamiento de archivos (documentos, imagenes de perfil).
- **RLS (Row Level Security):** Politicas de seguridad a nivel de fila.

**Tablas principales:**
- `users` — Pilotos y aspirantes con roles y estados
- `aircraft` — Flota de aeronaves virtuales
- `missions` — Misiones y operaciones
- `flight_plans` — Planes de vuelo
- `flight_logs` — Bitacora de vuelos
- `academy_courses` — Cursos de la academia (6 fases)
- `academy_evaluations` — Evaluaciones de alumnos
- `maintenance_logs` — Reportes de mantenimiento

Ver `backend/sivoe71_schema.sql` para el schema completo.

### Hosting: Cloudflare Pages

El sitio se despliega en **Cloudflare Pages** para:

- **CDN global:** Carga rapida desde cualquier ubicacion.
- **SSL automatico:** Certificados TLS renovados automaticamente.
- **Deploy automatico:** Build y deploy al hacer push a `master`.
- **Variables de entorno:** Configuracion segura de credenciales.

## Stack tecnologico y por que

| Tecnologia | Por que |
|---|---|
| **Astro v7** | Framework estatico rapido, islands para interactividad, compatible con React |
| **TailwindCSS** | Desarrollo rapido de estilos, responsive facil, consistencia visual |
| **SCSS** | Variables de marca, mixins, nesting para estilos complejos |
| **TypeScript** | Seguridad de tipos, mejor experiencia de desarrollo, menos errores en produccion |
| **React Islands** | Interactividad opt-in sin penalizar rendimiento del sitio estatico |
| **Supabase** | Alternativa open-source a Firebase, PostgreSQL, auth integrada, RLS |
| **Cloudflare Pages** | Deploy estatico rapido, CDN global, SSL, edge functions |
| **pnpm** | Paqueteria rapida, eficiente en disco, monorepos si se necesita |

## Estado actual

### Completado
- Layout base con tipografia y colores de marca
- Pagina principal (`index.astro`) con secciones: hero, nosotros, flota, operaciones, galeria, footer
- Pagina de postulacion (placeholder)
- Pagina SIVOE-71 (placeholder)
- Schema SQL para base de datos
- Blueprint de Laravel para SIVOE-71

### En progreso
- Migracion de HTML legado a componentes Astro
- Configuracion de TailwindCSS y SCSS
- Configuracion de React Islands

### Pendiente
- Formulario de postulacion completo (migrar desde `postulacion.html`)
- Sistema SIVOE-71 con autenticacion y dashboards
- Integracion con Supabase (auth, DB, storage)
- Deploy en Cloudflare Pages
- Blog del escuadron
- Panel de pilotos (area privada)

## Roadmap

### Fase 1: Sitio estatico (actual)
- [x] Layout base
- [x] Pagina principal
- [ ] Configurar TailwindCSS + SCSS
- [ ] Migrar contenido faltante del HTML legado
- [ ] Pagina de postulacion funcional
- [ ] Deploy basico en Cloudflare Pages

### Fase 2: Integracion Supabase
- [ ] Configurar proyecto Supabase
- [ ] Autenticacion (login/registro)
- [ ] Formulario de postulacion con backend
- [ ] RLS policies

### Fase 3: SIVOE-71
- [ ] Dashboard de pilotos
- [ ] Bitacora de vuelos
- [ ] Sistema de academia y evaluaciones
- [ ] Gestion de misiones
- [ ] Panel de administracion

### Fase 4: Expandir
- [ ] Blog del escuadron
- [ ] Galeria dinamica
- [ ] Calendario de operaciones interactivo
- [ ] Notificaciones y alerts

## Integraciones

### Supabase

- **URL del proyecto:** Configurar en `.env` como `PUBLIC_SUPABASE_URL`
- **Anon Key:** Configurar en `.env` como `PUBLIC_SUPABASE_ANON_KEY`
- **SDK:** `@supabase/supabase-js` + `@supabase/ssr`
- **Auth:** Email/password, proveedores sociales (futuro)
- **DB:** PostgreSQL con RLS
- **Edge Functions:** Para logica server-side cuando sea necesaria

### Cloudflare Pages

- **Build:** `pnpm build` -> directorio `dist`
- **Deploy:** Automatico al push a `master`
- **Variables de entorno:** Configurar en Cloudflare Dashboard
- **Dominio:** Personalizado con SSL automatico
- **Headers:** Configurar en `_headers` para seguridad
- **Redirects:** Configurar en `_redirects` si es necesario
