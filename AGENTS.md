# AGENTS.md

## Objetivo del proyecto

El proyecto EV71 PageWeb es el sitio web oficial del Escuadron 71. Desarrollado con Astro.build como framework principal, combina paginas estaticas de alto rendimiento con componentes interactivos mediante React Islands. El sitio esta preparado para integracion futura con Supabase en modulos que requieran autenticacion, base de datos o interaccion dinamica.

## Stack tecnologico

- **Framework:** Astro v7
- **Estilos:** TailwindCSS + SCSS
- **Lenguaje:** TypeScript (estricto)
- **Interactividad:** React Islands (solo para componentes que lo requieran)
- **Backend/BaaS:** Supabase (autenticacion, base de datos, storage)
- **Hosting:** GitHub Pages
- **Paqueteria:** pnpm

## Arquitectura y decisiones tecnicas

### Cuándo usar Astro vs React Islands

- **Usar componentes Astro** para contenido estatico: layout, navegacion, secciones de texto, galerias, tarjetas, footer, headers. Astro genera HTML puro sin JavaScript del lado del cliente.
- **Usar React Islands** (con `client:*`) solo cuando se necesite interaccion del usuario: formularios con validacion en tiempo real, dashboards interactivos, filtros dinamicos, modales con estado, countdowns, o cualquier componente que requiera `useState`, `useEffect` o eventos del navegador.
- **Regla de oro:** Si el componente no necesita reaccionar a acciones del usuario, no necesita React. Prefiere Astro.

### Estructura de carpetas

```
backend/
  scripts/        # Backend legacy (server.js - temporal hasta Supabase)
  data/           # Persistencia local del backend legacy
  SIVOE71_LARAVEL_BLUEPRINT.md
  sivoe71_schema.sql
public/
  assets/
    images/       # Imagenes y iconos SVG servidos estaticamente
src/
  pages/          # Rutas de Astro (archivos = rutas)
  layouts/        # Layouts reutilizables (BaseLayout, etc.)
  components/     # Componentes reutilizables (Astro o React)
  styles/         # Arquitectura 7-1 SCSS + TailwindCSS v4
    global.css    # Entrada de TailwindCSS (@import "tailwindcss" + @theme)
    main.scss     # Entrada SCSS (usa todos los parciales)
    abstracts/    # Variables, mixins, funciones
    base/         # Reset, tipografia
    components/   # Buttons, cards, event-cards, forms, modals, social-icons
    layout/       # Header, footer, hero, sections
    pages/        # Home, postulacion, sivoe71, dogfight
    vendors/      # Reservado para librerias externas
  islands/        # Componentes React Islands (client:load, client:visible, etc.)
  lib/
    base-url.ts   # Utilidad resolvePath para rutas internas
    services/     # Servicios de datos (event-service.ts, etc.)
    sync/         # Integration Modules - pipeline de sincronizacion
  data/
    events/       # Datos de eventos (latest.json, historial/)
  types/          # Definiciones de tipos TypeScript
```

### Convenciones de nombres

- Paginas: `nombre-pagina.astro` en minisculas, guiones para separar
- Componentes Astro: `NombreComponente.astro` (PascalCase)
- Componentes React: `NombreComponente.tsx` (PascalCase)
- Utilidades/lib: `nombre-utilidad.ts` (camelCase)
- Tipos: `nombre-tipos.ts` o `nombre.interface.ts`
- Estilos SCSS: `_variables.scss`, `_mixins.scss` (guion bajo para parciales)
- Assets: minisculas, guiones, sin espacios ni caracteres especiales

## Flujo de Git

- La rama `master` es la rama protegida de verificacion del equipo.
- Todo desarrollo nuevo debe realizarse en la rama `dev`.
- No se debe trabajar directamente sobre `master`.
- Todo cambio hacia `master` debe pasar por pull request desde `dev`.
- Antes de iniciar cambios, verificar rama con `git status --short --branch`.
- Si el repositorio esta en `master`, cambiar a `dev` antes de modificar archivos.
- No revertir cambios de otros colaboradores sin autorizacion explicita.
- Mantener commits pequenos y descriptivos cuando el equipo solicite commits.
- Commits pequenos y especificos: un commit = un cambio logico.
  No mezclar estilos con logica, ni features con fixes en el mismo commit.
  Esto permite revertir cambios puntuales sin afectar trabajo adyacente.
- **Idioma:** Todos los mensajes de commit deben estar en ingles. Consistencia sobre el repositorio.

## Reglas de desarrollo

### Generales

- Usar Astro como framework principal para paginas estaticas.
- Evitar JavaScript del lado cliente salvo que una interaccion lo requiera.
- Mantener el sitio compatible con `output: "static"` o `output: "hybrid"` segun necesidad.
- No introducir frameworks de UI adicionales sin decision explicita del equipo.
- Mantener textos en espanol neutro y tono institucional.
- Priorizar accesibilidad: etiquetas `alt`, contraste, foco visible y HTML semantico.
- Ejecutar `pnpm check` y `pnpm build` antes de proponer un PR cuando sea posible.

### TailwindCSS (v4)

- Usar clases de Tailwind directamente en el HTML de Astro y React.
- Evitar `@apply` en exceso; preferir clases utility en el template.
- Usar SCSS solo para estilos complejos que Tailwind no resuelve facilmente: animaciones custom, pseudo-elementos, o estilos que requieren nesting profundo.
- Configuracion CSS-first via `@theme` en `src/styles/global.css`. No usar `tailwind.config.ts` (v4 no lo requiere).
- Variables de tema: colores del escuadron en `@theme` (dorado #E8B25C, fondos oscuros #0A0E17, #111826, #202D46).
- Responsive: usar prefijos `sm:`, `md:`, `lg:` de Tailwind. Evitar media queries manuales en SCSS cuando Tailwind las resuelve.

### SCSS

- Usar archivos `.scss` parciales en `src/styles/` para variables, mixins y utilidades globales.
- Importar SCSS en componentes Astro o en el layout global.
- No duplicar estilos que Tailwind ya cubre.
- Mantener SCSS para: variables de marca, mixins de accesibilidad, breakpoints personalizados, y estilos que requieren selectores anidados.
- Los estilos de paginas (`src/styles/pages/`) se importan directamente en cada pagina `.astro`, NO en `main.scss`. Esto evita cargar CSS no utilizado.

### Base Path y manejo de URLs

- El sitio se despliega en dominio propio (`https://escuadron71.co`).
- **Nunca usar paths hardcodeados** como `href="/pagina"` en componentes.
- Usar `resolvePath()` de `src/lib/base-url.ts` para todas las rutas internas:
  ```astro
  ---
  import { resolvePath } from "@/lib/base-url";
  ---
  <a href={resolvePath("/postulacion")}>Postulate</a>
  ```
- `import.meta.env.BASE_URL` viene de `astro.config.mjs` que lee la variable `BASE_PATH` del entorno.
- En local, `.env` define `BASE_PATH=/` para desarrollo directo en `localhost:4321/`.
- En produccion (CI), `BASE_PATH=/` se inyecta via GitHub Actions.
- **SCSS:** Los `url()` en archivos SCSS NO respetan `BASE_PATH`. Usar `<img>` con `src` dinamico en vez de `background-image` en SCSS.

### Secciones con imagen de fondo

- Usar la imagen de fondo como `<picture><img>` dentro de la seccion, NO como `background-image` en SCSS.
- Manejar z-index con Tailwind: `z-0` para la imagen, `z-1` para el contenido.
- Gradiente overlay via Tailwind o SCSS segun necesidad.
- Ejemplo:
  ```astro
  <section class="hero relative">
    <picture class="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <img src={`${base}assets/images/Banner1.jpg`} alt="..." class="absolute inset-0 w-full h-full object-cover" />
    </picture>
    <div class="container z-1">...</div>
  </section>
  ```

### TypeScript

- Usar `strict: true` en `tsconfig.json` (ya configurado via Astro).
- Definir interfaces para props de componentes Astro y React.
- Evitar `any`. Usar tipos genericos cuando sea necesario.
- Exportar tipos compartidos desde `src/types/`.
- Usar enums o union types para valores finitos (estados, roles, etc.).

### React Islands

- Los componentes React van en `src/islands/` o `src/components/`.
- Usar la directiva `client:load`, `client:visible` o `client:idle` segun necesidad de carga.
- Mantener los componentes React pequenos y enfocados. No construir apps completas en React.
- Pasar datos iniciales desde Astro como props serializadas.
- No usar React para contenido que podria ser estatico.
- Preferir componentes funcionales con hooks.
- Para formularios: usar validacion con `zod` o validacion manual, no depender solo de HTML.

## Supabase

### Configuracion

- Crear cuenta en Supabase y configurar un proyecto.
- Las credenciales van en `.env` (nunca en el repositorio):
  ```
  PUBLIC_SUPABASE_URL=tu_url_aqui
  PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
  ```
- Mantener `.env.example` actualizado con las variables necesarias.
- Usar prefijo `PUBLIC_` solo para variables que llegan al navegador.

### Autenticacion

- Usar `@supabase/ssr` o `@supabase/auth-helpers-astro` para manejar sesiones.
- Configurar auth con email/password, y opcionalmente proveedores sociales.
- Implementar proteccion de rutas con middleware de Astro.
- Roles de usuario: administrador, comandante, instructor, piloto, aspirante.

### Base de datos

- Usar el schema SQL existente en `backend/sivoe71_schema.sql` como referencia.
- Tablas principales: users, aircraft, missions, flight_plans, mission_assignments, flight_logs, training_records, academy_courses, academy_evaluations, maintenance_logs.
- Implementar Row Level Security (RLS) en todas las tablas.
- Usar los tipos generados por Supabase (`supabase gen types typescript`) para tipado de consultas.

### Seguridad

- Nunca exponer la `service_role` key en el frontend.
- Siempre usar la `anon` key en el cliente.
- Implementar RLS policies para cada tabla.
- Validar datos tanto en el cliente (formularios) como en el servidor (Edge Functions o RLS).
- No guardar datos sensibles en el repositorio.

## Calidad visual

- El sitio debe sentirse como una plataforma seria de simulacion aeronautica militar.
- Evitar layouts de landing genericos cuando se construyan herramientas o paneles.
- Usar imagenes reales del escuadron o assets existentes siempre que aporten contexto.
- Cuidar responsive desde el inicio: escritorio, tablet y movil.
- No depender de rutas con barras invertidas en HTML o CSS.
- Colores de marca: dorado #E8B25C, fondos oscuros #0A0E17, #111826, #202D46.
- Tipografia: Oswald para titulos, Roboto para cuerpo.

## Comandos principales

```bash
pnpm install          # Instalar dependencias
pnpm dev              # Servidor de desarrollo
pnpm build            # Build de produccion
pnpm preview          # Preview del build
pnpm check            # Verificacion de tipos y errores
pnpm test             # Tests unitarios (Vitest)
pnpm sync:events      # Ejecutar sincronizacion manual de eventos Discord
pnpm legacy:server    # Backend legacy (scripts/server.js - temporal)
```

## Roadmap de desarrollo (web)

- El roadmap se ejecuta por ramas `feat/*` creadas desde `dev`. Cada rama tiene su plan
  detallado en `.opencode/plans/<NOMBRE>.md` (fases, archivos, criterios de validacion).
- Orden de entrega: `testing` -> `header-navigation` -> contenido (multimedia-hub, academia,
  fleet, blog-news, store, donations) -> `postulacion` -> `i18n` (fase final).
- Ramas y planes:
  - `feat/testing` -> `.opencode/plans/TESTING.md` (Vitest + tests de `src/lib/**`). Se fusiona primero.
  - `feat/header-navigation` -> `.opencode/plans/HEADER.md` (subheader 2 niveles + rutas stub).
  - `feat/multimedia-hub` -> `.opencode/plans/MULTIMEDIA.md`
  - `feat/academia` -> `.opencode/plans/ACADEMIA.md`
  - `feat/fleet` -> `.opencode/plans/FLEET.md`
  - `feat/blog-news` -> `.opencode/plans/BLOG-NEWS.md`
  - `feat/store` -> `.opencode/plans/STORE.md`
  - `feat/donations` -> `.opencode/plans/DONATIONS.md`
  - `feat/postulacion` -> `.opencode/plans/POSTULACION.md` (Supabase)
  - `feat/i18n` -> `.opencode/plans/I18N.md`
- Cada rama debe validar `pnpm check`, `pnpm build` y `pnpm test` antes de mergear a `dev`.
- Decisiones de diseno/arquitectura ya tomadas quedan fijadas en su plan y en esta guia;
  no revertirlas sin decision explicita del equipo.

## Pull requests

Cada PR hacia `master` debe incluir:

- Resumen breve de cambios.
- Paginas o componentes afectados.
- Evidencia de validacion: `pnpm check`, `pnpm build` o nota si no se pudo ejecutar.
- Capturas si hay cambios visuales relevantes.

## Notas para IA

- Siempre revisar `AGENTS.md` antes de generar codigo.
- Respetar la estructura de carpetas definida.
- No introducir dependencias nuevas sin verificar que no exista una alternativa ya en el proyecto.
- Priorizar componentes Astro sobre React Islands.
- Mantener consistencia visual con la identidad militar/aeronautica del Escuadron 71.
- Usar los colores y tipografia definidos en las variables de Tailwind/SCSS.
- Verificar que las imagenes existan en `public/assets/images/` antes de referenciarlas.
- No usar `window`, `document` o APIs del navegador en componentes Astro (solo en React Islands).
- Ejecutar `pnpm check` despues de cambios significativos para verificar tipos.
- La validacion completa antes de mergear a `dev` es `pnpm check && pnpm build && pnpm test`.

### Testing (Vitest)

- Los tests unitarios corren con **Vitest** (`pnpm test` para una pasada, `pnpm test:watch` para desarrollo).
- Configuracion en `vitest.config.ts` (alias `@/` → `src/`, environment node).
- Los tests se co-localizan junto al modulo bajo test (`src/**/*.test.ts`).
- Cubren logica pura SSR-safe: `base-url`, `services/event-service` y el pipeline de `sync/**`
  (normalizador, transformador Discord, storage JSON, adaptador con retries, sync service).
- `EventService` acepta una ruta de archivo opcional en el constructor para testear sin tocar `latest.json`.
- Los modulos del planner (`src/lib/planner/**`) se testearan cuando `plannerDCS` se fusione a `dev`.

### Sistema de eventos

- Los eventos se sincronizan desde Discord via GitHub Actions (workflow `sync-events.yml`).
- Los datos transformados se almacenan en `src/data/events/latest.json`.
- El `EventService` (`src/lib/services/event-service.ts`) lee el JSON y expone `getUpcomingEvents()` y `getNextEvent()`.
- Las paginas Astro consumen el servicio en frontmatter (build-time).
- Para datos dummy (desarrollo), modificar `src/data/events/latest.json` directamente.
- Los componentes visuales (`EventCard.astro`, `EventList.astro`) renderizan en HTML puro sin JavaScript del lado cliente.
- La seccion "Proximas Operaciones" del Home usa el featured event (evento mas cercano).
- La pagina `/operaciones` lista todos los eventos en grid de 2 columnas.

### CAL (Call to Action) en eventos

- **Participar:** Abre el enlace del evento en Discord (`eventUrl`) en nueva pestana.
- **Calendar:** Genera URL de Google Calendar con titulo, fechas, descripcion y ubicacion precargados.
- **Interesados:** Numero mock extraido del JSON (cuando llegue el pipeline real, vendra de la API de Discord).

### Modulo Dogfight (King of the Hill)

- La pagina `/dogfight` usa un React Island (`DogfightApp.tsx` en `src/islands/`) con `client:load`.
- Modelo King of the Hill: un campeon se mantiene volando hasta que pierde. El retador viene de una cola de espera.
- La cola de espera admite drag & drop reordenable (nativo, sin librerias externas). Cualquier piloto puede salir de la cola en cualquier momento.
- El campeon (AS) no se marca como ganador final automaticamente; se debe presionar "Calcular Ganadores" para cerrar la sesion.
- Al calcular ganadores se genera un podium visual (top 3 con alturas 240px, 180px, 140px) y tabla del 4° puesto en adelante.
- Exportacion PNG nativa via Canvas API (sin librerias externas) con branding del escuadron.
- Persistencia automatica en localStorage: la sesion sobrevive recargas del navegador.
- Los estilos SCSS van en `src/styles/pages/_dogfight.scss` e importados en la pagina `.astro`.
- El panel de instrucciones se integra como acordeon colapsable con boton "?" al lado del titulo.
- Datos mock de pilotos incorporados; reemplazar con datos reales cuando llegue la integracion con Supabase.

### Paginas institucionales (Nosotros)

- Las paginas bajo `/nosotros/` (mision-vision, declaracion, objetivos, reglamento, historia, estructura) se construyen desde los documentos `.md` de `src/assets/docs/`.
- Los `.md` se cargan como content collection (`docs`) definida en `src/content.config.ts` con `glob()`.
- Para modificar el contenido de una pagina, editar el `.md` correspondiente; NO hardcodear el texto en la pagina.
- Los IDs de la coleccion son el slug sin extension y en minusculas (ej: `Mision.md` -> `mision`).
- Las paginas usan el componente compartido `DocPage.astro` y los estilos de `src/styles/pages/_nosotros.scss` (importado por pagina, no en `main.scss`).
- El dropdown "Nosotros" del header enlaza a estas paginas siguiendo el patron `nav-dropdown` de Academia/Actividades.

### Seccion Academia (AVVA71)

- Las paginas `/academia/avva71` (landing), `/academia/curso-*` (4 cursos) y `/academia/instructores`
  reemplazaron los stubs iniciales.
- Los cursos se cargan como content collection `courses` (`src/content.config.ts`) desde
  `src/assets/courses/*.md`, con schema zod tipado: `title`, `code` (FR1/CR1/CR2/CR3), `level`
  (Basico/Avanzado), `duration`, `summary`, `status`, `order`, `prerequisites`, `modules`.
  El `z` se importa de `astro/zod` (no de `astro:content`, deprecado en Astro 7).
- Para modificar el contenido de un curso, editar el `.md` correspondiente; NO hardcodear el texto
  en la pagina. Los IDs de la coleccion son el nombre del archivo (ej: `curso-fr1.md` -> `/academia/curso-fr1`).
- La vista individual usa la ruta dinamica `src/pages/academia/[slug].astro` con `getStaticPaths`
  (el archivo debe llamarse `[slug].astro`, no `curso-[slug].astro`, porque el id ya incluye el prefijo).
- Los `.md` de cursos empiezan con `##` (no `#`) para evitar dos H1: el titulo ya esta en el hero de la pagina.
- Instructores en `src/data/academia/instructors.json` (tipado en `src/types/academia.ts`); los datos
  actuales son placeholder marcados con `pending: true` hasta que la direccion confirme los reales.
- Componentes Astro puros: `CourseCard`, `InstructorCard` en `src/components/academia/`.
- Estilos en `src/styles/pages/_academia.scss` (importado por pagina, no en `main.scss`); la vista de
  curso reutiliza la tipografia markdown de `_nosotros.scss` (clase `.doc-content`).

### Seccion Flota

- Las paginas `/flota` (indice) y `/flota/[slug]` (vista por aeronave) reemplazaron el stub inicial.
- Datos curados en `src/data/fleet/aircraft.json` (tipados en `src/types/fleet.ts`): slug, codigo, rol
  (caza/ataque/transporte/helo), pais, tareas, specs, armamento, imagen, moduloOficialUrl y pilotos.
  Sin libreria runtime de datos; los enlaces a modulos oficiales DCS estan verificados
  (`digitalcombatsimulator.com/en/shop/modules/...`).
- El indice agrupa por rol (orden: caza, ataque, transporte, helo). Con menos de 10 aeronaves no hay
  filtro client-side; si la flota crece, anadir filtro con el patron vanilla TS de `/multimedia`.
- La vista por aeronave usa `getStaticPaths` desde `aircraft.json`. Nota: si el frontmatter declara
  `const { note, aircraft } = fleetData` y la variable se usa en el template, Astro la mueve dentro de
  la funcion de render y `getStaticPaths` (scope de modulo) no puede verla; leer el JSON dentro de
  `getStaticPaths` (`fleetData as FleetData`).
- Componentes Astro puros: `AircraftCard`, `AircraftSpecs`, `PilotList` en `src/components/fleet/`.
- Pilotos por aeronave son placeholder hasta que la direccion confirme la lista real.
- Estilos en `src/styles/pages/_fleet.scss` (importado por pagina, no en `main.scss`).

### Header y navegacion (2 niveles)

- El header usa **2 filas**: `.header-top` (logo + CTA POSTULATE + UserDropdown, no sticky) y `.header-subnav` (navbar sticky con `top: 0`).
- En movil (`max-width: 1024px`) el subnav deja de ser sticky y se muestra el hamburguesa; el menu completo se despliega bajo `.header-top` incluyendo dropdowns en acordeon.
- La configuracion central del menu vive en `src/lib/navigation.ts` (`buildNav(pathname)`), SSR-safe; el componente `Header.astro` la renderiza con `resolvePath()` en todos los hrefs.
- Los dropdowns usan el patron `nav-dropdown` (`_dropdowns.scss`): trigger con `aria-haspopup`/`aria-expanded`, cierre con Escape o click fuera, y clase `.is-active` en el padre cuando una sub-ruta coincide.
- Rutas planas: Inicio (`/`), Operaciones (`/operaciones`). Dropdowns: Multimedia, Nosotros, Academia, Herramientas, Comunidad.
- El CTA "POSTULATE" vive solo en `.header-top` (oculto en movil); no hay CTA duplicado en el subnav ni en el menu movil.
- Paginas placeholder de rutas pendientes usan `src/styles/pages/_stub.scss` (importado por cada stub).

### Pagina Multimedia (tabs + buscador)

- La pagina `/multimedia` usa **5 tabs accesibles**: Documentos, Galeria, Videos, Noticias, Blog.
- El estado activo se maneja por query param (`?tab=galeria`) para deep-linking; los tabs se renderizan
  en `MultimediaTabs.astro` y el cambio de tab + busqueda se hace con vanilla TS en el `<script>` de la pagina.
- Datos dummy en `src/data/multimedia/*.json` (documents, gallery, videos, news, blog); se importan via
  `@/data/...` en build-time, sin `fs` ni APIs runtime.
- `src/lib/services/multimedia-service.ts` expone getters por categoria y `searchAll(query)` (filtrado
  client-side sobre los JSON ya cargados). Test en `multimedia-service.test.ts`.
- Componentes Astro puros (sin React): `MultimediaTabs`, `MediaGrid`, `DocumentCard`, `MediaCard`,
  `NewsList`, `SearchInput` en `src/components/multimedia/`.
- Estilos en `src/styles/pages/_multimedia.scss` importados solo en la pagina.
- Cuando llegue el pipeline real (Drive/Discord), los JSON de `src/data/multimedia/` se generaran en
  build-time siguiendo el patron `sync-events`; la UI no debe depender de credenciales en el cliente.

### Paginas Blog y Noticias

- Las paginas `/blog` y `/noticias` reemplazaron los stubs y comparten `src/styles/pages/_blog.scss`
  (importado por cada pagina, no en `main.scss`).
- **Fuente unica de datos:** reutilizan `src/data/multimedia/blog.json` y `news.json` (los mismos de la
  pagina `/multimedia`), NO se duplican en `src/data/blog/`. Para editar contenido, tocar esos JSON.
- El servicio es `src/lib/services/multimedia-service.ts`: `getBlog()` y `getNews()`.
- Tipos extendidos en `src/types/multimedia.ts`: `BlogItem.categoria?`, `BlogItem.autor?`,
  `NewsItem.fuente?`.
- Componentes Astro puros en `src/components/blog/`: `PostCard` (grid de articulos con badge de
  categoria, fecha, summary y autor) y `NewsItem` (timeline con fecha, titulo, summary y fuente).
- Ambas paginas muestran una nota "contenido de ejemplo": el contenido real llegara con el pipeline
  de sincronizacion (Discord/multimedia) y no debe depender de credenciales en el cliente.

### Seccion Tienda

- `/tienda` (catalogo) y `/tienda/[slug]` (vista por producto) reemplazaron el stub inicial.
- **Catalogo build-time:** datos en `src/data/store/products.json` (tipados en `src/types/store.ts`):
  slug, nombre, precio, moneda (COP/USD), categoria, imagen, descripcion, especificaciones,
  disponible y `whatsapp` (numero/plantilla opcionales). Cada cambio de producto requiere rebuild.
- Sin carrito ni eCommerce: el checkout es un deep link de **WhatsApp Business** (`wa.me`).
  Helpers puros en `src/lib/store/whatsapp.ts` (`buildWhatsAppLink`, `buildProductMessage`,
  `buildProductWhatsAppLink`, `formatPrice`) con test en `whatsapp.test.ts`.
- El numero del escuadron se configura via `PUBLIC_WHATSAPP_NUMBER` en `.env` (ver
  `src/lib/store/config.ts`); es un dato publico, no una clave.
- El indice agrupa por categoria (Insignias, Textil, Accesorios); con menos de 10 productos no hay
  filtro client-side. La vista por producto usa `getStaticPaths` desde `products.json` (leer el JSON
  dentro de `getStaticPaths` como en flota) y muestra boton "Comprar por WhatsApp" con mensaje
  prearmado; productos agotados muestran badge y ajustan el mensaje.
- Componentes Astro puros: `ProductCard`, `ProductSpecsTable` en `src/components/store/`.
- Imagenes placeholder SVG en `public/assets/images/products/` (reemplazar con fotos reales cuando
  existan). Nota visible: el stock se gestiona de forma manual.

### Pagina Donaciones

- `/donaciones` reemplazo el stub: hero institucional, seccion "En que se usa tu apoyo"
  (servidores, equipos, herramientas, comunidad) y grid de plataformas de donacion.
- **Datos en `src/data/donations/platforms.json`** (tipados en `src/types/donations.ts`): nombre,
  descripcion, url, icono, badge (Recurrente/Unica/Local) y `disponible`. Solo Patreon
  (`https://www.patreon.com/Escuadron71`, verificado en el footer) tiene URL activa; las demas
  plataformas (BuyMeACoffee, PayPal, MercadoPago, Nequi) estan marcadas `disponible: false` y se
  renderizan como "Proximamente" hasta que la direccion confirme las cuentas.
- Sin integracion de pagos: esta fase solo redirige a las plataformas externas con
  `target="_blank"` + `rel="noopener noreferrer"`.
- Componente `DonationPlatformCard.astro` en `src/components/donations/`; iconos de marca en
  `src/assets/icons/` (`logopatreon`, `logobmc`, `logopaypal`, `logomercadopago`, `logonequi`)
  cargados por `Icon.astro`. Estilos en `src/styles/pages/_donations.scss` (por pagina).
- Nota visible de transparencia: el apoyo es voluntario y no es requisito de pertenencia.

### Versionado y releases

- Cada push a `master` dispara el workflow `release.yml`, que genera tag, release y patch bump de la version (inicia en `0.1.0`).
- La version se gestiona en `package.json` y se registra en `CHANGELOG.md`; NO se muestra en el sitio.
- El commit de release usa el mensaje `chore(release): vX.Y.Z [skip release]` para evitar loops con el deploy.
- Los cambios de version los hace el workflow; no editar la version de `package.json` manualmente salvo necesidad explicita.
