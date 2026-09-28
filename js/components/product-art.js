import { BRAND } from '../config.js';
import { escapeHtml } from '../utils/dom.js';

/**
 * Ilustraciones SVG de prendas, teñidas con el color elegido.
 * Sirven de placeholder hasta que tengas fotos: si el producto
 * define `images`, se muestra la foto en su lugar.
 */

const SHAPES = {
  tee: `
    <path class="g-body" d="M62 42 L86 30 Q100 44 114 30 L138 42 L170 72 L150 92 L138 82 L138 172 L62 172 L62 82 L50 92 L30 72 Z"/>
    <path class="g-line" d="M86 30 Q100 50 114 30"/>
    <image class="g-print" href="{{LOGO}}" x="72" y="86" width="56" height="34"/>`,
  hoodie: `
    <path class="g-body" d="M64 54 L82 40 Q100 30 118 40 L136 54 L166 132 L148 140 L138 100 L138 174 L62 174 L62 100 L52 140 L34 132 Z"/>
    <path class="g-shade" d="M80 42 Q100 8 120 42 Q112 62 100 62 Q88 62 80 42 Z"/>
    <path class="g-line" d="M94 62 L92 84 M106 62 L108 84"/>
    <path class="g-line" d="M76 132 H124 L130 158 H70 Z"/>
    <image class="g-print" href="{{LOGO}}" x="78" y="92" width="44" height="26"/>`,
  jacket: `
    <path class="g-body" d="M64 44 L84 32 L100 44 L116 32 L136 44 L166 136 L148 142 L138 96 L138 172 L62 172 L62 96 L52 142 L34 136 Z"/>
    <path class="g-shade" d="M84 32 L100 58 L116 32 L108 30 L100 42 L92 30 Z"/>
    <path class="g-line" d="M100 58 V172"/>
    <path class="g-line" d="M72 124 H88 M112 124 H128"/>`,
  pants: `
    <path class="g-body" d="M66 28 H134 L146 176 H110 L100 78 L90 176 H54 Z"/>
    <path class="g-line" d="M66 40 H134"/>
    <path class="g-shade" d="M58 104 H80 V132 H58 Z M120 104 H142 V132 H120 Z"/>`,
  cap: `
    <path class="g-body" d="M48 124 Q48 58 100 58 Q152 58 152 124 Z"/>
    <path class="g-shade" d="M40 124 H176 Q172 138 150 138 H44 Z"/>
    <path class="g-line" d="M100 58 V124 M74 66 Q84 96 80 124 M126 66 Q116 96 120 124"/>
    <circle class="g-shade" cx="100" cy="58" r="5"/>`,
  tote: `
    <path class="g-line g-handle" d="M76 74 Q76 30 100 30 Q124 30 124 74"/>
    <path class="g-body" d="M52 72 H148 L154 176 H46 Z"/>
    <image class="g-print" href="{{LOGO}}" x="62" y="100" width="76" height="45"/>`,
};

/** Devuelve true si el color es claro (para decidir el color de las líneas). */
function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

export function garmentSvg(type, hex) {
  const light = isLight(hex);
  const shape = (SHAPES[type] || SHAPES.tee).replaceAll('{{LOGO}}', escapeHtml(BRAND.logo));
  return `
    <svg class="garment" viewBox="0 0 200 200" aria-hidden="true"
      style="--g-fill:${hex};--g-ink:${light ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.5)'};--g-shade:${light ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.1)'}">
      ${shape}
    </svg>`;
}

/** Visual del producto: foto si existe, si no la ilustración. */
export function productVisual(product, colorIndex = 0) {
  const color = product.colors[colorIndex] || product.colors[0];
  const image = product.images?.[colorIndex];
  if (image) {
    return `<img class="product-photo" src="${escapeHtml(image)}" alt="${escapeHtml(`${product.name} ${color.name}`)}" loading="lazy">`;
  }
  return garmentSvg(product.type, color.hex);
}
