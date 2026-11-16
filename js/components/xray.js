import { prefersReducedMotion } from '../utils/dom.js';
import { LITE, whileVisible } from '../utils/perf.js';

/**
 * Rayos X del drop
 * -------------------------------------------------------------
 * De vez en cuando el logo parpadea en los colores del drop (como un
 * escáner que se prende y se apaga) y, mientras está prendido, en el
 * fondo aparecen "radiografías" de armas, cuchillos, dinero, balas,
 * esposas y placas. Solo corre mientras el drop se ve en pantalla.
 *
 * Los colores salen de DROP.xray.colors (config.js).
 */

// Dibujos en línea (estilo radiografía). viewBox 0 0 120 80.
const ITEMS = {
  pistola: `
    <path d="M8 14h78l6 5h14v11H58l-5 5h-8l-8 34H18l9-36h-6l-4-7H8z"/>
    <path class="xr-in" d="M14 20h70M30 30h22M24 40h10M22 50h9M20 60h9"/>
    <path class="xr-in" d="M46 35c0 10 6 14 14 14V35"/>
    <circle class="xr-in" cx="98" cy="24" r="2.5"/>`,
  revolver: `
    <path d="M6 18h66l4-6h10v6h24v10H78l-4 12H64v8h-8l-6 28H32l8-32h-6v-8h6l-2-6H6z"/>
    <circle class="xr-in" cx="62" cy="30" r="8"/>
    <path class="xr-in" d="M58 24v12M66 24v12M12 23h56M40 52h10M38 62h10"/>`,
  cuchillo: `
    <path d="M4 40c26-16 56-22 74-22v18H40C24 36 12 38 4 40z"/>
    <path d="M78 16h8v24h-8zM86 22h30v12H86z"/>
    <path class="xr-in" d="M14 38c18-8 40-12 60-14M92 28h20"/>
    <circle class="xr-in" cx="96" cy="28" r="1.8"/><circle class="xr-in" cx="108" cy="28" r="1.8"/>`,
  navaja: `
    <path d="M10 46l58-28 6 10-56 26z"/>
    <path d="M70 22l40 20-6 10-40-18z"/>
    <path class="xr-in" d="M18 48l48-22M76 30l30 15"/>
    <circle class="xr-in" cx="70" cy="26" r="3"/>`,
  billetes: `
    <path d="M10 22h86v40H10z"/>
    <path d="M18 14h86v40"/>
    <path d="M26 6h86v40"/>
    <circle class="xr-in" cx="53" cy="42" r="10"/>
    <path class="xr-in" d="M56 36c-2-2-8-2-8 2s8 2 8 6-6 4-8 2M52 33v18M16 28h10M80 56h10"/>`,
  fajo: `
    <path d="M8 26h104v30H8z"/>
    <path d="M8 34h104M8 42h104M8 50h104"/>
    <path class="xr-in" d="M50 22h20v38H50z"/>
    <path class="xr-in" d="M64 36c-2-2-8-2-8 1s8 2 8 5-6 4-8 2M60 32v14"/>`,
  balas: `
    <path d="M14 70V34c0-14 6-22 10-26 4 4 10 12 10 26v36z"/>
    <path d="M48 70V34c0-14 6-22 10-26 4 4 10 12 10 26v36z"/>
    <path d="M82 70V34c0-14 6-22 10-26 4 4 10 12 10 26v36z"/>
    <path class="xr-in" d="M14 40h20M48 40h20M82 40h20M14 62h20M48 62h20M82 62h20"/>`,
  esposas: `
    <circle cx="30" cy="44" r="20"/><circle cx="90" cy="44" r="20"/>
    <circle class="xr-in" cx="30" cy="44" r="13"/><circle class="xr-in" cx="90" cy="44" r="13"/>
    <path d="M48 36c4-6 8-6 12 0s8 6 12 0"/>`,
  placa: `
    <path d="M60 4l12 18 20-4-6 20 16 14-20 6 2 20-24-10-24 10 2-20-20-6 16-14-6-20 20 4z"/>
    <circle class="xr-in" cx="60" cy="42" r="14"/>
    <path class="xr-in" d="M60 32l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z"/>`,
  manopla: `
    <path d="M10 30c0-10 8-14 16-14h70c10 0 16 6 16 14v6c0 12-10 22-22 22H32c-12 0-22-8-22-20z"/>
    <circle class="xr-in" cx="30" cy="30" r="7"/><circle class="xr-in" cx="50" cy="30" r="7"/>
    <circle class="xr-in" cx="70" cy="30" r="7"/><circle class="xr-in" cx="90" cy="30" r="7"/>`,
};

// Lugares del fondo (en %), pegados a los bordes para no tapar el texto
const SLOTS = [
  { x: 2, y: 6, w: 17 },
  { x: 24, y: 2, w: 13 },
  { x: 40, y: 8, w: 12 },
  { x: 2, y: 40, w: 14 },
  { x: 4, y: 74, w: 16 },
  { x: 26, y: 82, w: 13 },
  { x: 44, y: 76, w: 12 },
  { x: 82, y: 4, w: 15 },
  { x: 64, y: 2, w: 13 },
  { x: 86, y: 44, w: 12 },
  { x: 80, y: 78, w: 16 },
  { x: 62, y: 84, w: 12 },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rand = (min, max) => min + Math.random() * (max - min);
const shuffle = (list) => list.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

/** Filtro SVG que pinta el blanco del logo del color dado (el contorno negro se queda negro). */
function tintFilters(colors) {
  const rows = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255 / 3).toFixed(4));
    return `${r} ${r} ${r} 0 0  ${g} ${g} ${g} 0 0  ${b} ${b} ${b} 0 0  0 0 0 1 0`;
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = colors
    .map((c, i) => `<filter id="xr-tint-${i}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${rows(c)}"/></filter>`)
    .join('');
  document.body.append(svg);
}

export function initXray(section, logoEl, { colors = [] } = {}) {
  if (!section || !colors.length) return;
  section.classList.add('drop--xray');
  tintFilters(colors);

  // Capa de fondo con las radiografías
  const layer = document.createElement('div');
  layer.className = 'xray';
  layer.setAttribute('aria-hidden', 'true');
  const names = Object.keys(ITEMS);
  const items = names.map((name) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 120 80');
    el.setAttribute('class', `xray__item xray__item--${name}`);
    el.innerHTML = ITEMS[name];
    layer.append(el);
    return el;
  });
  section.prepend(layer);

  const reduced = prefersReducedMotion();
  const perFlash = LITE ? 4 : 7;

  const placeItems = () => {
    const slots = shuffle(SLOTS);
    const chosen = shuffle(items).slice(0, perFlash);
    items.forEach((el) => el.classList.remove('is-on'));
    chosen.forEach((el, i) => {
      const slot = slots[i];
      el.style.left = `${slot.x}%`;
      el.style.top = `${slot.y}%`;
      el.style.width = `${slot.w}%`;
      el.style.setProperty('--rot', `${Math.round(rand(-35, 35))}deg`);
      el.classList.add('is-on');
    });
  };

  const setColor = (index) => {
    const color = colors[index];
    section.style.setProperty('--xr', color);
    if (logoEl) {
      logoEl.style.filter = LITE
        ? `url(#xr-tint-${index})`
        : `url(#xr-tint-${index}) drop-shadow(0 0 10px ${color}) drop-shadow(0 0 28px ${color})`;
    }
  };
  const lightsOn = (index) => {
    setColor(index);
    section.classList.add('is-xray');
  };
  const lightsOff = () => {
    section.classList.remove('is-xray');
    if (logoEl) logoEl.style.filter = '';
  };

  let running = false;
  let busy = false;
  let timer = 0;

  // Un "escaneo": parpadeos rápidos cambiando de color y luego se queda prendido un momento
  const scan = async () => {
    if (busy || !running) return;
    busy = true;
    placeItems();
    let index = Math.floor(Math.random() * colors.length);
    const blinks = reduced ? 1 : Math.round(rand(3, 6));
    for (let i = 0; i < blinks && running; i++) {
      lightsOn(index);
      await wait(rand(60, 130));
      if (i < blinks - 1) {
        lightsOff();
        await wait(rand(40, 110));
      }
      index = (index + 1 + Math.floor(Math.random() * (colors.length - 1))) % colors.length;
    }
    if (running) {
      lightsOn(index);
      await wait(reduced ? 900 : rand(650, 1100));
    }
    lightsOff();
    busy = false;
    schedule();
  };

  const schedule = () => {
    clearTimeout(timer);
    if (running) timer = setTimeout(scan, rand(2600, 6200));
  };

  whileVisible(section, (on) => {
    running = on;
    if (on) schedule();
    else {
      clearTimeout(timer);
      lightsOff();
    }
  });
}
