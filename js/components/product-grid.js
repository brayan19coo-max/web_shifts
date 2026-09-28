import { $, escapeHtml, prefersReducedMotion } from '../utils/dom.js';
import { PRODUCTS, CATEGORIES } from '../data/products.js';
import { createProductCard } from './product-card.js';
import { sound } from '../audio/sound-manager.js';
import { bus } from '../core/bus.js';

/** Grilla de productos con filtros animados por categoría. */
export function initProductGrid() {
  const section = $('#tienda');
  const filters = $('[data-filters]', section);
  const grid = $('[data-grid]', section);
  const counter = $('[data-grid-count]', section);

  let active = 'all';

  filters.innerHTML = CATEGORIES.filter(
    (cat) => cat.id === 'all' || PRODUCTS.some((p) => p.category === cat.id),
  )
    .map(
      (cat) => `
      <button type="button" class="filter${cat.id === active ? ' is-active' : ''}" data-filter="${cat.id}"
        aria-pressed="${cat.id === active}" data-sfx-hover="hover">
        ${escapeHtml(cat.label)}
        <sup>${cat.id === 'all' ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === cat.id).length}</sup>
      </button>`,
    )
    .join('');

  const render = () => {
    const list = active === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === active);
    grid.replaceChildren(...list.map((product, i) => createProductCard(product, i)));
    counter.textContent = `${list.length} ${list.length === 1 ? 'pieza' : 'piezas'}`;
  };

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button || button.dataset.filter === active) return;
    active = button.dataset.filter;
    filters.querySelectorAll('[data-filter]').forEach((b) => {
      const on = b === button;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    sound.play('whoosh');

    if (prefersReducedMotion()) return render();
    grid.classList.add('is-leaving');
    setTimeout(() => {
      render();
      grid.classList.remove('is-leaving');
    }, 280);
  });

  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-quick-view]');
    if (!trigger) return;
    const card = trigger.closest('.card');
    bus.emit('quickview:open', { id: card.dataset.productId, colorIndex: card.getColorIndex() });
  });

  render();
}
