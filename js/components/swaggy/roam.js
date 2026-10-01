import { html } from '../../utils/dom.js';
import { storage } from '../../utils/storage.js';
import { SWAGGY } from '../../config.js';
import { sound } from '../../audio/sound-manager.js';
import { bus } from '../../core/bus.js';
import { cartStore, getTotals } from '../../core/cart-store.js';
import { swaggySvg, talk } from './art.js';
import { toast } from '../toast.js';

/**
 * Swaggy por la página
 * -------------------------------------------------------------
 * - Se asoma por un borde de la pantalla al llegar a cada sección
 *   (una vez por visita, sin saturar: máximo uno cada 14 s).
 * - Reacciona al carrito: celebra al agregar, se pone triste al quitar
 *   y baila cuando se hace el pedido.
 * - Está escondido en algún lugar de la página: si lo encuentras y lo
 *   tocas, te dice algo (a veces una pista) y se esconde en otro lado.
 * (Su aparición en la bóveda del drop está en vault.js.)
 */
const SECTIONS = [
  { key: 'tienda', selector: '#tienda', side: 'right' },
  { key: 'drop', selector: '#drop', side: 'left' },
  { key: 'lookbook', selector: '#lookbook', side: 'bottom' },
  { key: 'nosotros', selector: '#nosotros', side: 'right' },
  { key: 'crew', selector: '#crew', side: 'left' },
  { key: 'footer', selector: '.footer', side: 'bottom' },
];
const HIDEOUTS = ['#tienda', '#nosotros', '#crew', '.footer'];
const COOLDOWN = 14000;

const pick = (list = []) => list[Math.floor(Math.random() * list.length)] || '';
const root = document.documentElement;
const parcheOpen = () => !!document.querySelector('.parche');

export function initSwaggyRoam() {
  const phrases = SWAGGY.phrases || {};

  // ---------- El que se asoma ----------
  const roam = html(`
    <div class="swaggy-roam" data-side="right" aria-hidden="true">
      <p class="swaggy-roam__bubble"></p>
      <div class="swaggy-roam__fig">${swaggySvg('chill', { rig: true })}</div>
    </div>`);
  document.body.append(roam);
  const fig = roam.querySelector('.swaggy-roam__fig');
  const svg = roam.querySelector('svg');
  const bubble = roam.querySelector('.swaggy-roam__bubble');
  let hideTimer = 0;
  let actionTimer = 0;
  let lastShow = 0;

  const act = (name, ms = 1200) => {
    clearTimeout(actionTimer);
    delete svg.dataset.action;
    void svg.getBoundingClientRect();
    svg.dataset.action = name;
    actionTimer = setTimeout(() => delete svg.dataset.action, ms);
  };

  function show({ side = 'right', mood = 'happy', action = 'wave', text = '', ms = 3800 }) {
    if (parcheOpen()) return false;
    clearTimeout(hideTimer);
    const wasIn = roam.classList.contains('is-in') && roam.dataset.side === side;
    if (!wasIn) {
      roam.classList.remove('is-in', 'is-talking');
      roam.dataset.side = side;
      void roam.offsetWidth;
    }
    svg.dataset.mood = mood;
    // Mira hacia el centro de la pantalla
    svg.style.setProperty('--lx', side === 'right' ? '-0.8' : side === 'left' ? '0.8' : '0');
    svg.style.setProperty('--ly', side === 'bottom' ? '-0.6' : '0');
    roam.classList.add('is-in');
    bubble.textContent = text;
    setTimeout(() => {
      roam.classList.toggle('is-talking', !!text);
      talk(svg, text);
      if (action) act(action, action === 'dance' ? ms : 1600);
    }, wasIn ? 0 : 420);
    lastShow = Date.now();
    hideTimer = setTimeout(hide, ms);
    return true;
  }

  function hide() {
    roam.classList.remove('is-talking');
    setTimeout(() => roam.classList.remove('is-in'), 250);
  }

  // Si lo tocas mientras se asoma, salta y se va
  fig.addEventListener('click', () => {
    sound.play('note', { index: Math.floor(Math.random() * 8) });
    svg.dataset.mood = 'party';
    act(pick(['flip', 'spin', 'jump']), 950);
    bubble.textContent = pick(phrases.tap);
    roam.classList.add('is-talking');
    talk(svg, bubble.textContent);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 2200);
  });

  // ---------- Se asoma en las secciones ----------
  const seen = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const sec = SECTIONS.find((s) => entry.target.matches(s.selector));
        if (!sec || seen.has(sec.key)) return;
        if (!root.classList.contains('is-entered') || root.classList.contains('is-locked')) return;
        if (Date.now() - lastShow < COOLDOWN || document.hidden) return;
        const text = pick(phrases.sections?.[sec.key]);
        if (!text) return;
        if (show({ side: sec.side, mood: 'chill', action: pick(['wave', 'glasses', 'look', 'wave']), text })) {
          seen.add(sec.key);
        }
      });
    },
    { rootMargin: '-45% 0px -45% 0px' }, // cuando la sección cruza la mitad de la pantalla
  );
  SECTIONS.forEach(({ selector }) => {
    const el = document.querySelector(selector);
    if (el) observer.observe(el);
  });

  // ---------- Reacciona al carrito ----------
  let count = getTotals().count;
  let checkingOut = false;
  bus.on('cart:checkout', () => (checkingOut = true));
  cartStore.subscribe((state) => {
    const next = getTotals(state.items).count;
    const prev = count;
    count = next;
    if (checkingOut) {
      checkingOut = false;
      setTimeout(() => show({ side: 'bottom', mood: 'party', action: 'dance', text: pick(phrases.checkout), ms: 3600 }), 500);
      return;
    }
    if (next > prev) show({ side: 'left', mood: 'party', action: 'dance', text: pick(phrases.cartAdd), ms: 3000 });
    else if (next < prev) show({ side: 'left', mood: 'sad', action: '', text: pick(phrases.cartRemove), ms: 3000 });
  });

  // ---------- Swaggy escondido ----------
  const data = storage.get('swaggy', {});
  const secret = html(`
    <button type="button" class="swaggy-secret" aria-label="Encontraste a ${SWAGGY.name}" data-cursor="¿Y esto?">
      <span class="swaggy-secret__peek">${swaggySvg('chill', { rig: true })}</span>
    </button>`);
  const secretSvg = secret.querySelector('svg');
  let lastHideout = '';

  function hideSecret() {
    const options = HIDEOUTS.filter((s) => s !== lastHideout && document.querySelector(s));
    const where = pick(options);
    if (!where) return;
    lastHideout = where;
    const host = document.querySelector(where);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    secret.style.left = `${22 + Math.random() * 60}%`;
    secret.classList.remove('is-found');
    secretSvg.dataset.mood = 'chill';
    host.append(secret);
  }

  secret.addEventListener('click', () => {
    if (secret.classList.contains('is-found')) return;
    secret.classList.add('is-found');
    secretSvg.dataset.mood = 'party';
    sound.play('spray');
    data.found = (data.found || 0) + 1;
    storage.set('swaggy', { ...storage.get('swaggy', {}), found: data.found });
    toast(`🦦 ${pick(phrases.secret)}`, 'success', 4200);
    // Se esconde en otro lado
    setTimeout(hideSecret, 1400);
  });

  // Se esconde un rato después de entrar, para no delatarse de una
  setTimeout(hideSecret, 3000);
}
