import { $, escapeHtml, lockScroll, trapFocus } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { getProduct } from '../data/products.js';
import { addItem } from '../core/cart-store.js';
import { productVisual } from './product-art.js';
import { sound } from '../audio/sound-manager.js';
import { bus } from '../core/bus.js';
import { toast } from './toast.js';

/** Modal de vista rápida: color, talla, cantidad y agregar al carrito. */
export function initQuickView() {
  const modal = $('#quick-view');
  const content = $('[data-qv-content]', modal);
  let product = null;
  let selection = { colorIndex: 0, size: null, qty: 1 };
  let returnFocus = null;

  const renderVisual = () => {
    $('[data-qv-visual]', content).innerHTML = productVisual(product, selection.colorIndex);
    $('[data-qv-color]', content).textContent = product.colors[selection.colorIndex].name;
  };

  const render = () => {
    const singleSize = product.sizes.length === 1;
    if (singleSize) selection.size = product.sizes[0];

    content.innerHTML = `
      <div class="qv__media" data-qv-visual></div>
      <div class="qv__body">
        ${product.tag ? `<span class="qv__tag">${escapeHtml(product.tag)}</span>` : ''}
        <h2 class="qv__name" id="qv-title">${escapeHtml(product.name)}</h2>
        <p class="qv__price">${formatPrice(product.price)}</p>
        <p class="qv__desc">${escapeHtml(product.description)}</p>

        <div class="qv__group">
          <p class="qv__label">Color — <span data-qv-color></span></p>
          <div class="qv__swatches">
            ${product.colors
              .map(
                (c, i) => `<button type="button" class="swatch swatch--lg${i === selection.colorIndex ? ' is-active' : ''}"
                  data-qv-swatch="${i}" aria-label="${escapeHtml(c.name)}" aria-pressed="${i === selection.colorIndex}"
                  style="--swatch:${c.hex}" data-sfx="tick"></button>`,
              )
              .join('')}
          </div>
        </div>

        <div class="qv__group">
          <p class="qv__label">Talla ${singleSize ? '' : '<span class="qv__hint" data-qv-hint>— elige una</span>'}</p>
          <div class="qv__sizes" data-qv-sizes>
            ${product.sizes
              .map(
                (s) => `<button type="button" class="size${s === selection.size ? ' is-active' : ''}" data-qv-size="${escapeHtml(s)}"
                  aria-pressed="${s === selection.size}" data-sfx="tick" data-sfx-hover="hover">${escapeHtml(s)}</button>`,
              )
              .join('')}
          </div>
        </div>

        <div class="qv__actions">
          <div class="qty" aria-label="Cantidad">
            <button type="button" data-qv-qty="-1" aria-label="Menos" data-sfx="tick">−</button>
            <span data-qv-qty-value>${selection.qty}</span>
            <button type="button" data-qv-qty="1" aria-label="Más" data-sfx="tick">+</button>
          </div>
          <button type="button" class="btn btn--accent btn--block" data-qv-add data-sfx-hover="hover">
            <span>Agregar al carrito</span><span class="btn__arrow">→</span>
          </button>
        </div>
      </div>`;
    renderVisual();
  };

  const open = ({ id, colorIndex = 0 }) => {
    product = getProduct(id);
    if (!product) return;
    selection = { colorIndex, size: null, qty: 1 };
    returnFocus = document.activeElement;
    render();
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    lockScroll('quickview', true);
    sound.play('open');
    $('[data-qv-close]', modal).focus({ preventScroll: true });
  };

  const close = () => {
    if (modal.hidden) return;
    modal.classList.remove('is-open');
    lockScroll('quickview', false);
    sound.play('close');
    setTimeout(() => (modal.hidden = true), 350);
    returnFocus?.focus?.({ preventScroll: true });
  };

  modal.addEventListener('click', (event) => {
    const t = event.target;
    if (t.closest('[data-qv-close]') || t === modal) return close();

    const swatch = t.closest('[data-qv-swatch]');
    if (swatch) {
      selection.colorIndex = Number(swatch.dataset.qvSwatch);
      content.querySelectorAll('[data-qv-swatch]').forEach((s) => {
        s.classList.toggle('is-active', s === swatch);
        s.setAttribute('aria-pressed', String(s === swatch));
      });
      return renderVisual();
    }

    const size = t.closest('[data-qv-size]');
    if (size) {
      selection.size = size.dataset.qvSize;
      content.querySelectorAll('[data-qv-size]').forEach((s) => {
        s.classList.toggle('is-active', s === size);
        s.setAttribute('aria-pressed', String(s === size));
      });
      $('[data-qv-hint]', content)?.classList.remove('is-error');
      return;
    }

    const qty = t.closest('[data-qv-qty]');
    if (qty) {
      selection.qty = Math.max(1, Math.min(10, selection.qty + Number(qty.dataset.qvQty)));
      $('[data-qv-qty-value]', content).textContent = selection.qty;
      return;
    }

    if (t.closest('[data-qv-add]')) {
      if (!selection.size) {
        sound.play('error');
        const sizes = $('[data-qv-sizes]', content);
        sizes.classList.remove('is-shake');
        void sizes.offsetWidth;
        sizes.classList.add('is-shake');
        $('[data-qv-hint]', content)?.classList.add('is-error');
        return;
      }
      addItem({
        id: product.id,
        size: selection.size,
        color: product.colors[selection.colorIndex].name,
        qty: selection.qty,
      });
      sound.play('add');
      bus.emit('cart:fly', { from: $('[data-qv-visual]', content), color: product.colors[selection.colorIndex].hex });
      toast(`${product.name} (${selection.size}) agregado`, 'success');
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (modal.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') trapFocus(event, modal);
  });

  bus.on('quickview:open', open);
}
