# AI_CONTEXT — Planificador de Vuelo (EV71)

Contexto persistente para sesiones de IA sobre el **Planificador de Vuelo y Cartas de Navegación 2D** (`/planificador`). Guardado en la rama `plannerDCS`. Objetivo: que cualquier sesión futura retome sin perder información (el usuario trabaja con presupuesto de tokens limitado).

## Objetivo comercial

- Generar **tráfico orgánico / SEO**: pilotos DCS de Sudamérica y España usan la herramienta y permanecen en el sitio.
- El **island React es client-side, NO indexable** — el contenido estático alrededor de la app (FAQ, títulos, meta, sitemap) es el que aporta SEO. Priorizar ese contenido.
- Herramienta de referencia del dominio: **VATSIM** (https://vatsim.net/) — red online de aviación virtual con flight plans.

## Alcance aprobado (sesión 2)

1. Crear `AI_CONTEXT.md` (este archivo).
2. Plugin `map-layers`: fix capa Topo y agregar capas Mapa/Híbrido con etiquetas.
3. Mover HUD a la izquierda en desktop (layout **flex**: HUD columna | mapa | panel derecho); móvil conserva flujo vertical.
4. Ampliar catálogo de aeronaves (opcional).

## Arquitectura de plugins aprobada

```
src/lib/planner/plugins/<name>/   # Logica + datos, SSR-safe, sin window, sin proj4 runtime
  index.ts                        # Barrel de re-export
  layers.ts / <modulo>.ts         # Tipos y datos
src/islands/planner/widgets/      # Componentes React (futuro)
```

Principios:
- Todo código del Planificador va en la rama `plannerDCS`.
- **proj4 solo en build** (script temporal para convertir coords a lat/lon), nunca en runtime; bounds hardcodeados.
- Validación obligatoria al cerrar sesión: `pnpm check` (0 errores) y `pnpm build`.

## Proyecciones DCS (VEAF/dcs-maps, verificadas con pydcs)

```
Caucasus: "+proj=tmerc +lat_0=0 +lon_0=33 +k_0=0.9996 +x_0=-99516.99999766012 +y_0=-4998115.000001914 +towgs84=0,0,0,0,0,0,0 +units=m +vunits=m +ellps=WGS84 +no_defs +axis=neu"
Syria:    "+proj=tmerc +lat_0=0 +lon_0=39 +k_0=0.9996 +x_0=282801.00000019063 +y_0=-3879866.000000911 +towgs84=0,0,0,0,0,0,0 +units=m +vunits=m +ellps=WGS84 +no_defs +axis=neu"
```

## Bounds de terreno DCS (pydcs) y lat/lon hardcodeados

- Cáucaso: `Rectangle(380000, -560000, -600000, 1130000)`
- Siria: `Rectangle(-320000, -579986, 300000, 579998)`

Lat/lon en `src/lib/planner/theaters.ts`:

| | Cáucaso | Siria |
|---|---|---|
| Terreno completo | N 48.3876 · S 38.8651 · E 47.1423 · W 26.7787 | N 37.7179 · S 31.8473 · E 42.3717 · W 29.8978 |
| Aeródromos | N 45.081 · S 41.611 · W 37.343 · E 45.023 | N 37.458 · S 31.719 · W 32.297 · E 40.178 |

Sanity check: Senaki (42.2409, 42.0480) ✓.

## Servicios de tiles verificados (HTTP 200)

| Capa | URL |
|---|---|
| Esri World Imagery (satélite) | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` |
| Esri World Street Map (calles/nombres) | `.../World_Street_Map/MapServer/tile/{z}/{y}/{x}` |
| Esri World Topo Map (terreno) | `.../World_Topo_Map/MapServer/tile/{z}/{y}/{x}` |
| CartoDB labels-only (overlay Híbrido) | `https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png` |
| ~~OpenTopoMap~~ (DESCARTADA) | Mapa de senderismo, vacío a bajo zoom, política de uso estricta. Reemplazada por Esri World Topo Map. |

## Conceptos de navegación (ya explicados al usuario)

- **Gran Círculo (GC):** ruta más corta sobre la esfera; rumbo cambia continuamente; en Mercator se ve curvo. `initialBearing`.
- **Loxodrómica (LOXO):** rumbo constante; recta en el mapa; distancia ligeramente mayor. `rhumbLineBearing` (equivalente a la regla F10 de DCS).
- Ejemplo Siria Latakia→Palmira: GC 114.1°, Loxo 114.9°, ~137 NM.

## Estado de sesiones

### Sesión 1 (completada — base aprobada y funcional)
- Dependencias: `leaflet@1.9.4`, `@types/leaflet@1.9.22`. `proj4`/`@types/proj4` añadidos temporalmente y **eliminados** tras hardcodear bounds.
- Creados: `src/lib/planner/navigation.ts`, `theaters.ts`, `aircraft.ts`, `src/islands/FlightPlanner.tsx`, `src/pages/planificador.astro`, `src/styles/pages/_planificador.scss`.
- Header: link "Planificador" en Actividades. Docs: README, ABOUT, AGENTS.
- Validación: `pnpm check` y `pnpm build` OK; `/planificador` con leaflet.css y chunk `leaflet-src` code-split; smoke test HTTP 200.

### Sesión 2 (en curso / pendiente)
- Pendiente: plugin map-layers, HUD izquierda (flex), ampliar aeronaves, validación final.

## Archivos relevantes

- `src/islands/FlightPlanner.tsx` — island principal (Leaflet dinámico SSR-safe, persistencia `ev71-planner-state`, WPs click/right-click-remove, divIcon HUD).
- `src/lib/planner/navigation.ts` — funciones puras (haversine, rumbos, ETE, gran círculo, format*).
- `src/lib/planner/theaters.ts` — Cáucaso/Siria con bounds.
- `src/lib/planner/aircraft.ts` — F/A-18C 400, F-16C 450, T-45 350 (+ ampliación pendiente).
- `src/styles/pages/_planificador.scss` — estilos importados por la página (no en main.scss).
- `src/pages/planificador.astro` — BaseLayout + island client:load + leaflet.css + SCSS.
- Patrón React a copiar: `src/islands/DogfightApp.tsx` (loadState, persistencia localStorage, validación).

## Convenciones críticas

- **Leaflet importado dinámicamente** en `useEffect` (`await import("leaflet")`) — el build estático SSR rompe si se toca `window`. Tipos con `import type * as L from "leaflet"`; instancias `L.Map`/`L.LayerGroup`/`L.LeafletMouseEvent`. **No usar iconos por defecto de Leaflet** (rutas rompen con BASE_PATH): usar `L.divIcon` con `planner-marker`.
- UI en español neutro. Colores `$primary #111826`, `$primary-dark #0A0E17`, `$primary-light #202D46`, `$secondary #E8B25C`, `$border rgba(255,255,255,0.08)`. Oswald titulos / Roboto cuerpo.
- Enlaces con `resolvePath()` de `@/lib/base-url`. SCSS por página importado en frontmatter `.astro`.
- Commits en inglés, Conventional Commits, un cambio lógico por commit.

## Datos futuros

- `Airodromes.json` (6MB, proyecto DCS Web Editor): 21 aeródromos Cáucaso / 214 Siria con coords locales x/z (requeriría proj4 en build-time).
- Aeronaves candidatas (crucero realista): A-10C II 300 kt, F-15C 450 kt, F-15E 450 kt, C-130H 290 kt, CH-47F 140 kt, UH-60L 135 kt. Nota: UH-60L/CH-47F/C-130 son mods de comunidad; F-15C es FC3.
- Lo que NO conviene añadir: fuel exacto, clima (fuera de alcance).
