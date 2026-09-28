import { $, $$ } from '../utils/dom.js';
import { storage } from '../utils/storage.js';
import { sha256 } from '../utils/sha256.js';
import { DROP } from '../config.js';
import { getDropProducts } from '../data/products.js';
import { createProductCard, bindQuickView } from './product-card.js';
import { createLogo3D } from './logo3d.js';
import { sound } from '../audio/sound-manager.js';
import { toast } from './toast.js';

/**
 * Drop bloqueado
 * -------------------------------------------------------------
 * - Logo girando en 3D + contador hasta la fecha de lanzamiento.
 * - Con la clave correcta se desbloquea antes (acceso anticipado).
 * - Al llegar la fecha se abre solo (si DROP.autoUnlock = true).
 * - El desbloqueo se recuerda en el navegador.
 */
export function initDropLock() {
  const section = $('#drop');
  if (!section) return;

  const products = getDropProducts(DROP.id);
  const release = new Date(DROP.releaseDate).getTime();
  const storageKey = `${DROP.id}:unlocked`;

  const form = $('[data-drop-form]', section);
  const input = $('input', form);
  const message = $('[data-drop-msg]', section);
  const grid = $('[data-drop-grid]', section);
  const units = Object.fromEntries($$('[data-unit]', section).map((el) => [el.dataset.unit, el]));

  $('[data-drop-name]', section).textContent = DROP.name;
  $('[data-drop-subtitle]', section).textContent = DROP.subtitle;
  $('[data-drop-date]', section).textContent = new Date(release).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: DROP.timeZone,
  }) + ' (hora Colombia)';
  $$('[data-drop-count]').forEach((el) => (el.textContent = products.length));

  const logo = createLogo3D($('[data-drop-logo]', section));

  // ---------- Contador ----------
  let timer;
  const renderCountdown = () => {
    const diff = Math.max(0, release - Date.now());
    const values = {
      days: Math.floor(diff / 86400000),
      hours: Math.floor(diff / 3600000) % 24,
      minutes: Math.floor(diff / 60000) % 60,
      seconds: Math.floor(diff / 1000) % 60,
    };
    Object.entries(values).forEach(([unit, value]) => {
      const el = units[unit];
      const text = String(value).padStart(2, '0');
      if (el.textContent !== text) {
        el.textContent = text;
        el.classList.remove('is-flip');
        void el.offsetWidth;
        el.classList.add('is-flip');
      }
    });
    // Los últimos 10 segundos suenan
    if (diff > 0 && diff <= 10000 && !section.classList.contains('is-unlocked')) sound.play('tick');
    if (diff === 0) {
      clearInterval(timer);
      section.classList.add('is-live');
      if (DROP.autoUnlock) unlock({ announce: true });
    }
  };

  // ---------- Desbloqueo ----------
  function unlock({ announce = false } = {}) {
    if (section.classList.contains('is-unlocked')) return;
    storage.set(storageKey, true);
    section.classList.add('is-unlocked');
    grid.replaceChildren(...products.map((p, i) => createProductCard(p, i)));
    grid.hidden = false;
    input.blur();
    if (announce) {
      sound.play('unlock');
      logo.spin(40);
      toast(`${DROP.name} desbloqueado 🔓`, 'success');
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const attempt = input.value.trim();
    if (attempt && sha256(attempt) === DROP.passwordHash) {
      message.textContent = '';
      unlock({ announce: true });
      setTimeout(() => grid.scrollIntoView({ behavior: 'smooth', block: 'start' }), 700);
      return;
    }
    sound.play('error');
    logo.spin(-18);
    form.classList.remove('is-shake');
    void form.offsetWidth;
    form.classList.add('is-shake');
    message.textContent = attempt ? 'Clave incorrecta. Pídela en nuestro Instagram 👀' : 'Escribe la clave del drop.';
    input.select();
  });

  input.addEventListener('input', () => {
    message.textContent = '';
    sound.play('tick');
  });

  // Clic en el logo: impulso extra
  $('[data-drop-logo]', section).addEventListener('dblclick', () => {
    logo.spin(35);
    sound.play('spray');
  });

  bindQuickView(grid);

  renderCountdown();
  if (release > Date.now()) timer = setInterval(renderCountdown, 1000);
  if (storage.get(storageKey, false) || (release <= Date.now() && DROP.autoUnlock)) unlock();
}
