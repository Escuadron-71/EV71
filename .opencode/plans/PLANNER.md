# feat/planner-dcs — Planificador de vuelo DCS (port desde plannerDCS)

## Objetivo

Reactivar el **Planificador de Vuelo** de DCS World en `/planificador`, reemplazando el
stub publicado. Se integra como **React Island** (`FlightPlanner` con `client:load`) sobre
un mapa Leaflet 2D con logica de planificacion en `src/lib/planner/**` (SSR-safe).

Fuente: rama `feat/plannerDCS` (21 commits unicos, ~+6133 lineas). Se porta **solo la
feature** (archivos del planner + fix de hidratacion de `DogfightApp`), nunca un merge crudo
para evitar arrastrar ruido (deletes de `ABOUT.md`/`IMA.md`/`MILESTONES.md`, snapshots de
eventos, commits de gitignore).

## Alcance

- **Portado e integrado (Fases 1-3):**
  - B6 — TOT (Time on Target)
  - B8 — Nav log / ETA (tabla de tramos con ETE/ETA Zulu)
  - B1 — SAM Rings (SA-2/SA-6/SA-10, circulos de deteccion y disparo)
  - B9 — Drag & Drop complejo: Bullseye/BRAA, COMM frequencies, Brevity codes
  - B3 — Bases aereas (airfields: frecuencias ATC, pistas; TACAN/ILS pendientes de datos)
  - B7 — Data Cards / KneeBoards (PNG 512x512 via Canvas API)
- **Pendiente (Fases 4-8):** ver tabla de pendientes abajo.

## Arquitectura

```
src/
  islands/
    FlightPlanner.tsx              # Island principal (Leaflet, estado, capas)
    planner/widgets/               # PlannerBlock, ToolSelector, ReorderableList,
                                   # BrevityList, CommList, KneeboardExport
  lib/planner/
    aircraft.ts, theaters.ts, navigation.ts, kneeboard.ts
    plugins/
      sam-rings/    # B1 — circulos de alcance
      bullseye/     # B9 — BR por waypoint
      comms/        # B9 — frecuencias
      brevity/      # B9 — codigos (lista editable; data, no codigo)
      airfields/    # B3 — aerodromos Caucaso(21)+Siria(79) extraidos de pydcs
      map-layers/   # capas base del mapa
  pages/planificador.astro         # reemplaza stub; BaseLayout + client:load
  styles/pages/_planificador.scss  # estilos del planner (por pagina)
```

Dependencias nuevas: `leaflet@^1.9.4`, `@types/leaflet@^1.9.22`. `proj4` se uso solo en
build (script `backend/scripts/airfields-extract/extract.mjs`, **gitignored**); no es
dependencia runtime. Persistencia en `localStorage` (`ev71-planner-state`, backward-compat
en `loadState()`).

## Tabla de pendientes (B1-B10)

| ID | Descripcion | Fase | Estado |
|----|-------------|------|--------|
| B6 | TOT: fijar hora de llegada al waypoint de ataque | Fase 1 | Implementado |
| B8 | Nav log / ETA: tramos con ETE/ETA Zulu | Fase 1 | Implementado |
| B1 | SAM Rings: circulos de deteccion y disparo | Fase 1 | Implementado |
| B9 | Drag & Drop complejo: bullseye/BRAA, COMM, brevity | Fase 2 | Implementado |
| B3 | Bases aereas: ATC, pistas, ILS/TACAN | Fase 3 | Implementado |
| B7 | Data Cards / KneeBoards | Fase 3 | Implementado |
| B10 | Drag & Drop simple: imagenes/textos y runway diagrams | Fase 4 | Pendiente |
| B4 | Lineas de Frente (FEBA/FLOT) | Fase 4 | Pendiente |
| A1 | Mapa real de DCS / recuadro del teatro (opcion simple) | Fase 4 | Pendiente |
| E1 | Exportar/importar mision en DCS (.miz/.lua) — Fase 1 | Fase 5 | Pendiente |
| C1 | Compartir Ruta via URL unica (HASH json) | Fase 6 | Pendiente |
| B5 | Calculo de Combustible Estimado | Fase 6 | Pendiente |
| B2 | Objetivos enemigos y aliados | Fase 7 | Pendiente |
| E1 | .miz/.lua — Fase 2 | Fase 8 | Pendiente |
| A1 | Mapa real de DCS (avanzado) | Fase 8 | Pendiente |
| C2 | Multiplayer Planner (tiempo real) | Fase 8 | Descartado temporalmente |
| D1 | Libreria de Misiones y Campanas EV71 | Fase 8 | Descartado temporalmente |

## Limitaciones conocidas

- pydcs no entrega frecuencias ILS ni canales TACAN (UI muestra "—"); el schema conserva
  los campos para enriquecimiento futuro (JSON manual por aerodromo).
- Planner 2D: sin altitud/aspecto (BR desde bullseye unicamente; sin PICTURE desde el WP).
- Aircraft data y theaters son los portados; verificar contra la lista oficial del escuadron
  en una fase posterior.

## Criterios de validacion

- `pnpm check` 0 errores, `pnpm test` (64 tests), `pnpm build` OK (41 paginas).
- HTTP 200 en `/planificador` con el island hidratado (mapa visible, sin errores de consola).
- El resto de rutas no cambian su conteo de paginas.

## Merge target

- PR a `dev`. Publicacion junto con **WP3 (cursos CR1 por aeronave)** en un solo PR
  `dev → master` (ciclo semanal).
