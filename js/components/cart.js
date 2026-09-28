import { $, escapeHtml, lockScroll, trapFocus, prefersReducedMotion } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { BRAND } from '../config.js';
import { cartStore, changeQty, removeItem, clearCart, getLines, getTotals } from '../core/cart-store.js';
import { productVisual } from './product-art.js';
import { sound } from '../audio/sound-manager.js';
import { bus } from '../core/bus.js';
import { toast } from './toast.js';

/** Carrito lateral: líneas, cantidades, envío gratis y checkout. */
export function initCart() {
  const drawer = $('#cart');
  const list = $('[data-cart-lines]', drawer);
  const subtotal = $('[data-cart-subtotal]', drawer);
  const shipping = $('[data-cart-shipping]', drawer);
  const checkout = $('[data-cart-checkout]', drawer);
  const title = $('[data-cart-title]', drawer);
  let returnFocus = null;

  const render = (items) => {
    const lines = getLines(items);
    const totals = getTotals(items);
    title.textContent = `Carrito (${totals.count})`;
    subtotal.textContent = formatPrice(totals.subtotal);
    checkout.disabled = lines.length === 0;

    if (BRAND.freeShippingFrom > 0) {
      const missing = BRAND.freeShippingFrom - totals.subtotal;
      const progress = Math.min(1, totals.subtotal / BRAND.freeShippingFrom);
      shipping.hidden = false;
      shipping.innerHTML = `
        <p>${missing > 0 ? `Te faltan <strong>${formatPrice(missing)}</strong> para envío gratis` : '¡Tienes <strong>envío gratis</strong>! 🎉'}</p>
        <div class="shipping__bar"><span style="transform:scaleX(${progress})"></span></div>`;
    } else {
      shipping.hidden = true;
    }

    if (!lines.length) {
      list.innerHTML = `
        <li class="cart__empty">
          <p>Tu carrito está vacío.</p>
          <a href="#tienda" class="btn btn--ghost" data-cart-close data-sfx="click">Ir a la tienda</a>
        </li>`;
      return;
    }

    list.innerHTML = lines
      .map(({ key, product, size, color, qty }) => {
        const colorIndex = Math.max(0, product.colors.findIndex((c) => c.name === color));
        return `
        <li class="line" data-key="${escapeHtml(key)}">
          <div class="line__media">${productVisual(product, colorIndex)}</div>
          <div class="line__info">
            <p class="line__name">${escapeHtml(product.name)}</p>
            <p class="line__meta">${escapeHtml(color)} · Talla ${escapeHtml(size)}</p>
            <div class="qty qty--sm">
              <button type="button" data-line-qty="-1" aria-label="Menos">−</button>
              <span>${qty}</span>
              <button type="button" data-line-qty="1" aria-label="Más">+</button>
            </div>
          </div>
          <div class="line__side">
            <p class="line__price">${formatPrice(product.price * qty)}</p>
            <button type="button" class="line__remove" data-line-remove>Quitar</button>
          </div>
        </li>`;
      })
      .join('');
  };

  const open = () => {
    if (drawer.classList.contains('is-open')) return;
    returnFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    lockScroll('cart', true);
    sound.play('open');
    $('[data-cart-close]', drawer).focus({ preventScroll: true });
  };

  const close = () => {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    lockScroll('cart', false);
    sound.play('close');
    setTimeout(() => (drawer.hidden = true), 450);
    returnFocus?.focus?.({ preventScroll: true });
  };

  drawer.addEventListener('click', (event) => {
    const t = event.target;
    if (t === drawer || t.closest('[data-cart-close]')) return close();

    const line = t.closest('[data-key]');
    if (!line) return;
    const qty = t.closest('[data-line-qty]');
    if (qty) {
      const delta = Number(qty.dataset.lineQty);
      changeQty(line.dataset.key, delta);
      sound.play(delta > 0 ? 'tick' : 'remove');
    }
    if (t.closest('[data-line-remove]')) {
      line.classList.add('is-removing');
      sound.play('remove');
      setTimeout(() => removeItem(line.dataset.key), 250);
    }
  });

  checkout.addEventListener('click', () => {
    const lines = getLines();
    if (!lines.length) return;
    const { subtotal: total } = getTotals();

    if (BRAND.whatsapp) {
      const text = [
        `Hola ${BRAND.name}, quiero hacer este pedido:`,
        ...lines.map((l) => `• ${l.qty} x ${l.product.name} (${l.color}, ${l.size}) — ${formatPrice(l.qty * l.product.price)}`),
        `Total: ${formatPrice(total)}`,
      ].join('\n');
      window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }

    sound.play('success');
    toast(BRAND.whatsapp ? 'Te llevamos a WhatsApp para confirmar ✨' : 'Pedido de prueba realizado ✨', 'success', 3500);
    celebrate();
    clearCart();
    close();
  });

  document.addEventListener('keydown', (event) => {
    if (!drawer.classList.contains('is-open')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') trapFocus(event, drawer);
  });

  bus.on('cart:open', open);
  bus.on('cart:close', close);
  bus.on('cart:fly', flyToCart);

  render(cartStore.get().items);
  cartStore.subscribe((state) => render(state.items));
}

/** Anima una "bolita" desde el producto hasta el ícono del carrito. */
function flyToCart({ from, color }) {
  const target = document.querySelector('[data-open-cart]');
  if (!from || !target || prefersReducedMotion()) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  // Si la cabecera está entrando/saliendo, apuntamos a su posición final
  const header = target.closest('.header');
  const offsetY = header ? new DOMMatrixReadOnly(getComputedStyle(header).transform).m42 : 0;
  const dot = document.createElement('div');
  dot.className = 'fly-dot';
  dot.style.background = color;
  dot.style.left = `${a.left + a.width / 2}px`;
  dot.style.top = `${a.top + a.height / 2}px`;
  document.body.append(dot);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top - offsetY + b.height / 2 - (a.top + a.height / 2);
  dot
    .animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy - 120}px)) scale(0.8)`, offset: 0.5 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2)`, opacity: 0.6 },
      ],
      { duration: 800, easing: 'cubic-bezier(.5,0,.3,1)' },
    )
    .finished.then(() => dot.remove());
}

/** Confeti ligero en canvas al completar el pedido. */
function celebrate() {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const colors = ['#d4ff3a', '#ff4d2e', '#f2f0ea', '#b9a6ff', '#2f5bff'];
  const pieces = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2,
    y: innerHeight * 0.6,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 16 - 6,
    size: 5 + Math.random() * 7,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[(Math.random() * colors.length) | 0],
  }));

  const start = performance.now();
  const frame = (now) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces.forEach((p) => {
      p.vy += 0.4;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });
    if (now - start < 2600) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
