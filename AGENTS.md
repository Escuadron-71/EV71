# AGENTS.md

## Objetivo del proyecto

El proyecto EV71 PageWeb es el sitio estatico oficial del Escuadron 71. El desarrollo nuevo se realizara con Astro para mantener una base rapida, modular, facil de revisar y preparada para una posible integracion futura con Supabase.

## Rol de Codex

Codex actuara como desarrollador profesional especializado en Astro.build. Debe priorizar arquitectura limpia, componentes reutilizables, rendimiento, accesibilidad, mantenimiento y consistencia visual con la identidad militar/aeronautica del Escuadron 71.

## Flujo de Git

- La rama `master` es la rama protegida de verificacion del equipo.
- Todo desarrollo nuevo debe realizarse en la rama `dev`.
- No se debe trabajar directamente sobre `master`.
- Todo cambio hacia `master` debe pasar por pull request desde `dev`.
- Antes de iniciar cambios, verificar rama con `git status --short --branch`.
- Si el repositorio esta en `master`, cambiar a `dev` antes de modificar archivos.
- No revertir cambios de otros colaboradores sin autorizacion explicita.
- Mantener commits pequenos y descriptivos cuando el equipo solicite commits.

## Estructura Astro

- `src/pages/`: paginas enrutadas por Astro.
- `src/layouts/`: layouts compartidos.
- `src/components/`: componentes reutilizables cuando existan 2 o mas usos claros.
- `src/styles/`: estilos globales o tokens de diseno si el CSS crece.
- `public/assets/images/`: imagenes y archivos servidos estaticamente.
- `public/`: archivos publicos que deben conservar su nombre final en produccion.

## Reglas de desarrollo

- Usar Astro como framework principal para paginas estaticas.
- Evitar JavaScript del lado cliente salvo que una interaccion lo requiera.
- Mantener el sitio compatible con `output: "static"`.
- Crear componentes Astro simples antes de introducir frameworks de UI.
- No introducir React, Vue, Svelte u otros frameworks sin decision explicita del equipo.
- Mantener rutas de assets con `/assets/images/nombre.ext`.
- Validar nombres de archivos respetando mayusculas y minusculas para despliegues Linux.
- Mantener textos en espanol neutro y tono institucional.
- Priorizar accesibilidad: etiquetas `alt`, contraste, foco visible y HTML semantico.
- Ejecutar `npm run check` y `npm run build` antes de proponer un PR cuando sea posible.

## Migracion desde HTML legado

- Los archivos HTML existentes son referencia funcional y visual durante la migracion.
- Migrar por secciones, no reescribir todo sin necesidad.
- Preservar contenido importante de `index2.html`, `postulacion.html` y `sivoe71.html`.
- Al migrar una pagina, mover estructura a `src/pages` y estilos reutilizables a componentes/layouts.
- No eliminar los archivos legados hasta que el equipo confirme que la pagina Astro equivalente esta validada.

## Preparacion para Supabase

- Supabase queda como opcion futura para postulaciones, autenticacion, bitacoras o panel privado.
- No guardar claves secretas en el repositorio.
- Usar variables publicas solo con prefijo `PUBLIC_` cuando deban llegar al navegador.
- Las claves privadas deben usarse unicamente en backend, funciones serverless o entornos seguros.
- Mantener `.env.example` actualizado cuando se agreguen variables.

## Calidad visual

- El sitio debe sentirse como una plataforma seria de simulacion aeronautica militar.
- Evitar layouts de landing genericos cuando se construyan herramientas o paneles.
- Usar imagenes reales del escuadron o assets existentes siempre que aporten contexto.
- Cuidar responsive desde el inicio: escritorio, tablet y movil.
- No depender de rutas con barras invertidas en HTML o CSS.

## Comandos principales

```bash
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm preview
```

## Pull requests

Cada PR hacia `master` debe incluir:

- Resumen breve de cambios.
- Paginas o componentes afectados.
- Evidencia de validacion: `npm run check`, `npm run build` o nota si no se pudo ejecutar.
- Capturas si hay cambios visuales relevantes.
