# feat/testing — Infraestructura de Testing (Vitest)

## Objetivo

El proyecto acumula muchas funcionalidades (planner, dogfight, sync de eventos, servicios)
sin ningun test automatizado. Esta rama instala la infraestructura de testing y cubre con
tests unitarios la logica pura existente (`src/lib/**`), creando una red de seguridad para
todas las ramas de features posteriores.

## Alcance

- Instalar **Vitest** como runner de tests.
- Configurar `vitest.config.ts` con alias `@/` → `src/` (coherente con `tsconfig.json`).
- Anadir script `test` en `package.json` (`vitest run`) y `test:watch` (`vitest`).
- Definir en `tsconfig.json` los tipos de Vitest (`"types": ["vitest/globals"]`) si se usan
  globals; en su defecto imports explicitos (`import { describe, it, expect } from "vitest"`).
- Escribir tests unitarios para los modulos puros existentes.

## Fases / Subfases

### Fase 1 — Setup del runner
1. `pnpm add -D vitest`.
2. Crear `vitest.config.ts` reutilizando alias de `tsconfig.json` (extenderlo si es posible).
3. Anadir scripts de `package.json`.
4. Verificar con un test "humo" (`src/lib/__tests__/smoke.test.ts`) que el runner funciona.

### Fase 2 — Tests de logica pura (cobertura inicial)
Escribir tests para los modulos SSR-safe que no dependen de `window`/DOM:

1. `src/lib/base-url.ts` — `resolvePath`, `getBase` (rutas internas con y sin `BASE_PATH`).
2. `src/lib/planner/navigation.ts` — funciones puras de navegacion:
   - `haversineNm`, `initialBearing` (gran circulo), `rhumbLineBearing` (loxodromica).
   - `eteMinutesForLeg`, `cumulativeEteMinutes`, `etaMinutesPerWaypoint`, `departureMinutesForTot`, `requiredSpeedKt`.
   - Formateadores: `formatHeading`, `formatDistNm`, `formatEte`, `formatZuluClock`, `parseZuluClock`, `clampMinutesToDay`.
   - Caso de referencia conocido: Siria Latakia→Palmira GC ~114.1°, Loxo ~114.9°, ~137 NM.
3. `src/lib/planner/aircraft.ts` — catalogo de aeronaves (9 perfiles, velocidad editable).
4. `src/lib/planner/theaters.ts` — bounds de teatros y sanity check Senaki (42.2409, 42.0480).
5. Plugins de planner:
   - `sam-rings/sams.ts` — radios por sistema (1 NM = 1852 m).
   - `comms/comms.ts` — `bandForFrequency` (VHF AM 118-137, UHF 225-400, FM 30-88).
   - `bullseye/bullseye.ts` — `braaFromBullseye`, `formatBraa`.
   - `brevity/brevity.ts` — set inicial de 20 codigos.
6. `src/lib/services/event-service.ts` — lectura de `latest.json` y `getUpcomingEvents()`/`getNextEvent()`.
7. `src/lib/sync/core/normalizers/event-normalizer.ts` y `adapters/discord/transformers/event-transformer.ts` — normalizacion de eventos.
8. `src/lib/sync/core/storage/json-storage.ts` — lectura/escritura de snapshots (si es testeable sin IO).

### Fase 3 — Integracion a CI (opcional pero recomendada)
- Anadir paso `pnpm test` al workflow `deploy.yml` (o crear `test.yml`) para que cada PR valide tests.
- Fallback: al menos documentar en AGENTS.md que la validacion es `pnpm check && pnpm build && pnpm test`.

### Fase 4 — (Opcional, post-merge) Component testing
- Evaluar `@testing-library/react` + `@vitest/browser`/jsdom para los islands que no usan Leaflet
  (p. ej. `UserDropdown`, `ReorderableList`, `CommList`, `BrevityList`).
- Fuera de alcance de esta rama salvo decision explicita.

## Archivos a crear/modificar

- `vitest.config.ts` (nuevo)
- `package.json` (scripts `test`, `test:watch`; devDep `vitest`)
- `pnpm-lock.yaml` (generado por pnpm)
- `src/lib/**/__tests__/*.test.ts` (nuevos)
- `.github/workflows/` (CI opcional)
- `AGENTS.md` (seccion Testing)

## Criterios de validacion

- `pnpm test` verde (todos los tests pasan).
- `pnpm check` 0 errores.
- `pnpm build` OK.
- No usar `window`/`document` en los modulos bajo test (SSR-safe).

## Merge target

- PR a `dev`. Esta rama se fusiona **primero** (red de seguridad para las demas).
