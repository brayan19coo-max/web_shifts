import { $, $$, escapeHtml, prefersReducedMotion } from '../utils/dom.js';
import { clamp } from '../utils/format.js';
import { garmentSvg } from './product-art.js';
import { LOOKBOOK } from '../data/lookbook.js';
import { sound } from '../audio/sound-manager.js';

/**
 * Lookbook con scroll horizontal "anclado": al bajar, los paneles
 * se desplazan hacia el lado. Suena un tick al cambiar de look.
 * Los looks se definen en js/data/lookbook.js.
 */
export function initLookbook() {
  const section = $('#lookbook');
  const track = $('[data-look-track]', section);
  const progress = $('[data-look-progress]', section);

  $('[data-look-title]', section).textContent = LOOKBOOK.title;
  $('[data-look-season]', section).textContent = LOOKBOOK.season;

  track.innerHTML = LOOKBOOK.looks
    .map((look, i) => {
      const media = look.image
        ? `<img src="${escapeHtml(look.image)}" alt="${escapeHtml(look.title)}" loading="lazy">`
        : garmentSvg(look.art || 'tee', look.color || '#111111');
      return `
      <article class="look${look.image ? ' look--photo' : ''}" data-look
        style="--look-bg:${escapeHtml(look.bg || '#f4f4f4')};--look-fg:${escapeHtml(look.fg || '#0a0a0a')}">
        <span class="look__num">${String(i + 1).padStart(2, '0')}</span>
        <div class="look__art">${media}</div>
        <div class="look__text"><h3>${escapeHtml(look.title)}</h3><p>${escapeHtml(look.text || '')}</p></div>
      </article>`;
    })
    .join('');
  const panels = $$('[data-look]', section);

  // Recalcular la altura cuando carguen las fotos
  track.querySelectorAll('img').forEach((img) =>
    img.addEventListener('load', () => window.dispatchEvent(new Event('resize')), { once: true }),
  );

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
