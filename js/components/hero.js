import { $, prefersReducedMotion, escapeHtml } from '../utils/dom.js';
import { BRAND } from '../config.js';
import { sound } from '../audio/sound-manager.js';

/**
 * Hero: el logo gigante es un "instrumento": cada letra suena con
 * una nota distinta al pasar el mouse o tocarla. Fondo con parallax
 * que sigue al puntero.
 */
export function initHero() {
  const hero = $('#inicio');
  const title = $('[data-hero-title]', hero);
  $('[data-hero-tagline]', hero).textContent = BRAND.tagline;

  title.setAttribute('aria-label', BRAND.name);
  title.innerHTML = [...BRAND.name]
    .map(
      (char, i) =>
        `<span class="hero__letter" aria-hidden="true" data-index="${i}" style="--i:${i}"><span class="hero__glyph">${escapeHtml(char)}</span></span>`,
    )
    .join('');

  const hit = (letter) => {
    if (!letter || letter.classList.contains('is-hit')) return;
    letter.classList.add('is-hit');
    sound.play('note', { index: Number(letter.dataset.index) });
    setTimeout(() => letter.classList.remove('is-hit'), 450);
  };
  title.addEventListener('pointerover', (event) => hit(event.target.closest('.hero__letter')));
  // En táctil: deslizar el dedo sobre las letras las toca todas
  title.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse') return;
    hit(document.elementFromPoint(event.clientX, event.clientY)?.closest('.hero__letter'));
  });

  if (prefersReducedMotion()) return;

  // Parallax con el puntero
  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--px', ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
    hero.style.setProperty('--py', ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
  });

  // Desvanecer al hacer scroll
  window.addEventListener(
    'scroll',
    () => {
      const p = Math.min(1, scrollY / innerHeight);
      hero.style.setProperty('--scroll', p.toFixed(3));
    },
    { passive: true },
  );
}
