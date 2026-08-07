# feat/donations — Vista de Donaciones

## Objetivo

Crear `/donaciones`: pagina institucional que llama a la comunidad a **apoyar al
escuadron**, mostrando metodos de pago y plataformas disponibles (Patreon, BuyMeACoffee,
PayPal, MercadoPago, etc.).

## Contexto

El footer ya enlaza a Patreon (`https://www.patreon.com/Escuadron71`). Esta vista
centraliza el llamado a donar, explica en que se usan los fondos y lista las plataformas.

## Fases / Subfases

### Fase 1 — Datos de plataformas
`src/data/donations/platforms.json` (array): nombre, descripcion, url, logo/icono,
badge (recurrente/unica). Confirmar con el equipo las plataformas activas y URLs.

### Fase 2 — Vista de donaciones
1. `src/pages/donaciones.astro`:
   - Hero con llamado a la comunidad (tono institucional, colores de marca).
   - Seccion "En que se usa tu apoyo": servidores, equipos, herramientas, comunidad.
   - Grid de cards de plataformas (nombre, descripcion, CTA externo).
   - Metodos de pago locales (si aplica: Nequi/PayPal/MercadoPago) con notas.
   - Transparencia: nota de que el apoyo es voluntario y no obligatorio.
2. `src/styles/pages/_donations.scss`.

### Fase 3 — SEO y accesibilidad
- `title`/`description` orientados a apoyo/patrocinio.
- Enlaces externos con `target="_blank"` + `rel="noopener noreferrer"`.
- `alt` en logos, contraste, focus visible.

## Archivos a crear/modificar

- `src/data/donations/platforms.json`
- `src/pages/donaciones.astro`
- `src/components/donations/DonationPlatformCard.astro`
- `src/styles/pages/_donations.scss`
- `AGENTS.md` (seccion Donaciones)

## Criterios de validacion

- `pnpm check` 0 errores, `pnpm build` OK, HTTP 200 en `/donaciones`.
- URLs de plataformas reales (confirmadas por el equipo) y verificadas.
- Ninguna integracion de pago en esta fase (solo redireccion a plataformas).

## Merge target

- PR a `dev`. Fusionar tras `feat/header-navigation` (menu → `/donaciones`).
