# EV71 — Pagina Web del Escuadron 71

Sitio web oficial del Escuadron 71, una comunidad virtual de simulacion aerea militar dedicada a DCS World. Desarrollado con Astro.build, TailwindCSS y React Islands.

Sitio en vivo: **[https://escuadron71.co](https://escuadron71.co)**

## Tecnologias

| Tecnologia | Uso |
|---|---|
| Astro v7 | Framework principal, paginas estaticas |
| TailwindCSS | Clases utility para estilos |
| SCSS | Estilos complejos, variables de marca |
| TypeScript | Lenguaje principal, tipado estricto |
| React | Componentes interactivos (Islands) |
| Supabase | Auth, base de datos, storage (futuro) |
| GitHub Pages | Hosting y deploy con dominio personalizado |
| pnpm | Paqueteria |

## Requisitos previos

- Node.js >= 22
- pnpm >= 9
- Git

## Instalacion

```bash
git clone https://github.com/Escuadron-71/EV71.git
cd EV71
pnpm install
pnpm dev
```

El sitio estara disponible en `http://localhost:4321`.

## Desarrollo

```bash
pnpm dev          # Servidor de desarrollo con hot reload
pnpm check        # Verificacion de tipos y errores
pnpm build        # Build de produccion
pnpm preview      # Preview del build local
pnpm sync:events  # Sincronizar eventos desde Discord (requiere credenciales)
```

## Estructura del proyecto

```
EV71/
├── src/
│   ├── pages/              # Rutas de Astro
│   │   ├── index.astro     # Pagina principal
│   │   ├── operaciones.astro # Eventos/operaciones
│   │   ├── postulacion.astro
│   │   └── sivoe71.astro
│   ├── layouts/            # Layouts compartidos
│   │   └── BaseLayout.astro
│   ├── components/         # Componentes reutilizables
│   │   ├── EventCard.astro
│   │   ├── EventList.astro
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── islands/            # Componentes React Islands
│   │   └── UserDropdown.tsx
│   ├── styles/             # SCSS + TailwindCSS
│   │   ├── global.css
│   │   ├── main.scss
│   │   ├── abstracts/
│   │   ├── base/
│   │   ├── components/     # buttons, cards, event-cards, forms, modals
│   │   ├── layout/         # header, footer, hero, sections
│   │   └── pages/          # home, postulacion, sivoe71
│   ├── lib/
│   │   ├── base-url.ts     # Utilidad resolvePath
│   │   ├── services/       # Servicios (event-service.ts)
│   │   └── sync/           # Pipeline de sincronizacion (Discord, etc.)
│   ├── data/
│   │   └── events/         # Datos de eventos sincronizados
│   └── types/              # Definiciones TypeScript
├── public/
│   ├── CNAME               # Dominio personalizado
│   └── assets/
│       ├── images/         # Imagenes estaticas
│       └── icons/          # Iconos SVG
├── backend/
│   ├── sivoe71_schema.sql
│   └── SIVOE71_LARAVEL_BLUEPRINT.md
├── .github/workflows/
│   ├── deploy.yml          # Build + deploy a GitHub Pages
│   └── sync-events.yml     # Sincronizacion de eventos Discord
├── astro.config.mjs
├── tsconfig.json
├── AGENTS.md               # Guia para IA y desarrolladores
├── ABOUT.md                # Arquitectura y estado del proyecto
└── README.md               # Este archivo
```

## Variables de entorno

```env
# Build
BASE_PATH=/
SITE_URL=https://escuadron71.co

# Discord (para sincronizacion de eventos)
DISCORD_BOT_TOKEN=tu_bot_token
DISCORD_GUILD_ID=tu_guild_id

# Supabase (futuro: auth, DB, storage)
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

**Reglas de seguridad:**
- Las variables con `PUBLIC_` estan disponibles en el navegador.
- Las variables sin prefijo `PUBLIC_` solo estan en server-side.
- Nunca commitear `.env` al repositorio.
- Copiar `.env.example` a `.env` para desarrollo local.

## Deploy

El deploy es automatico via GitHub Action al hacer push a `master`:

1. Astro compila el sitio estatico en `dist/`
2. GitHub Actions sube el artifact a GitHub Pages
3. El sitio se sirve en `https://escuadron71.co`

Para deploy manual local:
```bash
pnpm build
# El contenido de dist/ se sube al branch gh-pages o se sirve via preview
```

## Contribucion

1. Crear una rama desde `dev`: `git checkout -b feat/nombre-feature`
2. Hacer cambios y commits descriptivos (un commit = un cambio logico)
3. Hacer push y crear un Pull Request hacia `master`
4. Incluir resumen de cambios y evidencia de build (`pnpm check`, `pnpm build`)

Ver `AGENTS.md` para reglas detalladas de desarrollo.
