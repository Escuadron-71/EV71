# feat/fleet — Flota: vista por aeronave con pilotos

## Objetivo

Crear la seccion **Flota** del escuadron:
- `/flota` — indice con cards de cada aeronave.
- Una vista por aeronave (`/flota/[slug]`) con: informacion de la nave (specs, rol,
  armamento), **pilotos que la operan**, y enlace al modulo oficial en DCS.

## Decision sobre libreria de datos de aeronaves

No existe una API publica oficial de DCS para specs/armamento/instrucciones. Lo verificado:
- `dcs-mission-maker` (npm): expone `ME_DB` (Mission Editor DB) con nombre, pais, tareas y
  roles por aeronave (utilizable en build-time para campos factibles).
- `pydcs` `weapons_data.py`: catalogo de armamento.
- Paginas de modulo en `digitalcombatsimulator.com` como fuente de specs (sin API).

**Decision:** datos **curados** en `src/data/fleet/` (JSON por aeronave), sin libreria runtime.
Opcional: enriquecer en build-time con `ME_DB` (como el patron `airfields-extract`).

## Modelo de datos

`src/data/fleet/aircraft.json` (array) por aeronave:
- `slug`, `nombre`, `codigo` (F-16C, F/A-18C, C-130H...), `rol` (caza, ataque, transporte, helo),
- `pais`, `tareas` (CAP, CAS, SEAD...), `velocidadMax`, `radio`, `tripulacion`,
- `armamento` (lista resumida), `imagen`, `moduloOficialUrl`,
- `pilotos` (callsigns/pilotos que la operan; fuente: datos del escuadron).

## Fases / Subfases

### Fase 1 — Datos
1. `src/data/fleet/aircraft.json`: aeronaves actuales del escuadron
   (F-16C, F/A-18C, C-130H, A-10C, F-15C, CH-47, UH-1H, UH-60 y las que confirme el equipo).
   Pilotos por aeronave: pedir al equipo la lista real (o dejarla `[]` con nota "pendiente").
2. `src/data/fleet` con tipos TS (`src/types/fleet.ts`).

### Fase 2 — Indice de flota
1. `src/pages/flota.astro`:
   - Grid de cards por aeronave (imagen, nombre, codigo, rol, badge).
   - Filtro por rol (client-side solo si hay muchos; si son <10, ordenar por categoria).
   - CTA por card → `/flota/[slug]`.
2. `src/styles/pages/_fleet.scss`.

### Fase 3 — Vista por aeronave
1. `src/pages/flota/[slug].astro` con `getStaticPaths()` desde `aircraft.json`:
   - Header: imagen, nombre/codigo, rol, badges (pais, tareas).
   - Tabla de especificaciones (velocidad, radio, tripulacion, armamento).
   - Seccion "Pilotos del escuadron" (grid de callsigns o cards).
   - Enlace "Modulo en DCS" → `moduloOficialUrl` (`target="_blank"`, `rel="noopener"`).
   - Rutas desconocidas → 404 (o redireccion al indice).

### Fase 4 — SEO, accesibilidad y validacion
- `title`/`description` por aeronave (SEO importante: busquedas tipo "Escuadron 71 F-16").
- `alt` en imagenes, contraste, focus visible.
- `pnpm check`, `pnpm build`, `pnpm preview` (200 en indice y cada aeronave).

## Archivos a crear/modificar

- `src/data/fleet/aircraft.json`, `src/types/fleet.ts`
- `src/pages/flota.astro`, `src/pages/flota/[slug].astro`
- `src/components/fleet/AircraftCard.astro`, `AircraftSpecs.astro`, `PilotList.astro`
- `src/styles/pages/_fleet.scss`
- (Opcional) `backend/scripts/fleet-extract/` (gitignored) para enriquecer con ME_DB
- `AGENTS.md` (seccion Flota)

## Criterios de validacion

- `pnpm check` 0 errores, `pnpm build` OK, HTTP 200 en indice y vistas por aeronave.
- Pilotos por aeronave con datos reales (o `[]` + nota si el equipo no los confirma).
- Ninguna libreria runtime de datos de aeronaves.

## Merge target

- PR a `dev`. Fusionar tras `feat/header-navigation` (menu → `/flota`).
