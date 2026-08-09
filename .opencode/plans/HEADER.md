# feat/header-navigation — Header de 2 niveles, renombres y menu completo

## Objetivo

Reestructurar el header para soportar la navegacion ampliada sin saturar la fila actual.
Decision aprobada por el equipo: **Opcion 1 — Subheader de navegacion (2 niveles)**.

## Decision de diseno

- **Fila superior:** logo a la izquierda; a la derecha CTA "POSTULATE" + UserDropdown.
  No es sticky (se va con el scroll).
- **Segunda fila (subheader):** navbar con todos los enlaces. **Es sticky** para minimizar
  el costo vertical y mantener la navegacion siempre accesible.
- **Movil:** se conserva el hamburguesa actual (menu desplegable full-width bajo el header),
  ahora con todos los items incluidos.

## Renombres

- "Actividades" → **"Herramientas"** (dropdown con Dogfight + Planificador).
- "Galeria" (link plano) → **"Multimedia"** (dropdown con 5 sub-items, apuntando a
  `/multimedia#documentos|galeria|videos|noticias|blog`).

## Nueva estructura de menu (subheader)

```
Inicio            → /
Operaciones       → /operaciones
Multimedia        → /multimedia#documentos|galeria|videos|noticias|blog
Nosotros          → Quienes somos (#nosotros) · Mision y Vision · Declaracion · Objetivos · Reglamento · Historia · Estructura
Academia          → AVVA71 (/academia/avva71) · Curso Basico FR1 · Curso Basico CR1 · Curso Avanzado CR2 · Curso Avanzado CR3 · Flota (/flota) · Lista de instructores (/academia/instructores) · Ingreso/Login (/login)
Herramientas      → Dogfight (/dogfight) · Planificador (/planificador)
Comunidad         → Tienda (/tienda) · Donaciones (/donaciones)
```

## Fases / Subfases

### Fase 1 — Rutas stub (para que ningun enlace de 404)
Crear paginas minimas (BaseLayout + titulo + `_pages/_stub.scss` o clases inline) para:
- `/multimedia`
- `/academia/avva71`, `/academia/curso-fr1`, `/academia/curso-cr1`, `/academia/curso-cr2`, `/academia/curso-cr3`, `/academia/instructores`
- `/flota` (+ subrutas por aeronave en la rama feat/fleet; aqui solo `/flota`)
- `/tienda`, `/donaciones`
- `/blog`, `/noticias`
Cada stub: `title` correcto, `description` SEO, enlace de retorno al home.

### Fase 2 — Refactor del Header
1. `src/components/Header.astro`:
   - Estructura de 2 filas: `.header-top` (brand + acciones) y `.header-subnav` (nav).
   - Extraer la lista de items a un array de config `NAV` (o `src/lib/navigation.ts`) reutilizable:
     items planos + dropdowns con `items` (label, href, separator).
   - Mantener `resolvePath()` en todos los hrefs.
   - Actualizar `isCurrent` para sub-rutas (resaltar dropdown padre si hay coincidencia de prefijo).
2. `src/styles/layout/_header.scss`:
   - `.header-top` (altura ~64-72px, logo + acciones).
   - `.header-subnav` sticky: `position: sticky; top: 0; z-index` por debajo del top en scroll,
     o el subnav sticky y el top no. Fondo `rgba($primary-dark, 0.92)` + blur (igual que hoy).
   - Ajustar `.main-nav a` (altura ahora del subheader, ~48-52px), underline hover/active.
   - Dropdowns: paneles existentes (`nav-dropdown`) se mantienen; revisar ancho max y overflow
     si "Academia" crece mucho.
   - Responsive: en `max-width: 1024px` (breakpoint-lg) ocultar subheader plano y mostrar
     hamburguesa con menu completo (todos los items + dropdowns en acordeon).

### Fase 3 — Accesibilidad
- `aria-label` correctos, `aria-haspopup`, `aria-expanded` en triggers.
- Cerrar dropdowns con Escape y click fuera (ya implementado; verificar con la nueva estructura).
- `aria-current="page"` en el item activo.
- Foco visible (focus ring) en items del subheader.

### Fase 4 — Limpieza
- Eliminar referencias muertas a anclas que dejan de existir en el menu
  (p. ej. si "Galeria" deja de apuntar a `/#galeria`, evaluar si la seccion del home se conserva).
- Verificar que el CTA movil (`POSTULATE` via `.main-nav::after`) siga funcionando.

## Archivos a crear/modificar

- `src/components/Header.astro` (refactor 2 niveles)
- `src/lib/navigation.ts` (nuevo: config central del menu; evaluar si aplica)
- `src/styles/layout/_header.scss` (subheader, sticky, responsive)
- `src/styles/pages/_stub.scss` (nuevo, estilos de paginas placeholder)
- `src/pages/multimedia.astro`, `src/pages/academia/*.astro`, `src/pages/academia/instructores.astro`,
  `src/pages/flota.astro`, `src/pages/tienda.astro`, `src/pages/donaciones.astro`,
  `src/pages/blog.astro`, `src/pages/noticias.astro` (stubs)
- `AGENTS.md` (estructura del menu y convencion de header)

## Criterios de validacion

- `pnpm check` 0 errores.
- `pnpm build` OK; `pnpm preview` HTTP 200 en cada ruta nueva.
- Sin 404 en ningun enlace del header (desktop y movil).
- Subheader sticky en desktop; hamburguesa con menu completo en movil.
- Todos los hrefs usan `resolvePath()`.

## Merge target

- PR a `dev`. Depende de la rama `feat/testing` (si se fusiona primero) solo para
  conveniencia; no es bloqueante.
