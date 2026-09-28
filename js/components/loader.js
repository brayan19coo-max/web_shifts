import { $ } from '../utils/dom.js';
import { sound } from '../audio/sound-manager.js';

/**
 * Pantalla de entrada: contador de carga + elección de experiencia
 * (con o sin sonido). Esa elección desbloquea el audio del navegador.
 * Resuelve la promesa cuando el usuario entra.
 */
export function initLoader() {
  const root = $('#loader');
  const counter = $('[data-loader-count]', root);
  const bar = $('[data-loader-bar]', root);
  const actions = $('[data-loader-actions]', root);

  return new Promise((resolve) => {
    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      const value = Math.round(eased * 100);
      counter.textContent = String(value).padStart(3, '0');
      bar.style.transform = `scaleX(${eased})`;
      if (p < 1) requestAnimationFrame(step);
      else {
        root.classList.add('is-ready');
        actions.querySelector('button')?.focus({ preventScroll: true });
      }
    };
    requestAnimationFrame(step);

    actions.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-enter]');
      if (!button) return;
      const withSound = button.dataset.enter === 'sound';

      sound.setSfx(withSound);
      await sound.unlock();
      if (withSound) {
        sound.startMusic();
        sound.play('whoosh');
      } else {
        sound.stopMusic();
      }

      root.classList.add('is-leaving');
      document.documentElement.classList.remove('is-loading');
      setTimeout(() => root.remove(), 900);
      // Se resuelve de inmediato para que el hero anime mientras sube la cortina
      resolve();
    });
  });
}
