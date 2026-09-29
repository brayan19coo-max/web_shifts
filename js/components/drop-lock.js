import { $, $$ } from '../utils/dom.js';
import { storage } from '../utils/storage.js';
import { sha256 } from '../utils/sha256.js';
import { DROP } from '../config.js';
import { getDropProducts } from '../data/products.js';
import { createProductCard, bindQuickView } from './product-card.js';
import { createLogo3D } from './logo3d.js';
import { playVault } from './vault.js';
import { sound } from '../audio/sound-manager.js';
import { toast } from './toast.js';

/**
 * Drop bloqueado
 * -------------------------------------------------------------
 * - Logo girando en 3D + contador hasta la fecha de lanzamiento.
 * - Con la clave correcta se desbloquea antes (acceso anticipado).
 * - Al llegar la fecha se abre solo para todos (si DROP.autoUnlock = true).
 * - Al abrirse se reproduce la animación de la caja fuerte: al poner la
 *   clave, cuando el contador llega a cero, y la primera vez que alguien
 *   ve el drop ya lanzado.
 * - El desbloqueo se recuerda en el navegador.
 */
export function initDropLock() {
  const section = $('#drop');
  if (!section) return;

  const products = getDropProducts(DROP.id);
  const release = new Date(DROP.releaseDate).getTime();
  const storageKey = `${DROP.id}:unlocked`;
  const vaultSeenKey = `${DROP.id}:vault-seen`;
  const isReleased = () => Date.now() >= release;

  const form = $('[data-drop-form]', section);
  const input = $('input', form);
  const message = $('[data-drop-msg]', section);
  const grid = $('[data-drop-grid]', section);
  const teaser = $('[data-drop-teaser]', section);
  const granted = $('[data-drop-granted]', section);
  const units = Object.fromEntries($$('[data-unit]', section).map((el) => [el.dataset.unit, el]));

  $('[data-drop-name]', section).textContent = DROP.name;
  $('[data-drop-codename]', section).textContent = DROP.codename || '';
  $('[data-drop-subtitle]', section).textContent = DROP.subtitle;
  $('[data-drop-date]', section).textContent = new Date(release).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: DROP.timeZone,
  }) + ' (hora Colombia)';

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
      section.classList.add('is-live');
      // Solo si el contador llegó a cero con la página abierta (si ya había
      // pasado al cargar, la bóveda se abre al llegar a la sección)
      if (timer) {
        clearInterval(timer);
        timer = null;
        if (DROP.autoUnlock) unlock({ announce: true });
      }
    }
  };

  // ---------- Desbloqueo ----------
  let unlocking = false;

  const reveal = () => {
    section.classList.add('is-unlocked');
    granted.textContent = isReleased()
      ? '✓ La bóveda está abierta para todos.'
      : '✓ Acceso concedido. Eres de los primeros.';
    if (products.length) {
      grid.replaceChildren(...products.map((p, i) => createProductCard(p, i)));
      grid.hidden = false;
    } else {
      teaser.hidden = false;
    }
  };

  async function unlock({ announce = false } = {}) {
    if (unlocking || section.classList.contains('is-unlocked')) return;
    unlocking = true;
    storage.set(storageKey, true);
    input.blur();
    if (announce) {
      storage.set(vaultSeenKey, true);
      await playVault({
        title: [DROP.name, DROP.codename].filter(Boolean).join(' — '),
        subtitle: DROP.subtitle,
      });
    }
    reveal();
    unlocking = false;
    if (announce) {
      logo.spin(40);
      toast(`${DROP.name} desbloqueado 🔓`, 'success');
      const target = products.length ? grid : teaser;
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const attempt = input.value.trim();
    // La clave no distingue mayúsculas/minúsculas
    if (attempt && sha256(attempt.toUpperCase()) === DROP.passwordHash) {
      message.textContent = '';
      unlock({ announce: true });
      return;
    }
    sound.play('error');
    logo.spin(-18);
    form.classList.remove('is-shake');
    void form.offsetWidth;
    form.classList.add('is-shake');
    if (attempt) {
      message.innerHTML = 'Clave incorrecta. Las claves se sueltan en el <a href="#crew">Crew</a> 👀';
    } else {
      message.textContent = 'Escribe la clave del drop.';
    }
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
  if (!isReleased()) timer = setInterval(renderCountdown, 1000);

  if (storage.get(storageKey, false)) {
    unlock();
  } else if (isReleased() && DROP.autoUnlock) {
    if (storage.get(vaultSeenKey, false) || !('IntersectionObserver' in window)) {
      unlock();
    } else {
      // Primera visita después del lanzamiento: la bóveda se abre al llegar al drop
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting || !document.documentElement.classList.contains('is-entered')) return;
          observer.disconnect();
          unlock({ announce: true });
        },
        { threshold: 0.4 },
      );
      observer.observe(section);
    }
  }
}
