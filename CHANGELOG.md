# Changelog

Todas las notas de version del proyecto **EV71 PageWeb** se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y el proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

Las entradas de cada release se generan automaticamente a partir de los commits publicados en `master` (workflow `release.yml`).

## [0.1.0] - 2026-08-04

### Agregado

- Paginas institucionales bajo `/nosotros`: Mision y Vision, Declaracion, Objetivos, Reglamento, Historia y Estructura, construidas desde los documentos en `src/assets/docs/`.
- Dropdown "Nosotros" en el header con acceso a las nuevas paginas institucionales.
- Content collections (`src/content.config.ts`) para renderizar los documentos `.md` en tiempo de build.
- Workflow `release.yml`: versionado automatico (tag, release y numero de version) en cada publicacion a `master`.
- `CHANGELOG.md` como registro de versiones del proyecto.

[0.1.0]: https://github.com/Escuadron-71/EV71/releases/tag/v0.1.0
