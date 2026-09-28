# SHIFTS — Sitio web de marca de ropa

Tienda web interactiva para una marca de ropa urbana: cursor personalizado, logo que suena como instrumento, tarjetas con efecto 3D, carrito con animaciones, lookbook con scroll horizontal, música de fondo y efectos de sonido en toda la interfaz.

Hecha con **HTML, CSS y JavaScript puro, organizado en módulos ES**: no necesita frameworks, dependencias ni compilación.

## Cómo verlo

Los módulos de JavaScript no funcionan abriendo el `index.html` con doble clic (el navegador lo bloquea por seguridad), así que hay que servirlo con un servidor local. Cualquiera de estas opciones sirve:

```bash
# Con Python
python3 -m http.server 8000

# o con Node
npx serve .
```

Luego abre <http://localhost:8000>.
En VS Code también sirve la extensión **Live Server** (clic derecho en `index.html` → *Open with Live Server*).

## Personalizar

| Quiero cambiar…                                     | Archivo                          |
|-----------------------------------------------------|----------------------------------|
| Nombre, eslogan, moneda, WhatsApp, redes            | `js/config.js` → `BRAND`         |
| Sonidos y volúmenes                                 | `js/config.js` → `SOUNDS`, `AUDIO` |
| Productos, precios, tallas, colores, fotos          | `js/data/products.js`            |
| Colores de la marca y tipografías                   | `css/base.css` → `:root`         |
| Textos del lookbook, manifiesto, footer             | `index.html`                     |

- **Fotos reales:** agrega `images: ['assets/images/mi-foto.jpg', …]` a un producto (una por color, en el mismo orden que `colors`). Si no hay fotos, se muestra una ilustración de la prenda teñida con el color elegido.
- **Pedidos por WhatsApp:** pon tu número en `BRAND.whatsapp` (ej. `'573001234567'`). El botón *Finalizar compra* abrirá WhatsApp con el pedido ya escrito. Si lo dejas vacío, el checkout funciona en modo demostración.
- **Sonidos:** mira [`assets/sounds/LEEME.md`](assets/sounds/LEEME.md) para ver qué sonido va en cada evento y dónde conseguirlos.

## Estructura

```
index.html                 Estructura de la página
css/
  base.css                 Variables de diseño (colores, fuentes), reset
  layout.css               Header, menú móvil, secciones, footer
  components.css           Botones, cursor, tarjetas, modal, carrito, toasts
  sections.css             Loader, hero, marquee, lookbook, manifiesto, club
  animations.css           Keyframes y revelados al hacer scroll
js/
  main.js                  Punto de entrada: inicializa cada módulo
  config.js                ⭐ Configuración de marca y sonidos
  data/products.js         ⭐ Catálogo
  core/
    bus.js                 Bus de eventos entre módulos
    store.js               Store reactivo mínimo
    cart-store.js          Estado del carrito (se guarda en el navegador)
  audio/
    sound-manager.js       Carga, reproduce y controla sonidos/música
    synth.js               Sonidos sintetizados (respaldo sin archivos)
  components/
    loader.js              Pantalla de entrada (con / sin sonido)
    cursor.js              Cursor personalizado
    header.js              Cabecera, controles de sonido, menú móvil
    hero.js                Logo musical + parallax
    magnetic.js            Botones magnéticos
    product-art.js         Ilustraciones SVG de prendas
    product-card.js        Tarjeta con inclinación 3D y colores
    product-grid.js        Grilla y filtros
    quick-view.js          Modal de vista rápida
    cart.js                Carrito lateral, checkout, confeti
    lookbook.js            Scroll horizontal anclado
    manifesto.js           Texto que se ilumina con el scroll
    newsletter.js          Formulario del club
    reveal.js              Animaciones de entrada
    toast.js               Notificaciones
  utils/                   Helpers de DOM, formato y almacenamiento
assets/
  sounds/                  Tus sonidos (ver LEEME.md)
  images/                  Fotos de productos, favicon
```

Cada componente es independiente y se comunica con los demás a través del **bus de eventos** o del **store del carrito**. Para quitar una sección, borra su bloque en `index.html` y su línea `init…()` en `js/main.js`.

## Sonido en el HTML

Cualquier elemento puede sonar solo con atributos:

```html
<button data-sfx="click" data-sfx-hover="hover">Comprar</button>
```

## Accesibilidad

- Navegable con teclado (foco visible, `Esc` cierra paneles, foco atrapado en modales).
- Respeta `prefers-reduced-motion`: se desactivan animaciones fuertes y el lookbook pasa a un carrusel normal.
- El sonido siempre es opcional, se puede apagar desde la cabecera y la preferencia se recuerda.

## Publicarlo gratis

Al ser un sitio estático, puedes publicarlo en **GitHub Pages** (Settings → Pages → rama `main`, carpeta `/`), **Netlify** o **Vercel** arrastrando la carpeta.
