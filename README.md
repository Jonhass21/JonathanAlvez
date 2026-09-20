# Jonathan Alvez — Landing

Landing page estática (HTML + CSS + un archivo JS, sin build ni dependencias),
lista para publicar en Netlify.

## Estructura

```
index.html            Página principal
404.html              Página de error
css/styles.css        Todos los estilos (tokens, componentes, layout, responsive)
js/main.js            Animaciones al scrollear, menú móvil, barra de progreso
assets/fonts/         Inter (variable, subsets latin y latin-ext) autoalojada
assets/img/           Retrato optimizado (WebP + JPG), imagen para redes e íconos
favicon.svg           Ícono del sitio
site.webmanifest      Manifiesto (ícono al agregar a la pantalla de inicio)
robots.txt            Indexación
sitemap.xml           Mapa del sitio
netlify.toml          Configuración de Netlify (headers, caché, seguridad)
```

## Publicar en Netlify

**Opción 1 — arrastrar y soltar (lo más rápido)**

1. Entrá a <https://app.netlify.com/drop>.
2. Arrastrá **la carpeta completa** del proyecto (no un zip de un solo archivo).
3. Netlify te da una URL del tipo `https://nombre-random.netlify.app`.

**Opción 2 — desde Git (recomendado, se actualiza solo)**

1. En Netlify: *Add new site → Import an existing project → GitHub*.
2. Elegí este repositorio y la rama.
3. Build command: **vacío**. Publish directory: **`.`** (ya está en `netlify.toml`).
4. *Deploy*. Cada push a la rama vuelve a publicar el sitio.

**Dominio propio:** *Site configuration → Domain management → Add a domain*.
Netlify emite el certificado HTTPS automáticamente.

## Antes de publicar: lo que hay que reemplazar

1. **Número de WhatsApp.** Hoy figura el placeholder `5490000000000`, que viene
   del diseño original. Está en dos lugares de `index.html` (botón de contacto y
   pie), ambos marcados con un comentario `TODO`. Formato: código de país + área
   + número, sin `+`, espacios ni guiones (ej. Argentina: `5493512345678`).

   ```bash
   # reemplazo rápido de los dos enlaces
   sed -i 's/5490000000000/TU_NUMERO/g' index.html
   ```

2. **Dominio.** Las URLs absolutas (canonical, Open Graph, JSON-LD, sitemap y
   robots) usan `https://jonathanalvez.netlify.app`. Cuando tengas el dominio
   definitivo, cambialo en `index.html`, `sitemap.xml` y `robots.txt`:

   ```bash
   sed -i 's|https://jonathanalvez.netlify.app|https://tudominio.com|g' index.html sitemap.xml robots.txt
   ```

3. **Fecha del sitemap.** Actualizá `<lastmod>` cuando cambies el contenido.

## Ver el sitio en local

No hace falta ningún build; alcanza con cualquier servidor estático:

```bash
python3 -m http.server 8080
# luego abrí http://localhost:8080
```

(Conviene servirlo así y no abrir el archivo con doble clic: las rutas
absolutas `/css/...` no funcionan con el protocolo `file://`.)

## Qué se optimizó respecto del export original

- **Sin runtime de diseño.** El export traía `support.js` (69 KB) y un bundle
  que armaba la página con JavaScript en el navegador; ahora el HTML es real y
  se ve aunque el JS falle o esté desactivado (mejor para SEO y para el primer
  pintado).
- **Imágenes:** el retrato pasó de 559 KB (PNG) a 22 KB (WebP), con tres
  tamaños vía `<picture>` + `srcset`, `width`/`height` para evitar saltos de
  layout y carga diferida.
- **Tipografía autoalojada:** Inter se descarga del propio dominio (solo los
  subsets latin) en vez de pedirla a Google Fonts; se precarga la principal.
- **CSS propio y acotado:** se reemplazaron ~500 estilos inline y el design
  system completo (con decenas de componentes sin usar) por una hoja de estilos
  con clases; el responsive ahora usa media queries reales en lugar de
  selectores frágiles del tipo `[style*="padding: 0 32px"]`.
- **Navegación móvil:** antes los links del menú directamente se ocultaban en
  celulares; ahora hay un menú desplegable accesible (teclado, `aria-expanded`,
  cierre con `Escape`).
- **Accesibilidad:** link para saltar al contenido, jerarquía de encabezados,
  `alt` descriptivo, foco visible, decoración marcada como `aria-hidden` y
  contraste de los grises subido al mínimo AA.
- **SEO y redes:** título y descripción, canonical, Open Graph/Twitter con
  imagen 1200×630 generada a partir del diseño, datos estructurados JSON-LD,
  `sitemap.xml`, `robots.txt` y favicon.
- **Netlify:** headers de seguridad (incluido CSP), caché larga para fuentes e
  imágenes y revalidación del HTML.
