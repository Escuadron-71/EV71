# WP-ROADMAP — Plan de trabajo por Work Packages (continuidad)

> Documento de continuidad: captura el estado actual, las decisiones tomadas y el detalle
> de cada Work Package pendiente. Si el chat se cierra, este archivo es la fuente de verdad
> para retomar el trabajo. Mantenerlo actualizado al terminar cada WP.

## Contexto

- Proyecto: sitio oficial del Escuadron 71 (Astro 7 + TailwindCSS/SCSS + React Islands, TS estricto).
- Cadencia de publicacion: **2 publicaciones por semana (martes y viernes)**, en porciones
  verificadas y pequenas.
- Estrategia de publicacion: **PR `dev` → `master`** (el ruleset "Protección de Master" exige
  que los cambios pasen por pull request; push directo esta bloqueado, incluido el de Actions).
  Al mergear a `master` corren automaticamente:
  - `deploy.yml`: build con `BASE_PATH=/` y `SITE_URL=https://escuadron71.co`, despliega a
    GitHub Pages (secrets `DISCORD_BOT_TOKEN`/`DISCORD_GUILD_ID` ya configurados).
  - `release.yml`: patch bump de `package.json` + tag `vX.Y.Z` + CHANGELOG, publicados via
    rama `release/vX.Y.Z` + PR con squash (titulo `chore(release): vX.Y.Z [skip release]`
    para evitar loops) + GitHub Release + Milestone. Requiere que la org tenga habilitado
    "Allow GitHub Actions to create and approve pull requests".
- Version actual en `master`: **v0.1.2** (tag + release + milestone creados el 09-ago-2026,
  tras el merge del PR #19 con la store rediseñada). `dev` sigue en 0.1.0; el guard de "tag
  ya existe" en release.yml omitiria la publicacion si se mergea sin alinear. **Alinear `dev`
  a v0.1.2 en el proximo PR** (bump manual de `package.json`, excepcion documentada) para
  que el workflow publique v0.1.3.
- `master` ya NO es ancestro de `dev` (tiene merge commits); los merges futuros son recursivos
  y limpios mientras `dev` este adelante.
- Validacion obligatoria antes de mergear: `pnpm check` (0 errores), `pnpm build`, `pnpm test`.
- Convenciones: UI en espanol neutro, commits en ingles (Conventional Commits), rutas internas
  con `resolvePath()`, preferir componentes Astro sobre Islands, cada pagina importa su propio
  SCSS (`src/styles/pages/`), `import { z } from "astro/zod"` para content collections.

## Estado actual (2026-08-09)

- **WP1 — Navegacion + Blog/Noticias con detalle: COMPLETADO**, publicado a `master`.
  - Commits en `dev`: `67f459f` (nav), `4aba857` (collections + detalle).
  - Entregables: dropdown Multimedia reemplazado por links planos (Multimedia/Noticias/Blog),
    collections `posts`/`news` (`src/content.config.ts`), paginas `/blog/[slug]` y
    `/noticias/[slug]`, contenido real sin emojis y sin dummies, tarjetas enlazadas al detalle
    (`PostCard`, `NewsItem`, `NewsList`), estilos de detalle en `_blog.scss`.
  - Publicado a `master` el 09-ago-2026 (fast-forward) para que la noticia "5.ª Promocion FR-1"
    (inicio 10 ago 2026) saliera a tiempo.
  - **WP2 — Tienda rediseñada: COMPLETADO y PUBLICADO** (PR #19 → v0.1.2).
  - **WP3 — Cursos CR1 por aeronave: COMPLETADO** (commit `7c024cc`, sin push aun).
  - **WP4 — Planificador DCS: PORTADO (Fases 1-3)**, pendiente de commit y push.
- **Pendiente en working tree (NO commitear en los WPs):**
  - `src/styles/pages/_nosotros.scss` (cambio manual del equipo).
  - `src/data/events/latest.json` + `src/data/events/history/*` (salida local del sync de eventos).
  - `docs/` y `backend/scripts/airfields-extract/` (untracked, material fuente del equipo).

## Decisiones fijadas (no revertir sin decision explicita del equipo)

- Sin emojis en titulos/encabezados del contenido publicado.
- Sin entradas dummy en datos publicados: solo contenido real.
- El CR1 se modela como **2 cursos por aeronave** (F-16C Viper y F/A-18C Hornet), no un CR1 unico.
- Sylabus extenso de los cursos CR1: **tablas colapsables por fase (vanilla, sin React)**, al
  estilo del patron JS de `/multimedia`.
- Tienda: los filtros "Novedad" y "Mayor descuento" requieren campos nuevos `nuevo: boolean`,
  `precioAnterior?: number` y `publicado?: string` (fecha ISO) por producto.
- Tienda: catalogo **plano** (sin separadores por categoria; la categoria vive en el badge de la
  card) y toggle grid/lista tipo **switch** (checkbox oculto + 2 labels con iconos SVG).
- Postulacion: implementacion Supabase con **guia paso a paso** (el encargado es Frontend y esta
  aprendiendo Backend). Entregar tambien documentacion escrita.
- Email: se mantiene la cuenta Gmail; solo se habilita **forwarding** de `hola@escuadron71.co`
  → Gmail (guia paso a paso, sin migracion).
- Dashboards (admin/usuario): **React SPA standalone (Vite)** en repos privados del org; en el
  repo web solo se deja un archivo explicativo.
- **WP4 (planificador DCS): REACTIVADO.** Se porta la feature desde `plannerDCS` (files only,
  sin merge crudo) con alcance **Fases 1-3** (B1/B3/B6/B7/B8/B9). Fases 4-8 quedan pendientes
  y se detallan en `.opencode/plans/PLANNER.md`.

## Work Packages

- **WP2 — Tienda eCommerce-lite: COMPLETADO y PUBLICADO** (2026-08-09; commits `07fc895`
  y `d691f5f` en `dev`, publicado a `master` via PR #19 → v0.1.2).
  - Catalogo **plano** (sin grupos por categoria): titulo "Todos los productos"; la categoria
    se muestra en el badge de cada card.
  - Toolbar rediseñado (vanilla TS, sin React): buscador con icono y etiqueta "Buscar" a la
    izquierda; a la derecha grupo "Organizar por" (icono filtro + select) y **switch
    grid/lista** (checkbox oculto con `role="switch"` + 2 labels con iconos SVG y tooltips CSS
    via `data-tooltip`).
  - Select de orden: Por defecto, Precio mayor/menor, Alfabetico A-Z/Z-A, Ultimos publicados
    primero, Mayor descuento.
  - Campo nuevo `publicado?: string` (ISO) en `Product` y `products.json`; comparadores Z-A y
    por fecha; `ProductCard` expone `data-publicado` (se quito `data-nuevo`).
  - Campos `nuevo: boolean` y `precioAnterior?: number` en `Product` y `products.json`
    (parche y camiseta con descuento; stickers y gorra como novedad).
  - Helper `descuentoPct` en `src/lib/store/whatsapp.ts` (con tests) y precio anterior formateado.
  - `/tienda/[slug]`: breadcrumb `Tienda / Categoria / Producto`, precio anterior tachado y
    badges "Nuevo"/"-X%".
  - `ProductCard` con badges (Nuevo, % off, Disponible/Agotado) y data attrs para busqueda/orden.

### WP3 — Cursos CR1 por aeronave  [COMPLETADO]

Objetivo: dividir el curso CR1 unico en **2 cursos por aeronave** (F-16C Viper y F/A-18C
Hornet) usando el contenido de `docs/CR1-F16c.md` y `docs/CR1-FA-18c.md` (sin emojis).

Archivos:
- `src/content.config.ts` (schema `courses`: agregar `aircraft`, datos de fases; mantener
  `import { z } from "astro/zod"`).
- `src/assets/courses/`: reemplazar `curso-cr1.md` por `curso-cr1-f16c.md` y
  `curso-cr1-fa18c.md` (el id ya incluye el prefijo; la ruta dinamica `[slug].astro` no cambia).
- Sylabus extenso (F-16C: 18 clases teoria + 72 sesiones vuelo): **tablas colapsables por fase**
  (vanilla `<details>` o JS tipo `/multimedia`). Decidir si el sylabus vive en el `.md` o en
  `src/data/courses/*.json`.
- `src/pages/academia/avva71.astro` (el grid muestra los 2 CR1 como cards separadas).
- `src/components/academia/CourseCard.astro` (mostrar aeronave).
- `src/lib/navigation.ts` (dropdown Academia: "Curso Basico CR1" → 2 entradas por aeronave).
- `src/styles/pages/_academia.scss` (tablas colapsables responsive).

Validacion: `pnpm check`, `pnpm build`, `pnpm test`.

**Estado:** COMPLETADO (commit `7c024cc` — "feat(academia): split CR1 into F-16C and F/A-18C
courses"; 10 archivos: 2 cursos nuevos, `curso-cr1.md` borrado, `order` de CR2/CR3 ajustado,
colapsables `.course-phase` rediseñados en `curso-fr1.md`). Build 41 paginas. **Sin push aun.**
Scripts scratch (`backend/scripts/gen-cr1-*.mjs` + `.gen-*`) NO se commitean.

### WP4 — Planificador DCS  [COMPLETADO - Fases 1-3]

- Port de la feature desde `plannerDCS` (files only, sin merge crudo) + fix de hidratacion
  de `DogfightApp`.
- Entrega: `/planificador` con React Island `FlightPlanner` (Leaflet), plugins SAM rings /
  bullseye / comms / brevity / airfields / map-layers y export kneeboard (Canvas).
  Deps: `leaflet@^1.9.4`, `@types/leaflet@^1.9.22`.
- Fases 4-8 (B10, B4, A1, E1, C1, B5, B2, C2, D1) pendientes; detalle en
  `.opencode/plans/PLANNER.md`.
- Validacion: `pnpm check` 0 errores, `pnpm test` 64/64, `pnpm build` 41 paginas
  (incluye `/planificador`).

### WP5 — Postulacion con Supabase

Objetivo: formulario de postulacion funcional con autenticacion/datos reales, implementado con
**guia paso a paso** para el encargado (Frontend aprendiendo Backend).

Requisitos:
- Proyecto Supabase; credenciales en `.env` (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`);
  `.env.example` actualizado.
- Schema desde `backend/sivoe71_schema.sql` (users, aircraft, missions, flight_plans,
  mission_assignments, flight_logs, training_records, academy_courses, academy_evaluations,
  maintenance_logs).
- RLS en todas las tablas; usar `@supabase/ssr` o `@supabase/auth-helpers-astro`.
- Formulario con validacion `zod` (cliente) + validacion servidor (Edge Functions o RLS).
- Entregar guia escrita paso a paso (proyecto, tablas, RLS, cliente, formulario, despliegue).

Archivos base: `src/pages/postulacion.astro`, `src/styles/pages/_postulacion.scss`,
`.opencode/plans/POSTULACION.md` (ya existe como punto de partida).

### WP6 — Email forwarding `hola@escuadron71.co` → Gmail  [GUIA]

- Sin migracion de correo: mantener Gmail y solo redirigir el buzón del dominio.
- Requiere conocer el proveedor de DNS del dominio `escuadron71.co`.
- Entregar guia paso a paso (configuracion DNS/Email Routing + verificacion + reenvio a Gmail).

### WP7 — Dashboards admin/usuario  [GUIA]

- Los dashboards viven en **repos privados del org** como React SPA standalone (Vite) en
  GitHub Pages.
- En el repo web dejar **archivo explicativo** (arquitectura, repos, como desplegar, como
  conectar con Supabase).

### WP8 — i18n  [FUTURO]

- Fase final. Ver `.opencode/plans/I18N.md`.

## Comandos utiles

```bash
git status --short --branch        # verificar rama (trabajar en dev)
pnpm check                         # tipos y errores (0 errores antes de mergear)
pnpm test                          # unit tests (Vitest)
pnpm build                         # build de produccion
pnpm preview                       # preview del build
pnpm sync:events                   # sync manual de eventos Discord (local)
```

## Flujo de publicacion (recordatorio)

1. Trabajar y commitear en `dev`.
2. Validar `pnpm check && pnpm build && pnpm test`.
3. Para publicar: `git fetch origin`, abrir PR `dev → master` y mergearlo
   (dispara deploy + release), volver a `dev`.
