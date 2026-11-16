import { html } from '../../utils/dom.js';
import { storage } from '../../utils/storage.js';
import { SWAGGY } from '../../config.js';
import { sound } from '../../audio/sound-manager.js';
import { bus } from '../../core/bus.js';
import { cartStore, getTotals } from '../../core/cart-store.js';
import { talk } from './art.js';
import { swaggy3d, mountSwaggy3d, preloadSwaggy3d, ACTION_TIME } from './sw3d.js';
import { LITE } from '../../utils/perf.js';
import { toast } from '../toast.js';
import { merged, seasonal, rare } from './phrases.js';
import { BRAND } from '../../config.js';
import { getProduct } from '../../data/products.js';
import { formatPrice } from '../../utils/format.js';

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
  const phrases = merged();
  // A veces dice una frase de la fecha (Navidad, quincena, viernes…) en vez de la normal
  const withSeason = (list, chance = 0.3) => {
    const dated = seasonal();
    return dated.length && Math.random() < chance ? pick(dated) : pick(list);
  };

  // ---------- El que se asoma ----------
  const roam = html(`
    <div class="swaggy-roam" data-side="right" aria-hidden="true">
      <p class="swaggy-roam__bubble"></p>
      <div class="swaggy-roam__fig">${swaggy3d('chill')}</div>
    </div>`);
  document.body.append(roam);
  const fig = roam.querySelector('.swaggy-roam__fig');
  const svg = mountSwaggy3d(roam);
  const bubble = roam.querySelector('.swaggy-roam__bubble');
  let hideTimer = 0;
  let actionTimer = 0;
  let lastShow = 0;

  const act = (name, ms = Math.round((ACTION_TIME[name] || 1.2) * 1000)) => {
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
      if (action) act(action, action === 'dance' ? ms : undefined);
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
    act(pick(['flip', 'highfive', 'jump']));
    bubble.textContent = rare() || pick(phrases.tap);
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
        const text = withSeason(phrases.sections?.[sec.key], 0.2);
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
  let subtotalBefore = getTotals().subtotal;
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
    if (next > prev) {
      // Envío gratis: avisa cuando lo desbloqueas o cuando te falta poquito
      const limit = BRAND.freeShippingFrom || 0;
      const { subtotal } = getTotals(state.items);
      let text = pick(phrases.cartAdd);
      if (limit && subtotal >= limit && subtotalBefore < limit) text = pick(phrases.freeShipping);
      else if (limit && subtotal < limit && limit - subtotal <= limit * 0.35) text = fill(pick(phrases.almostFree), { falta: formatPrice(limit - subtotal) });
      subtotalBefore = subtotal;
      show({ side: 'left', mood: 'party', action: 'dance', text, ms: 3200 });
      return;
    }
    subtotalBefore = getTotals(state.items).subtotal;
    if (next < prev) show({ side: 'left', mood: 'sad', action: '', text: pick(phrases.cartRemove), ms: 3000 });
  });

  // ---------- Frases según lo que hagas ----------
  const fill = (text, vars = {}) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  // Dice algo solo si no hay una ventana abierta y no habló hace poco
  const say = (key, { side = 'right', mood = 'happy', action = 'wave', ms = 3400, vars, cool = 9000 } = {}) => {
    if (root.classList.contains('is-locked') || document.hidden) return false;
    if (Date.now() - lastShow < cool) return false;
    const text = fill(pick(phrases[key]), vars);
    return text ? show({ side, mood, action, text, ms }) : false;
  };

  // Lo último que miraste: lo recuerda al cerrar la prenda y en la próxima visita
  const memory = storage.get('swaggy-memory', {});
  let viewing = null;
  bus.on('quickview:open', ({ id }) => {
    viewing = getProduct(id);
    if (viewing) storage.set('swaggy-memory', { ...storage.get('swaggy-memory', {}), lastViewed: id, at: Date.now() });
  });
  bus.on('quickview:close', () => {
    const name = viewing?.name?.replace(/^Camiseta\s+/i, '');
    viewing = null;
    if (name && Math.random() < 0.5) setTimeout(() => say('afterView', { side: 'right', action: 'look', vars: { name } }), 700);
  });
  if (memory.lastViewed && Date.now() - (memory.at || 0) > 60 * 60 * 1000) {
    const product = getProduct(memory.lastViewed);
    const name = product?.name?.replace(/^Camiseta\s+/i, '');
    if (name) {
      const tryRemember = () => {
        if (!root.classList.contains('is-entered')) return setTimeout(tryRemember, 2000);
        say('remember', { side: 'left', action: 'glasses', vars: { name }, cool: 0 });
      };
      setTimeout(tryRemember, 9000);
    }
  }

  // Clave incorrecta y último minuto del drop
  bus.on('drop:wrong', () => say('dropWrong', { side: 'left', mood: 'annoyed', action: 'surprise', ms: 2600, cool: 4000 }));
  bus.on('drop:final', () => say('dropFinal', { side: 'left', mood: 'party', action: 'dance', ms: 4000, cool: 0 }));
  // Cambio de drop en el lookbook (no siempre, para no cansar)
  bus.on('lookbook:drop', () => Math.random() < 0.5 && say('lookbookSwitch', { side: 'bottom', action: 'look', cool: 12000 }));

  // Si bajas la página muy rápido (una vez por visita)
  let lastY = window.scrollY;
  let lastT = performance.now();
  let warned = false;
  window.addEventListener(
    'scroll',
    () => {
      if (warned) return;
      const now = performance.now();
      const speed = Math.abs(window.scrollY - lastY) / Math.max(1, now - lastT); // px por ms
      lastY = window.scrollY;
      lastT = now;
      if (speed > 9 && root.classList.contains('is-entered')) {
        warned = say('scrollFast', { side: 'right', mood: 'annoyed', action: 'surprise', ms: 2600, cool: 6000 });
      }
    },
    { passive: true },
  );

  // ---------- Swaggy escondido ----------
  const data = storage.get('swaggy', {});
  const secret = html(`
    <button type="button" class="swaggy-secret" aria-label="Encontraste a ${SWAGGY.name}" data-cursor="¿Y esto?">
      <span class="swaggy-secret__peek">${swaggy3d('chill')}</span>
    </button>`);
  const secretSvg = mountSwaggy3d(secret);
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
  // Precarga las animaciones con las que se asoma y reacciona
  // En celular no se precargan (cada animación se baja cuando se usa: menos datos y memoria)
  if (!LITE) setTimeout(() => preloadSwaggy3d(['saludar', 'gafas', 'mirar', 'bailar', 'triste', 'chocala', 'saltar', 'girar']), 4000);
}
