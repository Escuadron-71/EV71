# feat/store — Tienda base (catalogo estatico + producto + WhatsApp Business)

## Objetivo

Crear la seccion **Tienda** del escuadron:
- `/tienda` — catalogo que llama productos de manera **estatica** (build-time). Cada
  cambio de productos requiere rebuild (documentado). Eventualmente se migrara a
  eCommerce real.
- Cada card de producto redirige a una vista de especificaciones del producto.
- Para **comprar** se redirige a **WhatsApp Business** con mensaje prearmado.

## Modelo de datos

`src/data/store/products.json` (array) por producto:
- `slug`, `nombre`, `precio`, `moneda` (COP/USD), `categoria`, `imagen`, `descripcion`,
  `especificaciones` (lista clave/valor), `disponible`, `whatsapp` (numero/plantilla).

Decision: datos en JSON commit (build-time), sin backend ni carrito. El "checkout" es
un deep link `https://wa.me/<numero>?text=<mensaje con el producto>`.

## Fases / Subfases

### Fase 1 — Datos y catalogo
1. `src/data/store/products.json`: 4-6 productos iniciales (merchandising del escuadron:
   patches, stickers, camisetas, llaveros...). Confirmar productos y precios con el equipo.
2. `src/types/store.ts` (tipos Product, ProductSpecs).
3. `src/pages/tienda.astro`:
   - Grid de cards (imagen, nombre, precio, badge categoria/disponible).
   - Filtro por categoria (solo si hay muchas; si son <10, agrupar por seccion).
4. `src/styles/pages/_store.scss`.

### Fase 2 — Vista de producto
1. `src/pages/tienda/[slug].astro` con `getStaticPaths()`:
   - Imagen grande, nombre, precio, descripcion.
   - Tabla de especificaciones.
   - Boton **"Comprar por WhatsApp"**: genera `wa.me` link con texto prearmado
     (producto, precio, mensaje institucional).
   - Retorno al catalogo; rutas desconocidas → 404.

### Fase 3 — Helpers de WhatsApp
1. `src/lib/store/whatsapp.ts`: funcion pura `buildWhatsAppLink(phone, message)`
   (encodeURIComponent, limpieza de +/espacios) — **testeable** (rama `feat/testing`).
2. Configurar numero del escuadron en `src/lib/store/config.ts` (o .env PUBLIC).
3. Nota visible: "Los productos se gestionan de forma manual; el stock se actualiza
   periodicamente".

### Fase 4 — SEO y validacion
- `title`/`description` por producto (SEO de productos).
- `pnpm check`, `pnpm build`, `pnpm preview` (200 en catalogo y productos).
- `alt` en imagenes; datos estructurados de Producto (JSON-LD opcional).

## Archivos a crear/modificar

- `src/data/store/products.json`, `src/types/store.ts`
- `src/pages/tienda.astro`, `src/pages/tienda/[slug].astro`
- `src/lib/store/whatsapp.ts`, `src/lib/store/config.ts`
- `src/components/store/ProductCard.astro`, `ProductSpecsTable.astro`
- `src/styles/pages/_store.scss`
- `AGENTS.md` (seccion Tienda)

## Criterios de validacion

- `pnpm check` 0 errores, `pnpm build` OK, HTTP 200 en `/tienda` y cada producto.
- Boton WhatsApp genera link valido con mensaje prearmado (verificar URL encode).
- Documentado que el catalogo es build-time (rebuild para actualizar).

## Merge target

- PR a `dev`. Fusionar tras `feat/header-navigation` (menu → `/tienda`).
