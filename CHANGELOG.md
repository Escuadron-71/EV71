# Changelog

Todas las notas de version del proyecto **EV71 PageWeb** se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y el proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

Las entradas de cada release se generan automaticamente a partir de los commits publicados en `master` (workflow `release.yml`).

## [0.1.0] - 2026-08-04

### Agregado

- Paginas institucionales bajo `/nosotros`: Mision y Vision, Declaracion, Objetivos, Reglamento, Historia y Estructura, construidas desde los documentos en `src/assets/docs/`.
- Dropdown "Nosotros" en el header con acceso a las nuevas paginas institucionales.
- Content collections (`src/content.config.ts`) para renderizar los documentos `.md` en tiempo de build.
- Workflow `release.yml`: versionado automatico (tag, release y numero de version) en cada publicacion a `master`.
- `CHANGELOG.md` como registro de versiones del proyecto.

[0.1.0]: https://github.com/Escuadron-71/EV71/releases/tag/v0.1.0

## [0.1.1] - 2026-08-09

### Agregado
- feat(content): add blog and news collections with real article detail pages
- feat(navigation): replace multimedia dropdown with flat links and add blog/news
- feat(donations): build donations page with platforms grid
- feat(donations): add platforms data, types and icons
- feat(store): build catalog and product pages with whatsapp checkout
- feat(store): add product data, types and whatsapp helpers
- feat(blog-news): build blog and news listing pages
- feat(blog-news): add post and news data fields
- feat(fleet): build fleet index and aircraft detail pages
- feat(fleet): add curated aircraft data and types
- feat(academia): build AVVA71 landing, course pages and instructors
- feat(academia): add courses collection, documents and instructor data
- feat(multimedia): build page with tabs, search and cards
- feat(multimedia): add dummy data, types and search service
- feature(header): Fix some styles and delete repetitive option 'Postulate'
- feat(stubs): add placeholder pages for pending routes
- feat(header): add two-level navigation with sticky subnav
- feat(header): turn Nosotros into dropdown with institutional links
- feat(nosotros): add institutional document pages
- feat(home): featured event image fills 40%/full-height with 60% content
- feat(sync): real Discord events with interested count, sync schedule, expandable cards
- feat: refactor dogfight a King of the Hill con drag & drop, match view, podium, export PNG e instrucciones
- feat(pages): integrar featured event en Home y nueva pagina /operaciones
- feat(ui): componentes EventCard y EventList con estilos
- feat(data): datos dummy de eventos y servicio de lectura
- feat(sync): modulo de sincronizacion de eventos desde Discord
- feat(404): implementar vista MFD tactico con radar animado
- feat(login): reimplementar vista de login con tabs, video y formularios
- feat(header): sistema de dropdowns reutilizable con animacion HUD
- feat(page): crear pagina de login con Icon
- feat(component): extraer Footer a componente modular con Icon
- feat(component): crear componente Icon para SVG inline reutilizable
- feat(deploy): add GitHub Pages workflow with base path support
- feat(header): redesign nav with responsive hamburger and underline hover
- feat(styles): migrate color palette and typography to client-defined system
- feat(pages): rewrite postulacion form and sivoe71
- feat(pages): rewrite index with full landing content
- feat(config): integrate TailwindCSS v4 + SCSS in layout
- feat(styles): add component, layout and page SCSS partials
- feat(styles): add SCSS 7-1 architecture

### Corregido
- fix(style): Update style for 100% of widthimage
- fix(sync): correct type-only import in unused event service
- fix(header): highlight active nav item by current route
- fix(events): preserve Discord line breaks in event descriptions
- fix(dogfight): dynamic canvas height and compact podium stats in PNG export
- fix(events): serve full-resolution Discord event images
- fix(sync): schedule auto deploy at Colombia time and drop duplicate cron
- fix: cerrar dropdowns al abrir otro, corregir panel siempre visible en mobile, reestructurar navegacion
- fix(ci): configurar dominio personalizado escuadron71.co
- fix(postulacion): deshabilitar boton de envio y agregar resolvePath
- fix(styles): aplicar patron picture+z-index con Tailwind en secciones con imagen
- fix(config): implementar base path universal via dotenv
- fix(page): eliminar footer duplicado en index.astro
- fix(component): agregar import faltante de Icon en Header.astro
- fix(deploy): migrar Icon.astro de fs a import.meta.glob para prerender en CI
- fix(deploy): externalizar node:fs y node:path en SSR para prerender en CI
- fix: use env-based base path for dev/prod compatibility
- fix: prefix all asset paths with base URL for GitHub Pages subpath
- fix(deploy): remove base path prefix to fix broken image routes
- fix(ci): trigger deploy on master only
- fix(ci): upgrade actions and remove pnpm version conflict
- fix: add favicon to site head
- fix(layout): add container utility, fix hero centering and mobile nav

### Documentacion
- docs: add work package roadmap for continuity
- docs: document donations page conventions
- docs: document store section conventions
- docs: document blog and news pages conventions
- docs: document fleet section conventions
- docs: document academia section conventions
- docs: document multimedia page tabs and search
- docs: document two-level header navigation convention
- docs: document vitest validation workflow in AGENTS.md
- docs(plans): add per-branch roadmap plans and lock postulacion to supabase
- docs: add roadmap plan index and test command to AGENTS.md
- docs(nosotros): refine institutional document wording
- docs: add CHANGELOG and versioning documentation
- docs: add MILESTONES.md with pending corrections and roadmap
- docs: documentar modulo Dogfight en README, ABOUT y AGENTS
- docs: actualizar documentacion del proyecto
- docs: actualizar ABOUT.md con colores y tipografia correctos
- docs: actualizar AGENTS.md con stack real del proyecto
- docs: add commit granularity directive to AGENTS.md
- docs: pull origin from master

### Estilos
- style(nosotros): add markdown table styles to document pages
- style(event-cards): refine featured event image rendering

### Mantenimiento
- chore(docs): add layout for courses
- chore(header): remove dead mobile CTA styles and update docs
- chore(docs): un-ignore and commit institutional markdown sources
- chore(git): ignore /src/assets/docs directory
- chore(assets): agregar video ev71-dcs.webm para login
- chore: update some paths, title and general info
- chore: remove tracked .astro/ generated files
- chore: add .astro/ and nul to gitignore
- chore(assets): replace ev71.jpg with logo.png
- chore: cleanup legacy files and update documentation

### CI
- ci(release): force-with-lease push of release branch to handle stale branches
- ci(release): publish version bump via branch and PR instead of direct push to master
- ci(release): automate versioning, tags and releases

### Datos
- data(events): snapshot now with better resolution
- data(events): update Discord events sync snapshot

### Otros
- Merge pull request #17 from Escuadron-71/dev
- Merge pull request #16 from Escuadron-71/dev
- Merge pull request #15 from Escuadron-71/dev
- merge: feat/testing into dev (vitest unit tests)
- test: cover sync pipeline and event service with unit tests
- test: add vitest runner config and smoke test
- Merge pull request #14 from Escuadron-71/dev
- Merge pull request #13 from Escuadron-71/dev
- Merge pull request #12 from Escuadron-71/dev
- Merge pull request #11 from Escuadron-71/dev
- Merge pull request #10 from Escuadron-71/dev
- Merge pull request #9 from Escuadron-71/dev
- Merge pull request #8 from Escuadron-71/dev
- Merge pull request #7 from Escuadron-71/dev
- Merge pull request #6 from Escuadron-71/dev
- refactor(styles): eliminar background-image de SCSS y modularizar estilos
- Merge pull request #5 from Escuadron-71/dev
- Merge pull request #4 from Escuadron-71/dev
- Merge branch 'master' into dev
- refactor(styles): crear placeholder %main y mejorar reset
- refactor(assets): reorganizar iconos SVG en carpeta dedicada
- Merge pull request #3 from Escuadron-71/dev
- Merge pull request #2 from Escuadron-71/dev
- pull originn dev
- refactor astro .  build
- Merge pull request #1 from Escuadron-71/dev
- refactor: Rerange all file to master for developing
- init: init project
- Initial commit


## [0.1.2] - 2026-08-09

### Agregado
- feat(store): redesign catalog with flat layout and friendly toolbar
- feat(store): add catalog toolbar with search, sorting and grid/list toggle

### Otros
- Merge pull request #19 from Escuadron-71/dev


## [0.1.3] - 2026-08-13

### Agregado
- feat(planner): port DCS flight planner from plannerDCS branch
- feat(academia): split CR1 into F-16C and F/A-18C courses

### Documentacion
- docs(plans): add planner work package and update roadmap state

### Mantenimiento
- chore(version): align dev package.json to v0.1.2

### Otros
- Merge pull request #21 from Escuadron-71/dev

