import { html, escapeHtml, isFinePointer } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { productVisual } from './product-art.js';
import { priceHTML, pixelatePrices, swatchInner } from './price-tag.js';
import { bus } from '../core/bus.js';

/**
 * Dónde va pegado el sticker de SOLD OUT: siempre encima del estampado, pero
 * cada camiseta (y cada color) con un giro y un corrimiento distinto, como pegado a mano.
 */
function stickerSpot(id, colorIndex) {
  let h = 2166136261;
  for (const ch of `${id}:${colorIndex}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const r = (k) => (((h >>> (k * 5)) & 1023) / 1023) * 2 - 1; // -1..1
  return `--st-rot:${(r(0) * 15).toFixed(1)}deg;--st-x:${(r(1) * 4).toFixed(1)}%;--st-y:${(2 + r(2) * 4).toFixed(1)}%;--st-s:${(1 + r(3) * 0.06).toFixed(2)}`;
}

/**
 * Tarjeta de producto con inclinación 3D y brillo que sigue al mouse.
 * Los swatches cambian el color de la prenda en vivo.
 */
export function createProductCard(product, index = 0) {
  const card = html(`
    <article class="card${product.soldOut ? ' card--soldout' : ''}${product.gallery ? ' card--photo' : ''}" style="--i:${index}" data-product-id="${product.id}">
      <button class="card__media" type="button" data-quick-view data-cursor="Ver" data-sfx-hover="hover"
        aria-label="Vista rápida: ${escapeHtml(product.name)}">
        <span class="card__visual">${productVisual(product, 0)}</span>
        <span class="card__glare" aria-hidden="true"></span>
        ${product.tag ? `<span class="card__tag">${escapeHtml(product.tag)}</span>` : ''}
        ${product.soldOut ? `<img class="card__stamp" src="assets/images/sold-out-sticker.svg" alt="" aria-hidden="true" style="${stickerSpot(product.id, 0)}">` : ''}
        <span class="card__quick" aria-hidden="true">${product.soldOut ? 'Ver detalles' : 'Vista rápida +'}</span>
      </button>
      <div class="card__info">
        <div>
          <h3 class="card__name">${escapeHtml(product.name)}</h3>
          <p class="card__price">${product.soldOut ? (product.price != null ? '<s>' + formatPrice(product.price) + '</s> · ' : '') + 'Sold out' : priceHTML(product)}</p>
        </div>
        <div class="card__swatches${product.colors.some((c) => c.bullet) ? ' card__swatches--bullets' : ''}" role="radiogroup" aria-label="Colores">
          ${product.colors
            .map(
              (color, i) => `
            <button type="button" class="swatch${i === 0 ? ' is-active' : ''}" role="radio"
              aria-checked="${i === 0}" aria-label="${escapeHtml(color.name)}" title="${escapeHtml(color.name)}"
              data-color-index="${i}" data-sfx="tick" style="--swatch:${color.hex}">${swatchInner(color)}</button>`,
            )
            .join('')}
        </div>
      </div>
    </article>`);

  requestAnimationFrame(() => pixelatePrices(card));
  let colorIndex = 0;
  const visual = card.querySelector('.card__visual');

  card.querySelector('.card__swatches').addEventListener('click', (event) => {
    const swatch = event.target.closest('[data-color-index]');
    if (!swatch) return;
    colorIndex = Number(swatch.dataset.colorIndex);
    card.querySelectorAll('.swatch').forEach((s) => {
      const active = s === swatch;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-checked', String(active));
    });
    visual.classList.remove('is-swapping');
    void visual.offsetWidth;
    visual.classList.add('is-swapping');
    visual.innerHTML = productVisual(product, colorIndex);
    const stamp = card.querySelector('.card__stamp');
    if (stamp) {
      stamp.setAttribute('style', stickerSpot(product.id, colorIndex));
      stamp.classList.remove('is-slap');
      void stamp.offsetWidth;
      stamp.classList.add('is-slap');
    }
  });

  card.getColorIndex = () => colorIndex;

  if (isFinePointer()) {
    const media = card.querySelector('.card__media');
    media.addEventListener('pointermove', (event) => {
      const rect = media.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      media.style.setProperty('--rx', `${(0.5 - y) * 12}deg`);
      media.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
      media.style.setProperty('--mx', `${x * 100}%`);
      media.style.setProperty('--my', `${y * 100}%`);
    });
    media.addEventListener('pointerleave', () => {
      media.style.removeProperty('--rx');
      media.style.removeProperty('--ry');
    });
  }

  return card;
}

/** Abre la vista rápida al hacer clic en cualquier tarjeta dentro de `container`. */
export function bindQuickView(container) {
  container.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-quick-view]');
    if (!trigger) return;
    const card = trigger.closest('.card');
    bus.emit('quickview:open', { id: card.dataset.productId, colorIndex: card.getColorIndex() });
  });
}
