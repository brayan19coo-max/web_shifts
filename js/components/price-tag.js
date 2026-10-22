import { DROP } from '../config.js';
import { escapeHtml } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';

/**
 * Precio y círculos de color de las prendas.
 * - Las prendas de un drop muestran el precio PIXELADO hasta la fecha de
 *   lanzamiento (DROP.releaseDate) y no se pueden comprar antes.
 * - Los colores con `bullet` ('uzi' | 'glock') muestran una bala del color
 *   del estampado (`accent`) centrada en el círculo.
 */
const release = new Date(DROP.releaseDate).getTime();

export const isPriceLocked = (product) => Boolean(product.drop) && Date.now() < release;

export function releaseLabel() {
  return new Date(release).toLocaleString('es-CO', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: DROP.timeZone });
}

/** HTML del precio (o el precio pixelado si aún no sale el drop). */
export function priceHTML(product) {
  if (isPriceLocked(product)) {
    return `<span class="price-pixel" data-pixel-price="${escapeHtml(formatPrice(product.price))}" role="img" aria-label="Precio: se revela el ${escapeHtml(releaseLabel())}"></span>`;
  }
  return formatPrice(product.price);
}

/** Convierte los [data-pixel-price] en un precio pixelado (mosaico). */
export function pixelatePrices(root) {
  root.querySelectorAll('[data-pixel-price]').forEach((el) => {
    if (el.firstChild) return;
    const text = el.dataset.pixelPrice;
    const size = parseFloat(getComputedStyle(el).fontSize) || 16;
    const BLOCK = Math.max(5, Math.round(size / 2.4)); // bloques grandes: no se alcanza a leer
    const full = document.createElement('canvas').getContext('2d');
    full.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
    const w = Math.ceil(full.measureText(text).width) + 4;
    const h = Math.ceil(size * 1.3);
    const big = document.createElement('canvas');
    big.width = w; big.height = h;
    const b = big.getContext('2d');
    b.font = full.font; b.textBaseline = 'middle'; b.fillStyle = getComputedStyle(el).color || '#fff';
    b.fillText(text, 2, h / 2);
    const small = document.createElement('canvas');
    small.width = Math.ceil(w / BLOCK); small.height = Math.ceil(h / BLOCK);
    small.getContext('2d').drawImage(big, 0, 0, small.width, small.height);
    small.style.width = `${small.width * BLOCK}px`;
    small.style.height = `${small.height * BLOCK}px`;
    el.append(small);
  });
}

const BULLETS = {
  // 9 mm de Glock: corta, punta redonda
  glock: '<path class="b-tip" d="M7.4 9.6V7.6C7.4 4.6 8.6 3 10 3s2.6 1.6 2.6 4.6v2Z"/><path class="b-case" d="M7.4 9.6h5.2v6.6H7.4Z"/><path class="b-rim" d="M6.9 16.2h6.2v1.4H6.9Z"/>',
  // Mini Uzi: más larga y afilada, con ranura en el casquillo
  uzi: '<path class="b-tip" d="M8 9.4V6.6C8 4.2 8.9 2.3 10 1.6c1.1.7 2 2.6 2 5v2.8Z"/><path class="b-case" d="M8 9.4h4v7.2H8Z"/><path class="b-rim" d="M7.5 16.6h5v.9h-5Zm.5 1.5h4v.8H8Z"/>',
};

/** Contenido interno de un círculo de color (la bala, si tiene). */
export function swatchInner(color) {
  if (!color?.bullet || !BULLETS[color.bullet]) return '';
  return `<svg class="swatch__bullet" viewBox="0 0 20 20" aria-hidden="true" style="--accent:${escapeHtml(color.accent || '#e3151a')}">${BULLETS[color.bullet]}</svg>`;
}
