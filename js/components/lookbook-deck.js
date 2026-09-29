import { $, escapeHtml } from '../utils/dom.js';
import { BRAND } from '../config.js';
import { sound } from '../audio/sound-manager.js';

/**
 * Mazo del lookbook
 * -------------------------------------------------------------
 * El lookbook arranca "cerrado": se ve la portada del drop como la
 * carta de arriba de un mazo. Al tocarla, las cartas (los looks) salen
 * volando una por una hasta su lugar en el carrusel. Con "Volver a la
 * portada" se recogen de nuevo en el mazo.
 */
const BACK_CARDS = 3;

function coverMarkup(cover, season) {
  if (cover.image) {
    return `<img class="deck__photo" src="${escapeHtml(cover.image)}" alt="${escapeHtml(cover.title || season)}">`;
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

export function initDeck({ section, track, getPanels, onOpen, cover = {}, season = '' }) {
  const deck = $('[data-look-deck]', section);
  const closeBtn = $('[data-look-close]', section);
  if (!deck) {
    section.classList.add('is-open');
    return;
  }

  const backs = Array.from(
    { length: BACK_CARDS },
    (_, i) => `<span class="deck__card deck__card--back" style="--i:${i + 1}"></span>`,
  ).join('');
  deck.innerHTML = `
    <button type="button" class="deck__stack" data-deck-open data-cursor="Abrir"
      aria-label="Abrir el lookbook ${escapeHtml(cover.title || season)}">
      ${backs}
      <span class="deck__card deck__card--cover">${coverMarkup(cover, season)}</span>
    </button>
    <p class="deck__hint"><span class="only-mouse">Haz clic en</span><span class="only-touch">Toca</span> la portada para abrir el lookbook</p>`;

  const stack = $('[data-deck-open]', deck);
  let busy = false;

  const open = () => {
    if (busy || section.classList.contains('is-open')) return;
    busy = true;
    const from = stack.getBoundingClientRect();
    const fromX = from.left + from.width / 2;
    const fromY = from.top + from.height / 2;

    sound.play('whoosh');
    section.classList.add('is-open');
    closeBtn.hidden = false;
    track.scrollLeft = 0;
    onOpen?.();

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
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      busy = false;
    });
  };

  stack.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
}
