# feat/academia — Landing AVVA71, cursos y lista de instructores

## Objetivo

Crear la seccion **Academia** del escuadron:
- `/academia/avva71` — Landing que muestra los diferentes cursos que ofrece el escuadron.
- Una vista por curso: `/academia/curso-fr1`, `/academia/curso-cr1`,
  `/academia/curso-cr2`, `/academia/curso-cr3`.
- `/academia/instructores` — "team" de instructores actuales del escuadron.

## Modelo de datos

- Contenido de cursos en **content collection `courses`** (patron ya usado con `docs`
  en `src/content.config.ts`): frontmatter con titulo, slug, codigo (FR1/CR1/CR2/CR3),
  nivel (Basico/Avanzado), duracion, prerrequisitos, modulos, resumen, orden.
- Instructores en `src/data/academia/instructors.json` (nombre, callsign, roles,
  aeronave principal, imagen o iniciales, bio corta).
- No hardcodear textos de cursos en la pagina (editar el `.md` correspondiente).

## Fases / Subfases

### Fase 1 — Coleccion de cursos y datos
1. `src/content.config.ts`: anadir collection `courses` con `glob()` sobre
   `src/assets/courses/*.md`.
2. Crear 4 documentos de curso: `curso-fr1.md`, `curso-cr1.md`, `curso-cr2.md`,
   `curso-cr3.md` (contenido inicial institucional, editable por la direccion).
3. `src/data/academia/instructors.json` (lista inicial real del escuadron; pedir datos
   al equipo si no estan disponibles).

### Fase 2 — Landing AVVA71
1. `src/pages/academia/avva71.astro`:
   - Hero con identidad de la academia (estilo militar/aeronautico, colores de marca).
   - Grid de **cards de cursos** (por orden/duracion): codigo, nombre, nivel, resumen,
     badge de estado (activo/proximamente), link a la vista del curso.
   - Seccion "Como ingresar" breve con CTA a `/postulacion`.
2. `src/styles/pages/_academia.scss` (importado por las paginas de la seccion).

### Fase 3 — Vista de curso individual
1. `src/pages/academia/curso-[slug].astro` (o `[...slug].astro` con getStaticPaths):
   - Header del curso (codigo, nombre, nivel, duracion, badges).
   - Contenido desde el `.md` (renderizado via content collection).
   - Bloque de prerrequisitos y modulos/aeronaves.
   - CTA "Postulate" + retorno a la lista de cursos.

### Fase 4 — Lista de instructores
1. `src/pages/academia/instructores.astro`:
   - Grid tipo "team": avatar/iniciales, callsign, nombre, roles, aeronave principal.
   - Accesible (alt, contraste) y responsive (2-3 columnas desktop, 1 movil).
   - CTA inferior "Quiero ser parte del equipo" → `/postulacion`.

### Fase 5 — SEO, accesibilidad y validacion
- `title`/`description` por pagina (AVVA71 + cada curso + instructores).
- Enlaces de la rama `feat/header-navigation` apuntando a estas rutas.
- `pnpm check`, `pnpm build`, `pnpm preview` (200 en todas las rutas).

## Archivos a crear/modificar

- `src/content.config.ts` (collection `courses`)
- `src/assets/courses/curso-fr1.md`, `curso-cr1.md`, `curso-cr2.md`, `curso-cr3.md`
- `src/data/academia/instructors.json`
- `src/pages/academia/avva71.astro`, `src/pages/academia/instructores.astro`,
  `src/pages/academia/curso-[slug].astro`
- `src/components/academia/CourseCard.astro`, `InstructorCard.astro`
- `src/styles/pages/_academia.scss`
- `AGENTS.md` (seccion Academia)

## Criterios de validacion

- `pnpm check` 0 errores, `pnpm build` OK, HTTP 200 en AVVA71, 4 cursos e instructores.
- Los textos de curso se editan via `.md`, no en la pagina.
- Instructores con datos reales (o marcados como pendientes de confirmar).

## Merge target

- PR a `dev`. Fusionar tras `feat/header-navigation` (rutas del menu).
