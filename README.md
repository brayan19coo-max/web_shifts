# Shift's — Shifting your style

Tienda web interactiva para la marca de ropa urbana **Shift's**, en blanco y negro con estilo graffiti: cursor personalizado, eslogan que suena como instrumento, drop bloqueado con clave, contador y logo girando en 3D, tarjetas con efecto 3D, carrito con animaciones, lookbook con scroll horizontal, música de fondo y efectos de sonido en toda la interfaz.

🌐 **Sitio publicado:** https://brayan19coo-max.github.io/web_shifts/

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
| Drop bloqueado: nombre, fecha, clave                | `js/config.js` → `DROP`          |
| Logo (vectorial)                                    | `assets/images/logo.svg` y `logo-sticker.svg` (tu archivo de Inkscape queda en `logo-original.svg`) |
| Sonidos y volúmenes                                 | `js/config.js` → `SOUNDS`, `AUDIO` |
| Productos, precios, tallas, colores, fotos          | `js/data/products.js`            |
| Colores de la marca y tipografías                   | `css/base.css` → `:root`         |
| Textos del lookbook, manifiesto, footer             | `index.html`                     |

- **Fotos reales:** agrega `images: ['assets/images/mi-foto.jpg', …]` a un producto (una por color, en el mismo orden que `colors`). Si no hay fotos, se muestra una ilustración de la prenda teñida con el color elegido.
- **Pedidos por WhatsApp:** configurado al +57 324 288 7471. El botón *Finalizar compra* abre WhatsApp con el pedido ya escrito (productos, tallas, colores y total).
- **Sonidos:** mira [`assets/sounds/LEEME.md`](assets/sounds/LEEME.md) para ver qué sonido va en cada evento y dónde conseguirlos.

## Cómo agregar productos

Todo está en **`js/data/products.js`**. Al principio del archivo hay una plantilla comentada. Pasos:

1. Copia un bloque `{ ... },` existente (o la plantilla) y pégalo dentro de `PRODUCTS`.
2. Cambia los datos:

```js
{
  id: 'hoodie-graffiti',           // único, sin espacios ni tildes
  name: 'Hoodie Graffiti',
  category: 'hoodies',             // camisetas | hoodies | chaquetas | pantalones | accesorios
  type: 'hoodie',                  // dibujo si no hay foto: tee | hoodie | jacket | pants | cap | tote
  price: 189000,                   // sin puntos ni $
  tag: 'Nuevo',                    // opcional
  description: 'Felpa de 420 g con el logo bordado.',
  colors: [
    { name: 'Negro', hex: '#111111' },
    { name: 'Blanco', hex: '#f4f4f4' },
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  images: [                        // opcional: una foto por color, mismo orden
    'assets/images/productos/hoodie-graffiti-negro.jpg',
    'assets/images/productos/hoodie-graffiti-blanco.jpg',
  ],
  drop: 'drop-02',                 // opcional: lo esconde en el drop bloqueado
},
```

3. Guarda las fotos en `assets/images/productos/` (.jpg o .webp, formato vertical 4:5 o cuadrado, fondo liso, idealmente < 300 KB).
4. Recarga la página. Si algo no aparece, revisa que no falten comas, llaves o comillas.

Para agregar una categoría nueva, añádela en `CATEGORIES` (el mismo archivo).

**Agotados:** agrega `soldOut: true,` a un producto para mostrarlo con el sello "Sold out" (se ve, pero no se puede comprar), o `soldOutSizes: ['S', 'M'],` para agotar solo algunas tallas.

## Lookbook

Se edita en **`js/data/lookbook.js`**: título, temporada y la lista de looks (nombre, frase, foto y colores de la tarjeta). Las fotos van en `assets/images/lookbook/` (verticales, .jpg o .webp, < 400 KB).

## Drop bloqueado con clave

- Los productos que tengan `drop: 'drop-02'` no salen en la tienda: aparecen en la sección del drop cuando se desbloquea.
- **Clave actual: `SHIFTS2026`.** Para cambiarla, abre `http://localhost:8000/tools/generar-clave.html`, escribe la nueva clave y pega el código en `DROP.passwordHash` (en `js/config.js`). La clave nunca queda escrita tal cual en el código.
- El contador va hasta `DROP.releaseDate`. Si `autoUnlock` está en `true`, el drop se abre solo a esa hora para todo el mundo.
- Quien pone la clave queda desbloqueado en ese navegador.
- Es un bloqueo "de expectativa" para acceso anticipado: sirve para crear hype, pero alguien con conocimientos técnicos podría saltarlo. Para un drop secreto de verdad hace falta un servidor.
- Para un drop nuevo: cambia `id`, `name` y `releaseDate` en `DROP` y usa ese mismo `id` en los productos.

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
  data/lookbook.js         ⭐ Looks del lookbook
  core/
    bus.js                 Bus de eventos entre módulos
    store.js               Store reactivo mínimo
    cart-store.js          Estado del carrito (se guarda en el navegador)
  audio/
    sound-manager.js       Carga, reproduce y controla sonidos/música
    synth.js               Sonidos sintetizados (respaldo sin archivos)
  components/
    loader.js              Pantalla de entrada (con / sin sonido)
    drop-lock.js           Drop bloqueado: contador, clave, desbloqueo
    logo3d.js              Logo girando en 3D (se puede arrastrar)
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
  utils/                   Helpers de DOM, formato, almacenamiento y sha256
tools/
  generar-clave.html       Genera el código de una nueva clave del drop
assets/
  sounds/                  Tus sonidos (ver LEEME.md)
  images/                  Logo, favicon y productos/ (tus fotos)
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
