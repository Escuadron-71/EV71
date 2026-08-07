# feat/multimedia-hub — Vista Multimedia (tabs + buscador + Drive + Discord)

## Objetivo

Crear la vista `/multimedia`: un visualizador dividido en **5 pestañas/tabs** con un
**buscador de contenido** arriba. Integra dos APIs: **Google Drive** (Documentos del
escuadron: cartas de navegacion, mapas, guias) y **Discord** (galeria, videos, noticias).
Blog/Noticias se renderizan con contenido base de `src/data/` (la rama `feat/blog-news`
los formaliza como vistas propias).

## Decisiones de integracion

- **Drive:** pipeline **build-time** (patron `sync-events`), NO API key publica en el
  navegador. Script `pnpm sync:drive` + GitHub Action → `src/data/drive/*.json`.
  Se necesita una carpeta compartida publicamente (o service account) y un listado de
  archivos: id, name, mimeType, webViewLink, modifiedTime, folderPath.
- **Discord:** reutilizar `src/lib/sync/adapters/discord/` en build-time (el bot token
  jamas se expone al cliente). Listar canales configurados (galeria/noticias) y sus
  adjuntos/embeds → `src/data/multimedia/*.json`.
- **Busqueda:** filtrar client-side sobre los JSON ya cargados (build-time), sin API runtime.

## Fases / Subfases

### Fase 1 — Estructura de la pagina y tabs
1. `src/pages/multimedia.astro`:
   - Layout de tabs accesible (role="tablist"/"tab"/"tabpanel" o `<details>`), 5 tabs:
     Documentos · Galeria · Videos · Noticias · Blog.
   - Input de busqueda (sticky arriba del visualizador) con `aria-label` y clear button.
   - Estado activo por `?tab=` en la URL (deep-linkable: `/multimedia?tab=galeria`).
2. `src/styles/pages/_multimedia.scss` (importado solo en la pagina).
3. Componentes Astro puros (sin JS): `MultimediaTabs.astro`, `MediaGrid.astro`,
   `DocumentCard.astro`, `MediaCard.astro`, `SearchInput.astro`.

### Fase 2 — Pipeline Google Drive (Documentos)
1. `backend/scripts/drive-extract/` (gitignored, build-time):
   - Script `extract.mjs` (node) que lista la carpeta compartida via Drive API v3
     (service account o API key con carpeta publica), filtra por mimeType
     (PDF, imagen, gsheet, etc.), emite `src/data/drive/documents.json`.
   - `.env`: `GOOGLE_DRIVE_FOLDER_ID`, credenciales (gitignored).
   - `.github/workflows/sync-drive.yml` (workflow_dispatch) → `pnpm sync:drive` + commit.
2. `src/lib/services/drive-service.ts`: lee el JSON y expone `getDocuments()`,
   `searchDocuments(query)`, `getDocumentsByFolder()`.
3. Tab Documentos: grid de tarjetas (nombre, tipo, carpeta, enlace a Drive con webViewLink).

### Fase 3 — Integracion Discord (Galeria / Videos / Noticias)
1. Configurar en `src/lib/sync/config/sources.ts` los canales de multimedia
   (IDs por canal: galeria-imagenes, videos, noticias).
2. Extender `sync-events` (o nuevo `sync-multimedia`) para descargar adjuntos/embeds
   de esos canales → `src/data/multimedia/{galeria,videos,noticias}.json`.
   Nota: imagenes grandes podrian cachearse en `public/assets/multimedia/` (evaluar tamano).
3. Tabs:
   - Galeria: grid de imagenes con lightbox simple (Astro + CSS, sin libreria).
   - Videos: grid de embeds de YouTube/Discord (link con thumbnail).
   - Noticias: lista de entradas (titulo, fecha, resumen, enlace).

### Fase 4 — Busqueda integrada
- Un solo input que filtra sobre documentos + galeria + videos + noticias + blog.
- Resultados agrupados por categoria, con conteo y empty state ("Sin resultados").

### Fase 5 — SEO y accesibilidad
- `title`/`description` por tab via `<head>` dinamico (Astro `<head>`).
- Datos estructurados opcionales; `alt` en todas las imagenes; contraste y focus visible.

## Archivos a crear/modificar

- `src/pages/multimedia.astro`
- `src/styles/pages/_multimedia.scss`
- `src/components/multimedia/*.astro` (Tabs, Search, Grids, Cards)
- `src/lib/services/drive-service.ts`
- `src/data/drive/documents.json` (generado, commit si es necesario para demo)
- `backend/scripts/drive-extract/` (gitignored)
- `src/lib/sync/` (extensiones Discord multimedia)
- `.github/workflows/sync-drive.yml`
- `.env.example` (GOOGLE_DRIVE_FOLDER_ID)
- `AGENTS.md` (seccion Multimedia)

## Criterios de validacion

- `pnpm check` 0 errores y `pnpm build` OK.
- `/multimedia?tab=...` renderiza cada tab; busqueda filtra sin JS en cliente (solo filtrado).
- Ninguna credencial en el repo ni en el bundle.
- HTTP 200 en `/multimedia`.
- Documentos (Drive) y contenido Discord disponibles en build-time (aunque sea dummy).

## Merge target

- PR a `dev`. Depende de la rama `feat/header-navigation` (rutas y menu), fusionarla antes.
