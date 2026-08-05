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
**// Primary — fondos y superficies**

- $primary: #111826;
- $primary-dark: #0A0E17;
- $primary-light: #202D46;

**// Secondary — bordes, botones, acentos dorados**

- $secondary: #E8B25C;
- $secondary-dark: #C9974A;
- $secondary-light: #e2ba79;

**// Tertiary — texto**

- $text-light: #ffffff;
- $text-dark: #000000;
- $text-muted: rgba(255, 255, 255, 0.6);

**// Accent / State**

- $ok: #4ADE80;
- $warn: #F2B84B;
- $danger: #E5586B;

**// Bordes**

- $border: rgba(255, 255, 255, 0.08);

**// Sombras**

- $shadow-panel: 0 14px 35px rgba(0, 0, 0, 0.42);

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

### Hosting: GitHub Pages

El sitio se despliega en **GitHub Pages** con dominio personalizado (`escuadron71.co`) para:

- **Deploy automatico:** Build y deploy via GitHub Action al hacer push a `master`.
- **SSL automatico:** Certificados TLS via GitHub Pages + Let's Encrypt.
- **Dominio personalizado:** `https://escuadron71.co` con redireccion `www` gestionada via DNS en Namecheap.
- **Variables de entorno:** Configuracion segura via GitHub Secrets.

## Stack tecnologico y por que

| Tecnologia           | Por que                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| **Astro v7**         | Framework estatico rapido, islands para interactividad, compatible con React     |
| **TailwindCSS**      | Desarrollo rapido de estilos, responsive facil, consistencia visual              |
| **SCSS**             | Variables de marca, mixins, nesting para estilos complejos                       |
| **TypeScript**       | Seguridad de tipos, mejor experiencia de desarrollo, menos errores en produccion |
| **React Islands**    | Interactividad opt-in sin penalizar rendimiento del sitio estatico               |
| **Supabase**         | Alternativa open-source a Firebase, PostgreSQL, auth integrada, RLS              |
| **GitHub Pages**     | Hosting estatico con deploy via GitHub Action y dominio personalizado            |
| **pnpm**             | Paqueteria rapida, eficiente en disco, monorepos si se necesita                  |

## Estado actual

### Completado

- Layout base con tipografia y colores de marca
- Pagina principal (`/`) con secciones: hero, nosotros, flota, operaciones, galeria, footer
- Seccion "Proximas Operaciones" en Home con featured event desde datos JSON
- Pagina `/operaciones` con grid de eventos, cards con imagen, CTA y Google Calendar
- Pipeline de sincronizacion de eventos Discord (adapter, normalizer, storage, CLI)
- Componente EventCard con imagen, fecha, badge, descripcion, y acciones (Participar, Calendar, interesados)
- Galeria de vuelo dinamica
- Pagina de postulacion (placeholder)
- Pagina SIVOE-71 (placeholder)
- Schema SQL para base de datos
- Blueprint de Laravel para SIVOE-71
- Dominio personalizado `escuadron71.co` con SSL
- Deploy automatico via GitHub Actions a GitHub Pages
- Modulo Dogfight (`/dogfight`): sistema King of the Hill con cola drag & drop, campeon/retador, historial de rondas, podium visual con top 3 y exportacion PNG nativa
- Paginas institucionales bajo `/nosotros` (Mision y Vision, Declaracion, Objetivos, Reglamento, Historia y Estructura), construidas desde los documentos `.md` de `src/assets/docs/` via content collections
- Dropdown "Nosotros" en el header con acceso a las paginas institucionales
- Versionado automatico (tag, release y version patch) via workflow `release.yml`

### En progreso

- Migracion de HTML legado a componentes Astro
- Configuracion de TailwindCSS y SCSS
- Configuracion de React Islands
- Pipeline real de eventos Discord (pendiente token y secrets)

### Pendiente

- Formulario de postulacion completo
- Sistema SIVOE-71 con autenticacion y dashboards
- Integracion con Supabase (auth, DB, storage)
- Blog del escuadron
- Panel de pilotos (area privada)

## Roadmap

### Fase 1: Sitio estatico (actual)

- [x] Layout base
- [x] Pagina principal
- [x] Seccion de operaciones con featured event
- [x] Pagina `/operaciones` con grid de eventos
- [x] Componentes EventCard y EventList
- [x] Pipeline de sincronizacion Discord (esqueleto)
- [ ] Dominio personalizado y SSL
- [ ] Migrar contenido faltante del HTML legado
- [ ] Pagina de postulacion funcional
- [x] Pagina `/dogfight` con King of the Hill (colas, rondas, podium, exportacion PNG)
- [x] Paginas institucionales `/nosotros` con dropdown en el header
- [x] Versionado automatico (tag, release, version)

### Fase 2: Pipeline eventos real

- [ ] Agregar `zod` al proyecto
- [ ] Configurar secrets DISCORD_BOT_TOKEN y DISCORD_GUILD_ID en GitHub
- [ ] Agregar script `sync:events` en package.json
- [ ] Activar workflow `sync-events.yml`

### Fase 3: Integracion Supabase

- [ ] Configurar proyecto Supabase
- [ ] Autenticacion (login/registro)
- [ ] Formulario de postulacion con backend
- [ ] RLS policies

### Fase 4: SIVOE-71

- [ ] Dashboard de pilotos
- [ ] Bitacora de vuelos
- [ ] Sistema de academia y evaluaciones
- [ ] Gestion de misiones
- [ ] Panel de administracion

### Fase 5: Expandir

- [ ] Blog del escuadron
- [ ] Galeria dinamica
- [ ] Notificaciones y alerts

## Integraciones

### Supabase

- **URL del proyecto:** Configurar en `.env` como `PUBLIC_SUPABASE_URL`
- **Anon Key:** Configurar en `.env` como `PUBLIC_SUPABASE_ANON_KEY`
- **SDK:** `@supabase/supabase-js` + `@supabase/ssr`
- **Auth:** Email/password, proveedores sociales (futuro)
- **DB:** PostgreSQL con RLS
- **Edge Functions:** Para logica server-side cuando sea necesaria

### GitHub Pages

- **Build:** `pnpm build` via GitHub Action al push a `master`
- **Deploy:** Automatico via `actions/deploy-pages` en GitHub Pages
- **Dominio:** `https://escuadron71.co` configurado via `public/CNAME` y GitHub Pages Settings
- **DNS:** A records en Namecheap apuntando a IPs de GitHub Pages, CNAME para `www`
- **SSL:** Automatico via GitHub Pages (Let's Encrypt)
