import { $, $$, prefersReducedMotion } from '../utils/dom.js';
import { clamp } from '../utils/format.js';
import { garmentSvg } from './product-art.js';
import { sound } from '../audio/sound-manager.js';

/**
 * Lookbook con scroll horizontal "anclado": al bajar, los paneles
 * se desplazan hacia el lado. Suena un tick al cambiar de look.
 */
export function initLookbook() {
  const section = $('#lookbook');
  const track = $('[data-look-track]', section);
  const progress = $('[data-look-progress]', section);
  const panels = $$('[data-look]', section);

  panels.forEach((panel) => {
    const art = $('[data-look-art]', panel);
    if (art) art.innerHTML = garmentSvg(art.dataset.lookArt, art.dataset.color);
  });

  if (prefersReducedMotion()) {
    section.classList.add('is-static');
    return;
  }

  let current = -1;
  let ticking = false;

  const update = () => {
    ticking = false;
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - innerHeight;
    const p = clamp(-rect.top / scrollable, 0, 1);
    const distance = track.scrollWidth - innerWidth;
    track.style.transform = `translate3d(${-p * distance}px, 0, 0)`;
    progress.style.transform = `scaleX(${p})`;

    const index = Math.round(p * (panels.length - 1));
    if (index !== current) {
      if (current !== -1 && rect.top < 0 && rect.bottom > innerHeight) sound.play('tick');
      current = index;
      panels.forEach((panel, i) => panel.classList.toggle('is-current', i === index));
    }
  };

  const setHeight = () => {
    section.style.height = `${track.scrollWidth - innerWidth + innerHeight}px`;
    update();
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', setHeight);
  setHeight();
}
