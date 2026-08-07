# feat/blog-news — Vistas base para Blog y Noticias

## Objetivo

Crear las vistas base `/blog` y `/noticias` **sin funcionalidad real** (estructura y
layout listos), de modo que los enlaces del header no den 404 y la arquitectura quede
preparada para contenido futuro (content collection). El contenido inicial es estatico
en `src/data/`, reemplazable por un pipeline/API cuando exista.

## Alcance

- NO es CMS. Solo listas de ejemplo + layout tipografico de entrada.
- Estructura preparada para mover a **content collection `posts`/`news`** despues
  (mismo patron que `docs` y `courses`).

## Fases / Subfases

### Fase 1 — Datos base
1. `src/data/blog/posts.json` — 2-3 posts dummy institucionales (titulo, fecha, resumen,
   categoria, slug, autor). Marcados como ejemplo.
2. `src/data/news/items.json` — 2-3 noticias dummy (titulo, fecha, resumen, enlace/fuente).

### Fase 2 — Vista Blog
1. `src/pages/blog.astro`:
   - Encabezado de seccion + grid de tarjetas de post (titulo, fecha, categoria, resumen).
   - Estado "Proximamente" / aviso de contenido de ejemplo.
   - Layout de listado listo para paginar luego.
2. `src/styles/pages/_blog.scss`.

### Fase 3 — Vista Noticias
1. `src/pages/noticias.astro`:
   - Lista/timeline de noticias (fecha, titulo, resumen, fuente).
   - Nota de que el contenido real provendra de Discord/multimedia cuando el pipeline exista.
2. Compartir estilos base con blog (`_blog.scss` o componentes reutilizables
   `PostCard.astro`, `NewsItem.astro`).

### Fase 4 — (Opcional) Integracion con Multimedia
- Las tabs de `/multimedia` (Noticias/Blog) pueden reutilizar los mismos datos
  (`src/data/blog`, `src/data/news`) en la rama `feat/multimedia-hub`.

## Archivos a crear/modificar

- `src/data/blog/posts.json`, `src/data/news/items.json`
- `src/pages/blog.astro`, `src/pages/noticias.astro`
- `src/components/blog/PostCard.astro`, `NewsItem.astro`
- `src/styles/pages/_blog.scss`
- `AGENTS.md` (seccion Blog/Noticias)

## Criterios de validacion

- `pnpm check` 0 errores, `pnpm build` OK, HTTP 200 en `/blog` y `/noticias`.
- Ningun enlace roto desde el header.
- Contenido marcado como ejemplo/dummy (evitar que parezca contenido real).

## Merge target

- PR a `dev`. Independiente; puede fusionarse antes o despues de `feat/multimedia-hub`.
