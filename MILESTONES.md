# Posibles futuras implementaciones

- ~~Configurar el repositorio para que cada publicación en la rama **master**, que desencadena el despliegue en GitHub Pages, genere automáticamente un **Release**, un **Tag** y un **número de versión**, comenzando en la **0.1.0** y evolucionando progresivamente hasta la **1.0.0**.~~ **COMPLETADO (0.1.0).**

  Se implementó el flujo de versionado automático en `.github/workflows/release.yml`:
  - **Milestones:** creados.
  - **CHANGELOG:** creado.
  - **README:** actualizado.
  - **ABOUT:** actualizado.
  - **AGENTS:** actualizado.
  - Guarda `[skip release]` en `deploy.yml` para evitar loops con el deploy.

- Dado que el proyecto incorporará componentes dinámicos mediante **React Islands**, es importante implementar pruebas automatizadas básicas para evitar romper funcionalidades existentes. A futuro se planea incorporar pruebas de QA utilizando **Playwright**.

- Configurar un sistema de redirección de correo utilizando el dominio personalizado, de forma que todos los correos sean reenviados automáticamente al Gmail oficial del Escuadrón.

- Habilitar cuanto antes el formulario de **Postulación al Escuadrón**. Si es necesario crear la base de datos en **Supabase**, proceder con la explicación de la arquitectura propuesta y su posterior implementación.

- Para la versión **1.0.0**, implementar **Pages CMS** como gestor de contenidos para el Blog. También evaluar la posibilidad de extender su uso a la sección de **Noticias (News)**.

  Junto con esta implementación, crear un formulario de suscripción al **Newsletter** y analizar una solución sencilla para enviar notificaciones por correo a los suscriptores cuando se publique una nueva entrada del Blog o una nueva noticia.

- Cuando las **Dashboards de Administración y Usuario** estén disponibles, migrar progresivamente las funcionalidades actuales hacia estos nuevos módulos.
