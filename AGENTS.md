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
pnpm sync:events      # Ejecutar sincronizacion manual de eventos Discord
pnpm legacy:server    # Backend legacy (scripts/server.js - temporal)
```

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

### Modulo Planificador (cartas de navegacion 2D)

- La pagina `/planificador` usa un React Island (`FlightPlanner.tsx` en `src/islands/`) con `client:load`.
- El mapa usa **Leaflet directamente** (sin react-leaflet), importado dinamicamente dentro de `useEffect` (`await import("leaflet")`) para no romper el build estatico (Leaflet accede a `window` en SSR).
- Los tipos de Leaflet se importan en tipo (`import type * as L from "leaflet"`); la referencia runtime se guarda en un ref. Las instancias se tipan con `L.Map`, `L.LayerGroup`, `L.LeafletMouseEvent`.
- **No usar los iconos por defecto de Leaflet** (rutas relativas rompen con `BASE_PATH`): usar `L.divIcon` con el marcador HUD (`planner-marker`) estilado en `_planificador.scss`.
- Capas de tiles gestionadas por el plugin `src/lib/planner/plugins/map-layers/` (`layers.ts` + barrel `index.ts`): **Satelite** (Esri World Imagery), **Mapa** (Esri World Street Map), **Hibrido** (Esri Imagery + overlay CartoDB `voyager_only_labels`) y **Topo** (Esri World Topo Map; NO usar OpenTopoMap). El island consume `MAP_LAYERS`/`getMapLayer` y renderiza base + `subLayers`; la capa activa se guarda en localStorage y se valida con `isMapLayerId`.
- Teatros disponibles: **Cáucaso y Siria**. Los bounds lat/lon de cada teatro estan hardcodeados en `src/lib/planner/theaters.ts` (calculados desde las proyecciones DCS y los rectangulos de terreno de pydcs; NO usar `proj4` en runtime).
- Logica de navegacion en `src/lib/planner/navigation.ts` (funciones puras): `haversineNm`, `initialBearing` (gran circulo), `rhumbLineBearing` (loxodromica, rumbo constante como la regla F10 de DCS), `eteMinutesForLeg`, `greatCirclePoints` (densifica la linea para graficar gran circulo), y formateo de HDG/NM/ETE.
- Aeronaves en `src/lib/planner/aircraft.ts`: F/A-18C (400 kt), F-16C (450 kt), F-15C (450 kt), F-15E (450 kt), A-10C II (300 kt), T-45 (350 kt), C-130H (290 kt), CH-47F (140 kt), UH-60L (135 kt). La velocidad es editable y el ETE se recalcula al instante.
- Interaccion: click agrega waypoint, click derecho elimina el ultimo, botones por waypoint para centrar/eliminar, "Limpiar" vacia la ruta. Los clicks fuera de los bounds del teatro se ignoran.
- `maxBounds` del teatro activo restringe el paneo; al cambiar de teatro el mapa hace `fitBounds`.
- Persistencia automatica en localStorage (`ev71-planner-state`) con el mismo patron de validacion de DogfightApp.
- Layout desktop en `src/styles/pages/_planificador.scss`: `.planner-app` es **flex row** (HUD izquierda como columna con scroll, mapa `flex:1`, panel derecho 320px); los controles de zoom/attribution de Leaflet quedan dentro del mapa (topleft/bottomleft). En movil el mapa pasa a flujo vertical (HUD arriba, mapa, panel como hoja inferior).
- El CSS de Leaflet se importa en el frontmatter de la pagina: `import "leaflet/dist/leaflet.css"`.
- Patron de plugins aprobado: `src/lib/planner/plugins/<name>/` (logica + datos, SSR-safe, sin `window`) + barrel `index.ts`. Futuros widgets React en `src/islands/planner/widgets/`. Ver `AI_CONTEXT.md` para contexto completo de sesiones.
- **Nav log / ETA (B8) + TOT (B6):** tiempos en Zulu (UTC) via `formatZuluClock`/`parseZuluClock`; tabla de tramos con columnas Acum/ETA; bloque "Tiempos (Z)" permite fijar TOT/despegue y recalcular la velocidad (`requiredSpeedKt`, boton "Aplicar"). Logica pura en `src/lib/planner/navigation.ts`.
- **SAM rings (B1):** herramienta "Amenazas" en el HUD coloca SA-2/SA-6/SA-10 con circulos de deteccion (`$warn`, dashed) y disparo (`$danger`); datos en `src/lib/planner/plugins/sam-rings/sams.ts`.
- **UI bloques desplegables:** HUD y panel usan bloques colapsables (acordeon multi-abierto) con titulo + badge + chevron, basados en `<details>`/`<summary>` nativos via `PlannerBlock.tsx` (`src/islands/planner/widgets/`, `onToggle(id, open)`). Al cargar solo el primer bloque de cada sidebar esta abierto (Mision en HUD, Ruta en panel); el estado `openBlocks` persistido en `ev71-planner-state` se restaura si existe. Auto-expandir por accion: Amenazas al activar herramienta o colocar SAM; Tiempos al fijar TOT/despegue. La barra de herramienta (Navegacion/Amenazas) es persistente, no colapsable. Los sidebars tienen `overflow-y: auto` + `overscroll-behavior: contain`.
- **Campos de tiempo TOT/Despegue:** `<input type="time">` nativos (editable, no se limpian al teclear), valor `HH:MM` sincronizado con `formatZuluClock`/`parseZuluClock`; "Despegue calculado" es salida read-only. El selector CSS incluye `input[type="time"]` y oculta el picker nativo.
- **Focus mode:** boton "Enfoque" en el HUD alterna la clase `planner-focus` en `document.body` (efimero, no persistido): oculta solo header/footer/page-head y maximiza la **herramienta completa** a `100vh` (los sidebars HUD/panel quedan **visibles**); boton flotante "✕ Salir" anclado dentro del mapa (`position: absolute`); al alternar se llama `map.invalidateSize()`. En movil vuelve a flujo en columna con scroll. Reglas en `_planificador.scss`.
- **Hidratacion SSR (importante):** los islands con persistencia localStorage NO deben leer `localStorage` en los initializers de `useState` (causa hydration mismatch: SSR renderiza defaults y el cliente lee lo persistido). Patron: estado inicial desde constantes `DEFAULT_STATE` (SSR-safe) + un `useEffect` que aplica `loadState()` una sola vez. Aplicado en `FlightPlanner.tsx` y `DogfightApp.tsx`.
- **Fase 2 (B9) — Bullseye/BRAA, Frecuencias, Brevity:** herramienta "Referencia" (tercer boton en la barra persistente, junto a Navegacion/Amenazas): clic coloca el bullseye, clic derecho lo elimina, marcador `divIcon` `planner-bullseye-marker` **arrastrable** (`draggable: true` + evento `dragend` actualiza el estado). Bloque "Bullseye" en el panel muestra la tabla BR por waypoint (`BR 045/25`) via `braaFromBullseye`/`formatBraa` de `src/lib/planner/plugins/bullseye/` (reusa `initialBearing`/`haversineNm`). Bloques "Frecuencias" y "Brevity" usan los widgets `CommList.tsx`/`BrevityList.tsx` (`src/islands/planner/widgets/`), ambos con listas **reordenables por drag & drop nativo** via el generico `ReorderableList.tsx` (patron DogfightApp) + alta/edicion/eliminacion inline. COMM detecta la banda automaticamente (`bandForFrequency`: 118-137 VHF AM, 225-400 UHF, 30-88 FM). Brevity incluye un set inicial de 20 codigos en `src/lib/planner/plugins/brevity/brevity.ts` — **lista editable: la direccion de la ORG puede solicitar agregar/cambiar/eliminar codigos en cualquier momento**. Nuevos estados persistidos en `ev71-planner-state`: `bullseye`, `frequencies`, `brevityCodes` (con validacion backward-compat en `loadState()`). Auto-expandir: bloque Bullseye al activar la herramienta o colocar el punto. Estilos en `_planificador.scss` (secciones "Fase 2 (B9)" y "Marker Bullseye").

### Paginas institucionales (Nosotros)

- Las paginas bajo `/nosotros/` (mision-vision, declaracion, objetivos, reglamento, historia, estructura) se construyen desde los documentos `.md` de `src/assets/docs/`.
- Los `.md` se cargan como content collection (`docs`) definida en `src/content.config.ts` con `glob()`.
- Para modificar el contenido de una pagina, editar el `.md` correspondiente; NO hardcodear el texto en la pagina.
- Los IDs de la coleccion son el slug sin extension y en minusculas (ej: `Mision.md` -> `mision`).
- Las paginas usan el componente compartido `DocPage.astro` y los estilos de `src/styles/pages/_nosotros.scss` (importado por pagina, no en `main.scss`).
- El dropdown "Nosotros" del header enlaza a estas paginas siguiendo el patron `nav-dropdown` de Academia/Actividades.

### Versionado y releases

- Cada push a `master` dispara el workflow `release.yml`, que genera tag, release y patch bump de la version (inicia en `0.1.0`).
- La version se gestiona en `package.json` y se registra en `CHANGELOG.md`; NO se muestra en el sitio.
- El commit de release usa el mensaje `chore(release): vX.Y.Z [skip release]` para evitar loops con el deploy.
- Los cambios de version los hace el workflow; no editar la version de `package.json` manualmente salvo necesidad explicita.
