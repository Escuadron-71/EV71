# EV71 — Pagina Web del Escuadron 71

Sitio web oficial del Escuadron 71, una comunidad virtual de simulacion aerea militar dedicada a DCS World. Desarrollado con Astro.build, TailwindCSS y React Islands.

## Tecnologias

| Tecnologia | Uso |
|---|---|
| Astro v7 | Framework principal, paginas estaticas |
| TailwindCSS | Clases utility para estilos |
| SCSS | Estilos complejos, variables de marca |
| TypeScript | Lenguaje principal, tipado estricto |
| React | Componentes interactivos (Islands) |
| Supabase | Auth, base de datos, storage |
| Cloudflare Pages | Hosting y deploy |
| pnpm | Paqueteria |

## Requisitos previos

- Node.js >= 18
- pnpm >= 9
- Git
- Cuenta de Supabase (para modulos dinamicos)
- Cuenta de Cloudflare (para deploy)

## Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/Escuadron-71/EV71.git
cd EV71

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
pnpm dev
```

El sitio estara disponible en `http://localhost:4321`.

## Desarrollo

```bash
pnpm dev          # Servidor de desarrollo con hot reload
pnpm check        # Verificacion de tipos y errores
pnpm build        # Build de produccion
pnpm preview      # Preview del build local
```

## Estructura del proyecto

```
EV71/
├── src/
│   ├── pages/            # Rutas de Astro
│   │   ├── index.astro   # Pagina principal
│   │   ├── postulacion.astro
│   │   └── sivoe71.astro
│   ├── layouts/          # Layouts compartidos
│   │   └── BaseLayout.astro
│   ├── components/       # Componentes reutilizables
│   ├── islands/          # Componentes React Islands
│   ├── styles/           # SCSS: variables, mixins, globales
│   ├── lib/              # Utilidades y helpers
│   └── types/            # Definiciones TypeScript
├── public/
│   └── assets/
│       ├── images/       # Imagenes estaticas
│       ├── icons/        # Iconos SVG
│       └── fonts/        # Fuentes locales
├── backend/
│   ├── sivoe71_schema.sql          # Schema MySQL/Supabase
│   └── SIVOE71_LARAVEL_BLUEPRINT.md # Blueprint del sistema
├── data/                 # Datos estaticos (JSON)
├── tailwind.config.ts    # Configuracion de TailwindCSS
├── astro.config.mjs      # Configuracion de Astro
├── tsconfig.json         # Configuracion de TypeScript
├── .env.example          # Variables de entorno (ejemplo)
├── AGENTS.md             # Guia para IA y desarrolladores
├── ABOUT.md              # Descripcion y arquitectura del proyecto
└── README.md             # Este archivo
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

```env
# Supabase (requerido para modulos dinamicos)
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# Email (solo si se usa server Node local)
EMAIL_USER=
EMAIL_PASS=
```

**Reglas de seguridad:**
- Las variables con `PUBLIC_` estan disponibles en el navegador.
- Las variables sin prefijo `PUBLIC_` solo estan en server-side.
- Nunca commitear `.env` al repositorio.

## Deploy en Cloudflare Pages

1. Conectar el repositorio de GitHub a Cloudflare Pages.
2. Configurar:
   - **Build command:** `pnpm build`
   - **Output directory:** `dist`
   - **Node.js version:** 18+ (en Settings > Environment)
3. Agregar variables de entorno en Cloudflare Dashboard.
4. Configurar dominio personalizado si aplica.

## Contribucion

1. Crear una rama desde `dev`: `git checkout -b feat/nombre-feature`
2. Hacer cambios y commits descriptivos.
3. Hacer push y crear un Pull Request hacia `master`.
4. Incluir resumen de cambios y evidencia de build (`pnpm check`, `pnpm build`).

Ver `AGENTS.md` para reglas detalladas de desarrollo.
