import { $, $$, lockScroll } from '../utils/dom.js';
import { BRAND } from '../config.js';
import { bus } from '../core/bus.js';
import { cartStore, getTotals } from '../core/cart-store.js';
import { sound } from '../audio/sound-manager.js';

/**
 * Cabecera: logo, navegación, controles de sonido/música,
 * contador del carrito y menú móvil. Se oculta al bajar y
 * reaparece al subir.
 */
export function initHeader() {
  const header = $('#header');
  const count = $('[data-cart-count]', header);
  const sfxBtn = $('[data-toggle-sfx]', header);
  const musicBtn = $('[data-toggle-music]', header);
  const menuBtn = $('[data-menu-toggle]', header);
  const menu = $('#mobile-menu');

  $$('[data-brand-name]').forEach((el) => (el.textContent = BRAND.name));

  // --- Carrito
  $('[data-open-cart]', header).addEventListener('click', () => bus.emit('cart:open'));

  let lastCount = getTotals().count;
  const renderCount = (items) => {
    const { count: total } = getTotals(items);
    count.textContent = total;
    count.hidden = total === 0;
    if (total > lastCount) {
      count.classList.remove('is-bump');
      void count.offsetWidth; // reinicia la animación
      count.classList.add('is-bump');
      header.classList.remove('is-hidden'); // que se vea el carrito al agregar
    }
    lastCount = total;
  };
  renderCount(cartStore.get().items);
  cartStore.subscribe((state) => renderCount(state.items));

  // --- Sonido
  const renderSound = ({ sfxOn, musicOn }) => {
    sfxBtn.setAttribute('aria-pressed', String(sfxOn));
    sfxBtn.querySelector('[data-label]').textContent = sfxOn ? 'Sonido on' : 'Sonido off';
    musicBtn.setAttribute('aria-pressed', String(musicOn));
    musicBtn.classList.toggle('is-playing', musicOn);
  };
  renderSound(sound.state);
  bus.on('sound:change', renderSound);

  sfxBtn.addEventListener('click', async () => {
    await sound.unlock();
    sound.toggleSfx();
    sound.play('click');
  });
  musicBtn.addEventListener('click', () => sound.toggleMusic());

  // --- Menú móvil
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    lockScroll('menu', open);
    sound.play(open ? 'open' : 'close');
  };
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
  });

  // --- Ocultar al hacer scroll hacia abajo
  let lastY = scrollY;
  window.addEventListener(
    'scroll',
    () => {
      const y = scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', y > lastY && y > 300 && !menu.classList.contains('is-open'));
      lastY = y;
    },
    { passive: true },
  );
}
