# WP-ROADMAP — Plan de trabajo por Work Packages (continuidad)

> Documento de continuidad: captura el estado actual, las decisiones tomadas y el detalle
> de cada Work Package pendiente. Si el chat se cierra, este archivo es la fuente de verdad
> para retomar el trabajo. Mantenerlo actualizado al terminar cada WP.

## Contexto

- Proyecto: sitio oficial del Escuadron 71 (Astro 7 + TailwindCSS/SCSS + React Islands, TS estricto).
- Cadencia de publicacion: **2 publicaciones por semana (martes y viernes)**, en porciones
  verificadas y pequenas.
- Estrategia de publicacion: **merge `dev` → `master` por fast-forward**. `master` es ancestro
  de `dev` (verificado: `git merge-base --is-ancestor master dev`), por lo que el merge no
  genera conflictos. Al pushear `master` corren automaticamente:
  - `deploy.yml`: build con `BASE_PATH=/` y `SITE_URL=https://escuadron71.co`, despliega a
    GitHub Pages (secrets `DISCORD_BOT_TOKEN`/`DISCORD_GUILD_ID` ya configurados).
  - `release.yml`: patch bump de `package.json` + tag `vX.Y.Z` + CHANGELOG + commit
    `chore(release): vX.Y.Z [skip release]`.
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
- Tienda: los filtros "Novedad" y "Mayor descuento" requieren campos nuevos `nuevo: boolean` y
  `precioAnterior?: number` por producto.
- Postulacion: implementacion Supabase con **guia paso a paso** (el encargado es Frontend y esta
  aprendiendo Backend). Entregar tambien documentacion escrita.
- Email: se mantiene la cuenta Gmail; solo se habilita **forwarding** de `hola@escuadron71.co`
  → Gmail (guia paso a paso, sin migracion).
- Dashboards (admin/usuario): **React SPA standalone (Vite)** en repos privados del org; en el
  repo web solo se deja un archivo explicativo.
- **WP4 (planificador DCS): STANDBY.** NO mergear la rama `plannerDCS` hasta terminar el
  desarrollo. El stub `/planificador` queda como esta.

## Work Packages

### WP2 — Tienda eCommerce-lite  [PROXIMO]

Objetivo: evolucionar `/tienda` hacia un catalogo con experiencia eCommerce-lite, manteniendo
el checkout por WhatsApp (sin carrito ni pasarela).

Requisitos (confirmados):
- **Vista grid / vista linea** (toggle sin librerias, vanilla TS como `/multimedia`).
- **Buscador** por coincidencia (nombre, descripcion, categoria, especificaciones).
- **Filtros**: Alfabetico (A-Z), Precio (asc/desc), Novedad, Mayor descuento.
- **Breadcrumb** en `/tienda/[slug]`: `Tienda / Categoria / Producto`.
- Campos nuevos por producto: `nuevo: boolean`, `precioAnterior?: number` (para Novedad y
  Mayor descuento). Poblarlos en `src/data/store/products.json`.

Archivos:
- `src/types/store.ts` (extender `Product`).
- `src/data/store/products.json` (nuevos campos).
- `src/lib/store/whatsapp.ts` + `whatsapp.test.ts` (helper de descuento/`descuentoPct`,
  precio anterior formateado).
- `src/pages/tienda.astro` (toolbar: buscador + filtro + toggle grid/linea; grid agrupada por
  categoria, vista linea plana).
- `src/pages/tienda/[slug].astro` (breadcrumb + precio anterior tachado + badge "Nuevo").
- `src/components/store/ProductCard.astro` (badges, precio tachado, clase de vista linea).
- `src/styles/pages/_store.scss` (toolbar, toggle, select, lista, breadcrumb).

Validacion: `pnpm check`, `pnpm test`, `pnpm build`; commit en ingles y push a `dev`.

### WP3 — Cursos CR1 por aeronave

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

### WP4 — Planificador DCS  [STANDBY]

- No desarrollar ahora. No mergear `plannerDCS`.
- Cuando se retome: revisar `.opencode/plans/` y la rama `plannerDCS` (21 commits unicos,
  FlightPlanner, plugins de airfields). El stub `/planificador` queda publicado.

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
3. Para publicar: `git fetch origin`, stash de cambios ajenos, `git checkout master`,
   `git merge --ff-only dev`, `git push origin master` (dispara deploy + release), volver a `dev`
   y `git stash pop`.
