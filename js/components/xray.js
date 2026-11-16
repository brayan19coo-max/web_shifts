import { prefersReducedMotion } from '../utils/dom.js';
import { LITE, whileVisible } from '../utils/perf.js';
import { XRAY_DIR, XRAY_IMAGES } from '../data/xray-items.js';

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

// Radiografías: partes densas (metal, balas) más brillantes, como en un escáner. viewBox 0 0 240 160.
const ITEMS = {
  pistola: `<path d="M26 58H196V70H120L114 70Q114 98 88 98L84 98L78 146H36L46 92Q30 86 30 72Z" fill="currentColor" fill-opacity="0.13"/><rect x="22" y="34" width="176" height="24" rx="3" fill="currentColor" fill-opacity="0.16"/><rect x="58" y="40" width="142" height="10" rx="2" fill="currentColor" fill-opacity="0.5"/><line x1="62" y1="45" x2="198" y2="45" stroke-width=".8"/><rect x="110" y="36" width="30" height="6" fill="currentColor" fill-opacity="0.04"/><rect x="188" y="29" width="6" height="6" fill="currentColor" fill-opacity="0.6"/><rect x="26" y="29" width="9" height="6" fill="currentColor" fill-opacity="0.6"/><rect x="30" y="43" width="26" height="4" fill="currentColor" fill-opacity="0.75"/><polyline points="120.0,60 126.0,68 132.0,60 138.0,68 144.0,60 150.0,68 156.0,60 162.0,68 168.0,60 174.0,68 180.0,60 186.0,68 192.0,60" fill="none" stroke-width="1.1"/><line x1="30" y1="37" x2="30" y2="55" stroke-opacity=".5"/><line x1="34" y1="37" x2="34" y2="55" stroke-opacity=".5"/><line x1="38" y1="37" x2="38" y2="55" stroke-opacity=".5"/><line x1="42" y1="37" x2="42" y2="55" stroke-opacity=".5"/><line x1="46" y1="37" x2="46" y2="55" stroke-opacity=".5"/><line x1="50" y1="37" x2="50" y2="55" stroke-opacity=".5"/><line x1="54" y1="37" x2="54" y2="55" stroke-opacity=".5"/><path d="M52 78H84L78 142H44Z" fill="currentColor" fill-opacity="0.28"/><rect x="54.5" y="82.0" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="53.6" y="89.3" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="52.7" y="96.6" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="51.8" y="103.9" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="50.9" y="111.2" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="49.9" y="118.5" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="49.0" y="125.8" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="48.1" y="133.1" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><path d="M110 70Q110 92 90 92L90 87Q104 87 104 70Z" fill="currentColor" fill-opacity="0.3"/><path d="M96 70Q103 80 96 90" fill="none" stroke-width="2.2"/><circle cx="62" cy="64" r="2.6" fill="currentColor" fill-opacity="0.95"/><circle cx="160" cy="64" r="2.6" fill="currentColor" fill-opacity="0.95"/>`,
  uzi: `<path d="M40 46L8 50V58L40 60" fill="none" stroke-width="2"/><rect x="6" y="48" width="6" height="54" rx="2" fill="currentColor" fill-opacity="0.3"/><rect x="40" y="40" width="150" height="28" rx="3" fill="currentColor" fill-opacity="0.15"/><rect x="70" y="44" width="92" height="18" rx="2" fill="currentColor" fill-opacity="0.38"/><polyline points="44.0,46 47.2,60 50.5,46 53.8,60 57.0,46 60.2,60 63.5,46 66.8,60 70.0,46" fill="none" stroke-width="1.1"/><rect x="188" y="44" width="9" height="20" fill="currentColor" fill-opacity="0.55"/><rect x="196" y="48" width="34" height="11" rx="2" fill="currentColor" fill-opacity="0.45"/><line x1="198" y1="53.5" x2="230" y2="53.5" stroke-width=".8"/><circle cx="150" cy="36" r="5" fill="currentColor" fill-opacity="0.6"/><line x1="46" y1="41" x2="46" y2="44" stroke-opacity=".6"/><line x1="54" y1="41" x2="54" y2="44" stroke-opacity=".6"/><line x1="62" y1="41" x2="62" y2="44" stroke-opacity=".6"/><line x1="70" y1="41" x2="70" y2="44" stroke-opacity=".6"/><line x1="78" y1="41" x2="78" y2="44" stroke-opacity=".6"/><line x1="86" y1="41" x2="86" y2="44" stroke-opacity=".6"/><line x1="94" y1="41" x2="94" y2="44" stroke-opacity=".6"/><line x1="102" y1="41" x2="102" y2="44" stroke-opacity=".6"/><line x1="110" y1="41" x2="110" y2="44" stroke-opacity=".6"/><line x1="118" y1="41" x2="118" y2="44" stroke-opacity=".6"/><line x1="126" y1="41" x2="126" y2="44" stroke-opacity=".6"/><line x1="134" y1="41" x2="134" y2="44" stroke-opacity=".6"/><line x1="142" y1="41" x2="142" y2="44" stroke-opacity=".6"/><line x1="150" y1="41" x2="150" y2="44" stroke-opacity=".6"/><line x1="158" y1="41" x2="158" y2="44" stroke-opacity=".6"/><line x1="166" y1="41" x2="166" y2="44" stroke-opacity=".6"/><line x1="174" y1="41" x2="174" y2="44" stroke-opacity=".6"/><line x1="182" y1="41" x2="182" y2="44" stroke-opacity=".6"/><path d="M102 68H136L130 140H98Z" fill="currentColor" fill-opacity="0.14"/><path d="M108 68H128L126 156H106Z" fill="currentColor" fill-opacity="0.3"/><rect x="109.5" y="72" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="109.4" y="80" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="109.3" y="88" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="109.2" y="96" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="109.1" y="104" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="109.0" y="112" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="108.9" y="120" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="108.8" y="128" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="108.7" y="136" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="108.6" y="144" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><path d="M136 68Q162 70 162 94L155 94Q155 77 136 76Z" fill="currentColor" fill-opacity="0.28"/><path d="M140 70Q146 80 141 88" fill="none" stroke-width="2.2"/>`,
  revolver: `<path d="M62 74Q50 110 40 140L74 146Q78 112 94 82Z" fill="currentColor" fill-opacity="0.13"/><polyline transform="rotate(-62 68 100)" points="56.0,96 60.0,104 64.0,96 68.0,104 72.0,96 76.0,104 80.0,96" fill="none" stroke-width="1.1"/><circle cx="62" cy="114" r="3.2" fill="currentColor" fill-opacity="0.95"/><path d="M60 34H132V74H112L104 82H78L70 74H60Z" fill="currentColor" fill-opacity="0.15"/><path d="M60 34L46 20L55 15L69 33Z" fill="currentColor" fill-opacity="0.42"/><rect x="120" y="40" width="102" height="15" rx="2" fill="currentColor" fill-opacity="0.2"/><rect x="122" y="45.5" width="99" height="4" fill="currentColor" fill-opacity="0.62"/><rect x="132" y="57" width="62" height="5" rx="2" fill="currentColor" fill-opacity="0.42"/><rect x="214" y="33" width="6" height="7" fill="currentColor" fill-opacity="0.6"/><rect x="78" y="38" width="44" height="34" rx="6" fill="currentColor" fill-opacity="0.24"/><rect x="81" y="41" width="38" height="8" rx="3.5" fill="currentColor" fill-opacity="0.75"/><rect x="81" y="52" width="38" height="8" rx="3.5" fill="currentColor" fill-opacity="0.75"/><rect x="81" y="63" width="38" height="8" rx="3.5" fill="currentColor" fill-opacity="0.75"/><path d="M94 82Q98 104 118 102V96Q104 96 102 82Z" fill="currentColor" fill-opacity="0.28"/><path d="M100 82Q106 90 101 98" fill="none" stroke-width="2.2"/><circle cx="100" cy="56" r="2.4" fill="currentColor" fill-opacity="0.95"/>`,
  cuchillo: `<path d="M14 72Q64 44 150 47V80H42Q22 80 14 72Z" fill="currentColor" fill-opacity="0.3"/><path d="M22 73Q70 71 148 73" fill="none" stroke-opacity=".6"/><line x1="62" y1="58" x2="142" y2="56" stroke-width="2.4" stroke-opacity=".7"/><rect x="150" y="57" width="78" height="13" rx="2" fill="currentColor" fill-opacity="0.55"/><rect x="144" y="36" width="11" height="54" rx="3" fill="currentColor" fill-opacity="0.62"/><path d="M155 49H222Q234 49 234 63.5Q234 78 222 78H155Z" fill="currentColor" fill-opacity="0.1"/><circle cx="172" cy="63.5" r="4.2" fill="currentColor" fill-opacity="0.95"/><circle cx="193" cy="63.5" r="4.2" fill="currentColor" fill-opacity="0.95"/><circle cx="214" cy="63.5" r="4.2" fill="currentColor" fill-opacity="0.95"/><circle cx="228" cy="63.5" r="2.6" fill="none"/>`,
  navaja: `<rect x="118" y="70" width="104" height="26" rx="13" fill="currentColor" fill-opacity="0.12"/><rect x="124" y="75" width="92" height="16" rx="8" fill="currentColor" fill-opacity="0.3"/><line x1="140" y1="77" x2="206" y2="77" stroke-width="2" stroke-opacity=".8"/><path d="M128 77L44 56Q20 52 12 62L126 92Z" fill="currentColor" fill-opacity="0.32"/><path d="M20 63L124 88" fill="none" stroke-opacity=".6"/><circle cx="128" cy="83" r="6.5" fill="currentColor" fill-opacity="0.85"/><circle cx="208" cy="83" r="3.2" fill="currentColor" fill-opacity="0.95"/><circle cx="62" cy="64" r="3" fill="none"/>`,
  balas: `<rect x="50" y="70" width="26" height="74" rx="2" fill="currentColor" fill-opacity="0.3"/><rect x="48" y="140" width="30" height="7" rx="1.5" fill="currentColor" fill-opacity="0.55"/><path d="M51 70V48Q63 12 75 48V70Z" fill="currentColor" fill-opacity="0.7"/><circle cx="63" cy="143.5" r="3.5" fill="currentColor" fill-opacity="0.95"/><circle cx="56" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="63" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="70" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="56" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="63" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="70" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="56" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="63" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="70" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="56" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="63" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="70" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><rect x="108" y="70" width="26" height="74" rx="2" fill="currentColor" fill-opacity="0.3"/><rect x="106" y="140" width="30" height="7" rx="1.5" fill="currentColor" fill-opacity="0.55"/><path d="M109 70V48Q121 12 133 48V70Z" fill="currentColor" fill-opacity="0.7"/><circle cx="121" cy="143.5" r="3.5" fill="currentColor" fill-opacity="0.95"/><circle cx="114" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="121" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="128" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="114" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="121" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="128" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="114" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="121" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="128" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="114" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="121" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="128" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><rect x="166" y="70" width="26" height="74" rx="2" fill="currentColor" fill-opacity="0.3"/><rect x="164" y="140" width="30" height="7" rx="1.5" fill="currentColor" fill-opacity="0.55"/><path d="M167 70V48Q179 12 191 48V70Z" fill="currentColor" fill-opacity="0.7"/><circle cx="179" cy="143.5" r="3.5" fill="currentColor" fill-opacity="0.95"/><circle cx="172" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="179" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="186" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="172" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="179" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="186" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="172" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="179" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="186" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="172" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="179" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="186" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/>`,
  manopla: `<path d="M14 66Q14 40 40 40H204Q228 40 228 64V72Q228 104 196 112H52Q14 108 14 80Z" fill="currentColor" fill-opacity="0.22"/><circle cx="52" cy="64" r="15" fill="currentColor" fill-opacity="0.0" stroke-width="1.2"/><circle cx="52" cy="64" r="15" fill="#000" fill-opacity=".55" stroke="none"/><circle cx="94" cy="64" r="15" fill="currentColor" fill-opacity="0.0" stroke-width="1.2"/><circle cx="94" cy="64" r="15" fill="#000" fill-opacity=".55" stroke="none"/><circle cx="136" cy="64" r="15" fill="currentColor" fill-opacity="0.0" stroke-width="1.2"/><circle cx="136" cy="64" r="15" fill="#000" fill-opacity=".55" stroke="none"/><circle cx="178" cy="64" r="15" fill="currentColor" fill-opacity="0.0" stroke-width="1.2"/><circle cx="178" cy="64" r="15" fill="#000" fill-opacity=".55" stroke="none"/><path d="M40 96Q120 104 200 96" fill="none" stroke-opacity=".6"/>`,
};

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
  // Dibujos de armas (SVG) + radiografías en imagen
  const items = [
    ...Object.keys(ITEMS).map((name) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      el.setAttribute('viewBox', '0 0 240 160');
      el.setAttribute('class', `xray__item xray__item--${name}`);
      el.innerHTML = ITEMS[name];
      el.dataset.r = '1.5';
      return el;
    }),
    ...XRAY_IMAGES.map((img) => {
      const el = document.createElement('span');
      el.className = 'xray__item xray__item--img';
      el.dataset.src = XRAY_DIR + img.src; // la imagen se carga la primera vez que sale
      el.dataset.r = String(img.r);
      el.style.aspectRatio = String(img.r);
      return el;
    }),
  ];
  items.forEach((el) => layer.append(el));
  section.prepend(layer);

  const reduced = prefersReducedMotion();
  const narrow = () => window.innerWidth < 720;

  // Regadas por toda la sección: una cuadrícula con cada pieza corrida al azar
  // dentro de su casilla, con tamaño y giro distintos (bien relleno, nada en fila).
  const placeItems = () => {
    const cols = narrow() ? 3 : 6;
    const rows = narrow() ? 7 : 4;
    const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i));
    const count = Math.min(cells.length, LITE ? Math.round(cells.length * 0.6) : cells.length - 2);
    const chosen = shuffle(items).slice(0, count);
    items.forEach((el) => el.classList.remove('is-on'));
    chosen.forEach((el, i) => {
      const cell = cells[i];
      const cw = 100 / cols;
      const ch = 100 / rows;
      const r = Number(el.dataset.r) || 1;
      // ancho en % de la sección, más angosto si la pieza es alta
      const w = cw * rand(0.55, 0.9) * Math.min(1, Math.max(0.45, r / 1.3));
      el.style.width = `${w}%`;
      el.style.left = `${(cell % cols) * cw + rand(0, Math.max(0, cw - w))}%`;
      el.style.top = `${Math.floor(cell / cols) * ch + rand(0, ch * 0.45)}%`;
      el.style.setProperty('--rot', `${Math.round(rand(-28, 28))}deg`);
      if (el.dataset.src) {
        const url = `url("${el.dataset.src}")`;
        el.style.webkitMaskImage = url;
        el.style.maskImage = url;
        delete el.dataset.src;
      }
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
