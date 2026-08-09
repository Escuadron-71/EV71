# feat/postulacion — Formulario de postulacion habilitado (Supabase)

## Objetivo

Habilitar el formulario de `/postulacion` (hoy estatico, boton deshabilitado) para que
las postulaciones se registren en **Supabase** y lleguen por correo al escuadron:
**dcsescuadron71@gmail.com**.

## Contexto tecnico

- El hosting es **GitHub Pages (estatico)** → no puede correr `backend/scripts/server.js`
  (nodemailer) ni endpoints SSR. Ese backend legacy queda obsoleto para produccion.
- El formulario actual no tiene JS de envio (`postulacion.astro` termina en el modal).

## Decision tomada: Supabase (fijada por el equipo, no revertir)

- Se usara **Supabase** (no EmailJS) para registrar aspirantes en una tabla `aspirantes`
  (insert-only RLS para anon + dedup por correo/callsign) y notificar por correo.
- Edge Function `send-aspirant-email` recibe el registro, lo valida con zod, lo inserta
  (o rechaza duplicado con 409) y envia via SMTP Gmail (nodemailer en la funcion) a
  dcsescuadron71@gmail.com.
- Deja la base para el dashboard interno futuro y roles (administrador/comandante/
  instructor/piloto/aspirante) ya contemplados en AGENTS.md.
- Requiere: proyecto Supabase, URL/ANON en `.env` + secrets de CI, y App Password Gmail.

## Fases / Subfases

### Fase 1 — Validacion client-side
1. Convertir el envio en un React Island (`src/islands/PostulacionForm.tsx`) con `client:load`
   y validacion **zod** (ya en deps).
   - Schema del formulario: nombre, callsign, nacimiento, pais, correo, contacto,
     experiencia, simuladores, horas, nivel, modulos, disponibilidad, avion, compromiso.
   - Errores inline por campo + mensaje general; honeypot anti-spam.
2. Desbloquear el boton "Enviar Postulacion" y conectar el modal de exito.

### Fase 2 — Registro y correo con Supabase
1. Activar proyecto Supabase; `PUBLIC_SUPABASE_URL`/`PUBLIC_SUPABASE_ANON_KEY` en
   `.env` (gitignored) y `.env.example`.
2. Instalar `@supabase/supabase-js` (cliente) + `@supabase/ssr` si se escala a auth.
3. SQL: tabla `aspirantes` con RLS (policy insert-only para anon) + funcion de dedup.
4. Edge Function `send-aspirant-email` (Supabase CLI, TS) que valida payload,
   inserta (o rechaza duplicado con 409) y envia via SMTP Gmail a
   dcsescuadron71@gmail.com (nodemailer en la funcion; secretos en Supabase vault).
5. `src/lib/postulacion/supabase-client.ts`: insert + llamada a la funcion.

### Fase 3 — Seguridad y anti-spam
- Honeypot oculto + validacion zod en cliente y en la Edge Function.
- Rate limiting simple (timestamp + localStorage) para evitar disparos repetidos.
- Nunca loguear datos sensibles.

### Fase 4 — CI / env
- Añadir secrets al repo (GitHub Actions): `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  para el build de deploy.
- Documentar en `.env.example`.

## Archivos a crear/modificar

- `src/islands/PostulacionForm.tsx` (nuevo island con validacion zod)
- `src/pages/postulacion.astro` (usar el island; quitar formulario estatico muerto)
- `src/lib/postulacion/` (cliente supabase)
- `src/lib/postulacion/schema.ts` (schema zod)
- `src/styles/pages/_postulacion.scss` (estados de error/exito)
- `.env.example`, `.github/workflows/deploy.yml` (secrets)
- `backend/scripts/server.js` (marcar como legacy/obsoleto o eliminar cuando Supabase viva)
- `AGENTS.md` (seccion Postulacion)

## Criterios de validacion

- `pnpm check` 0 errores, `pnpm build` OK.
- Enviar el formulario genera correo a dcsescuadron71@gmail.com (probado manualmente).
- Duplicados rechazados (409 o mensaje "ya registrado").
- Modal de exito se muestra al completar; errores visibles inline.
- Sin credenciales en el repositorio.

## Merge target

- PR a `dev`. Independiente; puede ir en paralelo a las ramas de contenido.
