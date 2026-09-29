import { html, escapeHtml, lockScroll } from '../utils/dom.js';
import { BRAND } from '../config.js';
import { sound } from '../audio/sound-manager.js';

/**
 * Animación de caja fuerte abriéndose (pantalla completa).
 * -------------------------------------------------------------
 * 1. Aparece la bóveda cerrada.
 * 2. La perilla gira a la derecha, a la izquierda y a la derecha (clics).
 * 3. La manija gira y los pestillos se retraen ("clack").
 * 4. La puerta se abre y adentro brilla el logo con el nombre del drop.
 * Se puede saltar con un clic o con Esc. Devuelve una promesa que se
 * resuelve cuando termina.
 */
const BOLTS = 10;

export function playVault({ title = '', subtitle = '' } = {}) {
  const bolts = Array.from(
    { length: BOLTS },
    (_, i) => `<span class="vault__bolt" style="--a:${(360 / BOLTS) * i}deg"></span>`,
  ).join('');
  const ticks = Array.from(
    { length: 40 },
    (_, i) => `<span class="vault__tick${i % 5 === 0 ? ' is-major' : ''}" style="--a:${i * 9}deg"></span>`,
  ).join('');

  const overlay = html(`
    <div class="vault" role="dialog" aria-modal="true" aria-label="Abriendo la bóveda">
      <div class="vault__stage">
        <div class="vault__inside">
          <div class="vault__glow"></div>
          <img class="vault__logo" src="${escapeHtml(BRAND.logoSticker)}" alt="">
          <p class="vault__title">${escapeHtml(title)}</p>
        </div>
        <div class="vault__frame"></div>
        <div class="vault__door">
          <div class="vault__bolts">${bolts}</div>
          <div class="vault__ring"></div>
          <div class="vault__dial">
            <div class="vault__ticks">${ticks}</div>
            <span class="vault__marker"></span>
          </div>
          <div class="vault__handle"><span></span><span></span><span></span><i></i></div>
          <span class="vault__hinge vault__hinge--top"></span>
          <span class="vault__hinge vault__hinge--bottom"></span>
        </div>
      </div>
      <p class="vault__caption" aria-live="polite">Abriendo la bóveda…</p>
      <button type="button" class="vault__skip">Saltar →</button>
    </div>`);

  document.body.append(overlay);
  lockScroll('vault', true);

  const caption = overlay.querySelector('.vault__caption');
  const dial = overlay.querySelector('.vault__dial');
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      overlay.classList.add('is-leaving');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => {
        overlay.remove();
        lockScroll('vault', false);
        resolve();
      }, 500);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') finish();
    };
    document.addEventListener('keydown', onKey);
    overlay.querySelector('.vault__skip').addEventListener('click', finish);

    // --- Línea de tiempo ---
    requestAnimationFrame(() => overlay.classList.add('is-in'));

    // Combinación: derecha → izquierda → derecha, con clics
    const combo = [
      { at: 450, angle: 250, clicks: 6 },
      { at: 1150, angle: -40, clicks: 5 },
      { at: 1750, angle: 110, clicks: 3 },
    ];
    combo.forEach(({ at: t, angle, clicks }) => {
      at(t, () => (dial.style.transform = `rotate(${angle}deg)`));
      for (let c = 0; c < clicks; c++) at(t + c * 90, () => sound.play('tick'));
    });

    at(2350, () => {
      overlay.classList.add('is-unlocked'); // manija gira + pestillos adentro
      caption.textContent = 'Clack.';
      sound.play('unlock');
    });
    at(2950, () => {
      overlay.classList.add('is-open'); // la puerta se abre
      caption.textContent = subtitle || 'Drop desbloqueado';
      sound.play('whoosh');
    });
    at(5200, finish);
  });
}
