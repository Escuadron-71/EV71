# AGENTS.md

## Objetivo del proyecto

El proyecto EV71 PageWeb es el sitio web oficial del Escuadron 71. Desarrollado con Astro.build como framework principal, combina paginas estaticas de alto rendimiento con componentes interactivos mediante React Islands. El sitio esta preparado para integracion futura con Supabase en modulos que requieran autenticacion, base de datos o interaccion dinamica.

## Stack tecnologico

- **Framework:** Astro v7
- **Estilos:** TailwindCSS + SCSS
- **Lenguaje:** TypeScript (estricto)
- **Interactividad:** React Islands (solo para componentes que lo requieran)
- **Backend/BaaS:** Supabase (autenticacion, base de datos, storage)
- **Hosting:** Cloudflare Pages
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
    components/   # Buttons, cards, forms, modals, social-icons
    layout/       # Header, footer, hero, sections
    pages/        # Home, postulacion, sivoe71
    vendors/      # Reservado para librerias externas
  islands/        # Componentes React Islands (client:load, client:visible, etc.)
  lib/            # Funciones utilitarias, helpers, tipos compartidos (base-url.ts, etc.)
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
- Variables de tema: colores del escuadron en `@theme` (naranja #ff7a00, verde militar #7f8d58, fondos oscuros #0c1117, #111821).
- Responsive: usar prefijos `sm:`, `md:`, `lg:` de Tailwind. Evitar media queries manuales en SCSS cuando Tailwind las resuelve.

### SCSS

- Usar archivos `.scss` parciales en `src/styles/` para variables, mixins y utilidades globales.
- Importar SCSS en componentes Astro o en el layout global.
- No duplicar estilos que Tailwind ya cubre.
- Mantener SCSS para: variables de marca, mixins de accesibilidad, breakpoints personalizados, y estilos que requieren selectores anidados.
- Los estilos de paginas (`src/styles/pages/`) se importan directamente en cada pagina `.astro`, NO en `main.scss`. Esto evita cargar CSS no utilizado.

### Base Path y manejo de URLs

- El sitio se despliega bajo un subcamino (`/ev71` en GitHub Pages, `/` en dominio propio).
- **Nunca usar paths hardcodeados** como `href="/pagina"` en componentes.
- Usar `resolvePath()` de `src/lib/base-url.ts` para todas las rutas internas:
  ```astro
  ---
  import { resolvePath } from "@/lib/base-url";
  ---
  <a href={resolvePath("/postulacion")}>Postulate</a>
  ```
- `import.meta.env.BASE_URL` viene de `astro.config.mjs` que lee la variable `BASE_PATH` del entorno.
- En local, `.env` define `BASE_PATH=/ev71` para que `pnpm dev` sirva en `localhost:4321/ev71/`.
- En produccion (CI), `BASE_PATH=/ev71` se inyecta via GitHub Actions o `pnpm build:prod`.
- Para dominio propio futuro: cambiar `BASE_PATH=/` en `.env` y en CI.
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

## Cloudflare Pages

### Deploy

- Conectar el repositorio de GitHub a Cloudflare Pages.
- Configurar el build command: `pnpm build`.
- Configurar el directorio de salida: `dist`.
- Variables de entorno en el dashboard de Cloudflare (no en el repositorio).

### Variables de entorno en Cloudflare

- Ir a Pages > tu proyecto > Settings > Environment variables.
- Agregar las mismas variables de `.env` pero con los valores reales.
- Variables `PUBLIC_*` estan disponibles en el cliente.
- Variables sin prefijo `PUBLIC_` solo estan disponibles en server-side (Edge Functions).

### Configuracion de dominio

- Configurar dominio personalizado en Cloudflare Pages.
- SSL/TLS automatico via Cloudflare.
- Headers de seguridad: configurar en `_headers` o en el dashboard.

## Calidad visual

- El sitio debe sentirse como una plataforma seria de simulacion aeronautica militar.
- Evitar layouts de landing genericos cuando se construyan herramientas o paneles.
- Usar imagenes reales del escuadron o assets existentes siempre que aporten contexto.
- Cuidar responsive desde el inicio: escritorio, tablet y movil.
- No depender de rutas con barras invertidas en HTML o CSS.
- Colores de marca: naranja #ff7a00, verde militar #7f8d58, dorado #c8a44d.
- Tipografia: Oswald para titulos, Rajdhani para cuerpo.

## Comandos principales

```bash
pnpm install          # Instalar dependencias
pnpm dev              # Servidor de desarrollo
pnpm build            # Build de produccion
pnpm preview          # Preview del build
pnpm check            # Verificacion de tipos y errores
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
