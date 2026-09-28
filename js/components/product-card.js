import { html, escapeHtml, isFinePointer, prefersReducedMotion } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { productVisual } from './product-art.js';

/**
 * Tarjeta de producto con inclinación 3D y brillo que sigue al mouse.
 * Los swatches cambian el color de la prenda en vivo.
 */
export function createProductCard(product, index = 0) {
  const card = html(`
    <article class="card" style="--i:${index}" data-product-id="${product.id}">
      <button class="card__media" type="button" data-quick-view data-cursor="Ver" data-sfx-hover="hover"
        aria-label="Vista rápida: ${escapeHtml(product.name)}">
        <span class="card__visual">${productVisual(product, 0)}</span>
        <span class="card__glare" aria-hidden="true"></span>
        ${product.tag ? `<span class="card__tag">${escapeHtml(product.tag)}</span>` : ''}
        <span class="card__quick" aria-hidden="true">Vista rápida +</span>
      </button>
      <div class="card__info">
        <div>
          <h3 class="card__name">${escapeHtml(product.name)}</h3>
          <p class="card__price">${formatPrice(product.price)}</p>
        </div>
        <div class="card__swatches" role="radiogroup" aria-label="Colores">
          ${product.colors
            .map(
              (color, i) => `
            <button type="button" class="swatch${i === 0 ? ' is-active' : ''}" role="radio"
              aria-checked="${i === 0}" aria-label="${escapeHtml(color.name)}" title="${escapeHtml(color.name)}"
              data-color-index="${i}" data-sfx="tick" style="--swatch:${color.hex}"></button>`,
            )
            .join('')}
        </div>
      </div>
    </article>`);

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
  });

  card.getColorIndex = () => colorIndex;

  if (isFinePointer() && !prefersReducedMotion()) {
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
