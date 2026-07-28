# ADR-001: Integration Modules Architecture

## Estado

Aceptado (Julio 2026) — Implementacion parcial.

## Contexto

El Escuadron 71 publica contenido en multiples plataformas (Discord, YouTube, Twitch, Google Drive) y necesita reflejar ese contenido en la pagina web de forma automatica y desacoplada. Cada fuente de datos tiene su propia API, formato y frecuencia de actualizacion. Se requiere un patron comun para:

- Extraer datos desde cada fuente externa
- Transformarlos a un formato de dominio uniforme
- Validarlos y almacenarlos localmente en JSON
- Exponerlos al frontend estatico de Astro en tiempo de build

## Arquitectura

```
Fuente externa          Pipeline (GitHub Action)            Web (Astro static)
┌──────────┐           ┌────────────────────────────┐       ┌──────────────┐
│ Discord  │───fetch──▶│ Adapter → Transformer      │       │              │
│ YouTube  │           │          → Normalizer       │──JSON──▶  Astro      │
│ Twitch   │           │          → Storage (JSON)   │       │  Frontend    │
│ Drive    │           └────────────────────────────┘       └──────────────┘
```

Cada Integration Module sigue 4 capas:

### 1. Adapter (`src/lib/sync/adapters/`)

Responsable de la comunicacion con la API externa.
- Autenticacion y manejo de credenciales
- Fetch con retry y backoff exponencial
- Rate limiting
- Parseo de respuesta raw

### 2. Transformer (`src/lib/sync/adapters/*/transformers/`)

Convierte la respuesta nativa de la API al formato de dominio (`DomainEvent`).
- Mapeo de campos especificos de cada fuente
- Limpieza y normalizacion basica

### 3. Core (`src/lib/sync/core/`)

Logica compartida entre modulos:
- **Types:** Schemas Zod para validacion en runtime (`DomainEvent`, `SyncResult`)
- **Normalizer:** Filtrado, deduplicacion y ordenamiento
- **Storage:** Persistencia en JSON con backup historico

### 4. Services (`src/lib/sync/services/`)

Orquestan el pipeline completo:
- `EventSyncService`: Ejecuta adapter → transform → normalize → store
- `EventService`: Lee el JSON almacenado y lo expone al frontend

## Implementacion actual (Julio 2026)

### Modulo: Discord Events

- **Adapter:** `src/lib/sync/adapters/discord/discord-adapter.ts`
  - Fetch de eventos programados de un servidor Discord
  - Config via `DISCORD_BOT_TOKEN` y `DISCORD_GUILD_ID`
  - Retry con backoff (3 intentos)
- **Transformer:** `src/lib/sync/adapters/discord/transformers/event-transformer.ts`
  - Mapea `DiscordEvent` → `DomainEvent`
  - Incluye imagen, canal de voz, organizador
- **Normalizer:** `src/lib/sync/core/normalizers/event-normalizer.ts`
  - Filtra eventos pasados o cancelados
  - Valida contra schema Zod
  - Ordena por fecha ascendente
- **Storage:** `src/lib/sync/core/storage/json-storage.ts`
  - Guarda en `src/data/events/latest.json`
  - Backup historico en `src/data/events/history/{date}.json`
- **CLI:** `src/lib/sync/cli/sync-events.ts`
  - Ejecutable via `tsx src/lib/sync/cli/sync-events.ts`
- **GitHub Action:** `.github/workflows/sync-events.yml`
  - Programado cada 6 horas
  - Push automatico de cambios a `dev`

### Frontend

- **Service:** `src/lib/services/event-service.ts`
  - `getUpcomingEvents()`: todos los eventos proximos
  - `getNextEvent()`: el evento mas cercano a la fecha actual
- **Componentes:**
  - `EventCard.astro`: Card con imagen, fecha, titulo, badge, CTA
  - `EventList.astro`: Grid de 2 columnas
- **Paginas:**
  - `/` — Seccion "Proximas Operaciones" con featured event
  - `/operaciones` — Grid completo de eventos proximos

### Pendiente para produccion real

- [ ] Agregar `zod` a `package.json` (usado en validacion de schemas)
- [ ] Agregar script `sync:events` en package.json
- [ ] Configurar `DISCORD_BOT_TOKEN` y `DISCORD_GUILD_ID` en GitHub Secrets
- [ ] Configurar GitHub Actions permissions para push a `dev`
- [ ] Datos dummy actualmente en `src/data/events/latest.json` — reemplazar con datos reales

## Lecciones aprendidas

### Version GPT (descartada parcialmente)

La primera iteracion genero 11 archivos con arquitectura completa pero sobreingenieria: genericos para N fuentes, clases abstractas, inyeccion de dependencias. Era correcta pero innecesaria para el caso de uso inmediato (solo Discord, maximo 5 eventos).

### Version DeepSeek (simplificada)

Propuesta de 1 solo archivo de ~100 lineas con fetch directo. Mas simple pero perdia la extensibilidad para futuras fuentes.

### Decision final

Se mantuvo la estructura de 11 archivos de GPT pero se simplifico el frontend con un `EventService` independiente que no depende de Zod ni del pipeline de sync. El pipeline complejo existe pero no bloquea al frontend — puede activarse cuando se tengan las credenciales de Discord.

## Modulos futuros

| Fuente | Prioridad | Estado |
|--------|-----------|--------|
| Discord Events | Alta | Pipeline listo, faltan credenciales |
| YouTube (ultimos videos) | Media | No iniciado |
| Twitch (streaming status) | Media | No iniciado |
| Google Drive (documentos) | Baja | No iniciado |

Cada modulo futuro seguira el mismo patron: Adapter → Transformer → Normalizer → Storage.
