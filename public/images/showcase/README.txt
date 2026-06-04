═══════════════════════════════════════════════════════════════
  FOTOS DEL CARRUSEL (sección del medio en la página de inicio)
═══════════════════════════════════════════════════════════════

PEGA TUS ARCHIVOS EN ESTA CARPETA (ruta completa en el proyecto):

  ARANDANO/public/images/showcase/

Desde la raíz del repo, la ruta relativa es:

  public/images/showcase/

Ejemplo de archivos válidos:
  public/images/showcase/foto-1.jpg
  public/images/showcase/foto-2.webp
  public/images/showcase/bar-noche.png

Formatos: .jpg .jpeg .png .webp .gif .avif

───────────────────────────────────────────────────────────────
Opcional — orden y descripción (texto alternativo)
───────────────────────────────────────────────────────────────

Edita en la raíz del proyecto:

  data/showcase-manifest.json

Copia el ejemplo desde:

  data/showcase-manifest.example.json

───────────────────────────────────────────────────────────────
Cómo se cargan
───────────────────────────────────────────────────────────────

La web llama a:  GET /api/showcase

Si hay fotos en public/images/showcase/, se muestran ahí.
Si la carpeta está vacía, se usan imágenes temporales de internet.

Después de agregar fotos, recarga la página de inicio (o reinicia npm run dev).
