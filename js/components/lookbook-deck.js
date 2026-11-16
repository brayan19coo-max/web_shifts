import { $, escapeHtml } from '../utils/dom.js';
import { BRAND } from '../config.js';
import { sound } from '../audio/sound-manager.js';

/**
 * Mazo del lookbook
 * -------------------------------------------------------------
 * El lookbook arranca "cerrado": un carrusel lateral con un mazo por
 * drop (flechas, puntos o deslizar para cambiar). Cada portada es la
 * carta de arriba de su mazo. Al tocarla, las cartas (los looks) salen
 * volando una por una hasta su lugar en el carrusel. Con "Volver a la
 * portada" se recogen de nuevo en el mazo.
 */
const BACK_CARDS = 3;

function coverMarkup(cover, season) {
  if (cover.image) {
    return `
      <img class="deck__photo" src="${escapeHtml(cover.image)}" alt="${escapeHtml(cover.title || season)}">
      <span class="deck__overlay">
        <span class="deck__season">${escapeHtml(cover.kicker || '')}</span>
        <span class="deck__overlay-name">${escapeHtml(cover.title || season)}</span>
      </span>`;
  }
  // Portada generada mientras no haya foto: aureola + nombre + logo
  return `
    <span class="deck__generated">
      <span class="deck__season">${escapeHtml(cover.kicker || '')}</span>
      <span class="deck__halo" aria-hidden="true"></span>
      <span class="deck__name">${escapeHtml(cover.title || season)}</span>
      <img class="deck__logo" src="${escapeHtml(BRAND.logoSticker)}" alt="">
    </span>`;
}

export function initDeck({ section, drops, getPanels, onOpen, onSelect }) {
  const deck = $('[data-look-deck]', section);
  const closeBtn = $('[data-look-close]', section);
  const track = $('[data-look-track]', section);
  if (!deck) {
    onOpen?.(0);
    section.classList.add('is-open');
    return;
  }

  const multi = drops.length > 1;
  const backs = Array.from(
    { length: BACK_CARDS },
    (_, i) => `<span class="deck__card deck__card--back" style="--i:${i + 1}"></span>`,
  ).join('');
  const slides = drops
    .map((drop, i) => {
      const name = escapeHtml(drop.cover?.title || drop.season);
      return `
      <div class="deck__slide" data-deck-slide role="group" aria-roledescription="drop" aria-label="${i + 1} de ${drops.length}: ${name}">
        <button type="button" class="deck__stack" data-deck-open="${i}" data-cursor="Abrir" aria-label="Abrir el lookbook ${name}">
          ${backs}
          <span class="deck__card deck__card--cover">${coverMarkup(drop.cover || {}, drop.season)}</span>
        </button>
      </div>`;
    })
    .join('');

  deck.innerHTML = `
    <div class="deck__carousel">
      ${multi ? '<button type="button" class="deck__arrow deck__arrow--prev" data-deck-prev aria-label="Drop anterior">‹</button>' : ''}
      <div class="deck__viewport" data-deck-viewport>${slides}</div>
      ${multi ? '<button type="button" class="deck__arrow deck__arrow--next" data-deck-next aria-label="Drop siguiente">›</button>' : ''}
    </div>
    ${
      multi
        ? `<div class="deck__dots">${drops
            .map((drop, i) => `<button type="button" class="deck__dot" data-deck-dot="${i}" aria-label="${escapeHtml(drop.season)}"></button>`)
            .join('')}</div>`
        : ''
    }
    <p class="deck__hint"><span class="only-mouse">Haz clic en</span><span class="only-touch">Toca</span> la portada para abrir el lookbook${
      multi ? '<br><span class="only-mouse">Usa las flechas</span><span class="only-touch">Desliza</span> para ver los otros drops' : ''
    }</p>`;

  const viewport = $('[data-deck-viewport]', deck);
  const slideEls = Array.from(deck.querySelectorAll('[data-deck-slide]'));
  const dots = Array.from(deck.querySelectorAll('[data-deck-dot]'));
  const prev = $('[data-deck-prev]', deck);
  const next = $('[data-deck-next]', deck);

  // Cada portada horizontal vuelve su mazo horizontal
  slideEls.forEach((slide) => {
    const photo = $('.deck__photo', slide);
    if (!photo) return;
    const check = () => slide.classList.toggle('deck__slide--landscape', photo.naturalWidth > photo.naturalHeight);
    if (photo.complete && photo.naturalWidth) check();
    else photo.addEventListener('load', check, { once: true });
  });

  // ---------- Carrusel de drops ----------
  let active = 0;
  const setActive = (index) => {
    index = Math.max(0, Math.min(drops.length - 1, index));
    if (index !== active) sound.play('tick');
    active = index;
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    slideEls.forEach((slide, i) => slide.toggleAttribute('inert', i !== index));
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === drops.length - 1;
    onSelect?.(index);
  };
  const goTo = (index, smooth = true) => {
    index = Math.max(0, Math.min(drops.length - 1, index));
    viewport.scrollTo({ left: index * viewport.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  };

  let scrollFrame = 0;
  viewport.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        const index = Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth));
        if (index !== active) setActive(index);
      });
    },
    { passive: true },
  );
  prev?.addEventListener('click', () => goTo(active - 1));
  next?.addEventListener('click', () => goTo(active + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  window.addEventListener('resize', () => {
    if (!section.classList.contains('is-open')) goTo(active, false);
  });
  setActive(0);

  // ---------- Abrir y cerrar ----------
  let busy = false;

  const open = (index) => {
    if (busy || section.classList.contains('is-open')) return;
    busy = true;
    const stack = slideEls[index].querySelector('.deck__stack');
    const from = stack.getBoundingClientRect();
    const fromX = from.left + from.width / 2;
    const fromY = from.top + from.height / 2;

    onOpen?.(index);
    sound.play('whoosh');
    section.classList.add('is-open');
    closeBtn.hidden = false;

    // Cada carta sale del mazo hacia su lugar, girando
    const panels = getPanels();
    panels.forEach((panel, i) => {
      const rect = panel.getBoundingClientRect();
      const dx = fromX - (rect.left + rect.width / 2);
      const dy = fromY - (rect.top + rect.height / 2);
      const spin = (i % 2 ? 1 : -1) * (8 + i * 3);
      const delay = 120 + i * 140;
      panel.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(0.45)`, opacity: 0 },
          { transform: `translate(${dx * 0.3}px, ${dy * 0.3 - 40}px) rotate(${spin / 2}deg) scale(0.8)`, opacity: 1, offset: 0.55 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 750, delay, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' },
      );
      setTimeout(() => sound.play('tick'), delay + 200);
    });
    setTimeout(() => (busy = false), 120 + panels.length * 140 + 750);
  };

  const close = () => {
    if (busy || !section.classList.contains('is-open')) return;
    busy = true;
    sound.play('whoosh');
    const panels = getPanels();
    const trackRect = track.getBoundingClientRect();
    const toX = trackRect.left + trackRect.width / 2;
    const toY = trackRect.top + trackRect.height / 2;
    const anims = panels.map((panel, i) => {
      const rect = panel.getBoundingClientRect();
      const dx = toX - (rect.left + rect.width / 2);
      const dy = toY - (rect.top + rect.height / 2);
      return panel.animate(
        [{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) rotate(${i % 2 ? 6 : -6}deg) scale(0.45)`, opacity: 0 }],
        { duration: 420, delay: (panels.length - 1 - i) * 60, easing: 'cubic-bezier(0.7, 0, 0.3, 1)', fill: 'forwards' },
      );
    });
    Promise.all(anims.map((a) => a.finished)).then(() => {
      section.classList.remove('is-open');
      closeBtn.hidden = true;
      anims.forEach((a) => a.cancel());
      goTo(active, false); // el carrusel vuelve al mismo drop
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      busy = false;
    });
  };

  slideEls.forEach((slide, i) => $('.deck__stack', slide).addEventListener('click', () => open(i)));
  closeBtn.addEventListener('click', close);
}
