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

  // Recalcular medidas cuando carguen las fotos
  track.querySelectorAll('img').forEach((img) =>
    img.addEventListener('load', () => window.dispatchEvent(new Event('resize')), { once: true }),
  );

  let current = -1;
  const setCurrent = (index, withSound) => {
    if (index === current) return;
    if (withSound && current !== -1) sound.play('tick');
    current = index;
    panels.forEach((panel, i) => panel.classList.toggle('is-current', i === index));
  };

  // ---------- Modo carrusel (celular / táctil / menos movimiento) ----------
  // Scroll horizontal nativo con el dedo, que se "imanta" a cada look.
  const onCarouselScroll = () => {
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 0;
    progress.style.transform = `scaleX(${p})`;
    const center = track.scrollLeft + track.clientWidth / 2;
    let index = 0;
    let best = Infinity;
    panels.forEach((panel, i) => {
      const d = Math.abs(panel.offsetLeft + panel.offsetWidth / 2 - center);
      if (d < best) {
        best = d;
        index = i;
      }
    });
    setCurrent(index, true);
  };

  // ---------- Modo escritorio: scroll vertical que mueve los looks de lado ----------
  let ticking = false;
  const updatePinned = () => {
    ticking = false;
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - innerHeight;
    const p = clamp(-rect.top / scrollable, 0, 1);
    const distance = track.scrollWidth - innerWidth;
    track.style.transform = `translate3d(${-p * distance}px, 0, 0)`;
    progress.style.transform = `scaleX(${p})`;
    setCurrent(Math.round(p * (panels.length - 1)), rect.top < 0 && rect.bottom > innerHeight);
  };
  const onWindowScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updatePinned);
    }
  };
  const setPinnedHeight = () => {
    section.style.height = `${track.scrollWidth - innerWidth + innerHeight}px`;
    updatePinned();
  };

  // ---------- Elegir modo según el dispositivo ----------
  const carouselQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)');
  let mode = null;

  const applyMode = () => {
    const next = carouselQuery.matches || prefersReducedMotion() ? 'carousel' : 'pinned';
    if (next === mode) return;
    mode = next;
    current = -1;

    if (mode === 'carousel') {
      window.removeEventListener('scroll', onWindowScroll);
      window.removeEventListener('resize', setPinnedHeight);
      section.classList.add('is-static');
      section.style.height = '';
      track.style.transform = '';
      track.addEventListener('scroll', onCarouselScroll, { passive: true });
      onCarouselScroll();
    } else {
      track.removeEventListener('scroll', onCarouselScroll);
      section.classList.remove('is-static');
      track.scrollLeft = 0;
      window.addEventListener('scroll', onWindowScroll, { passive: true });
      window.addEventListener('resize', setPinnedHeight);
      setPinnedHeight();
    }
  };

  carouselQuery.addEventListener('change', applyMode);
  applyMode();
}
