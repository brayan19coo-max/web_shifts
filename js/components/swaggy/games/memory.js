import { LOOKBOOK } from '../../../data/lookbook.js';
import { BRAND } from '../../../config.js';
import { escapeHtml } from '../../../utils/dom.js';
import { sound } from '../../../audio/sound-manager.js';

/**
 * Mini juego "Memoria Saint Mode"
 * -------------------------------------------------------------
 * 12 cartas boca abajo con las fotos del lookbook (6 parejas, se
 * escogen al azar). Volteas dos: si son iguales se quedan, si no se
 * vuelven a tapar.
 *   - Cada pareja: +10 · Cada fallo: −2 (el total final no baja de 0)
 *   - Al terminar: bono por rapidez (hasta +40 si lo haces en menos
 *     de 20 s; baja 1 punto por segundo hasta llegar a 0).
 * Devuelve { stop() }.
 */
const PAIRS = 6;

const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function startMemoryGame(stage, { onScore, onInfo, onEnd } = {}) {
  const photos = LOOKBOOK.looks.filter((l) => l.image);
  const chosen = shuffle(photos).slice(0, PAIRS);
  const deck = shuffle([...chosen, ...chosen].map((look, i) => ({ look, id: chosen.indexOf(look), key: i })));

  stage.innerHTML = `
    <div class="memory" role="grid" aria-label="Cartas de memoria">
      ${deck
        .map(
          ({ look, id }, i) => `
        <button type="button" class="memory__card" data-id="${id}" data-index="${i}" aria-label="Carta ${i + 1}, boca abajo">
          <span class="memory__inner">
            <span class="memory__face memory__back"><img src="${escapeHtml(BRAND.logoSticker)}" alt=""></span>
            <span class="memory__face memory__front"><img src="${escapeHtml(look.image)}" alt="" loading="eager"><b>${escapeHtml(look.title)}</b></span>
          </span>
        </button>`,
        )
        .join('')}
    </div>`;

  const cards = [...stage.querySelectorAll('.memory__card')];
  let open = [];
  let found = 0;
  let misses = 0;
  let score = 0;
  let locked = false;
  let started = 0;
  let timer = 0;
  let done = false;

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const seconds = () => (started ? Math.floor((Date.now() - started) / 1000) : 0);
  const info = () => onInfo?.(`⏱ ${fmt(seconds())} · ${found}/${PAIRS}`);

  const flip = (card, up) => {
    card.classList.toggle('is-up', up);
    const look = chosen[Number(card.dataset.id)];
    card.setAttribute('aria-label', up ? `Carta ${Number(card.dataset.index) + 1}: ${look.title}` : `Carta ${Number(card.dataset.index) + 1}, boca abajo`);
  };

  const onClick = (event) => {
    const card = event.target.closest('.memory__card');
    if (!card || locked || done || card.classList.contains('is-up')) return;
    if (!started) {
      started = Date.now();
      timer = setInterval(info, 1000);
    }
    flip(card, true);
    sound.play('tick');
    open.push(card);
    if (open.length < 2) return;

    const [a, b] = open;
    open = [];
    if (a.dataset.id === b.dataset.id) {
      found += 1;
      score += 10;
      a.classList.add('is-match');
      b.classList.add('is-match');
      a.disabled = true;
      b.disabled = true;
      sound.play('success');
      onScore?.(score);
      info();
      if (found === PAIRS) finish();
    } else {
      misses += 1;
      score -= 2;
      onScore?.(Math.max(0, score));
      locked = true;
      setTimeout(() => {
        a.classList.add('is-miss');
        b.classList.add('is-miss');
        sound.play('remove');
      }, 350);
      setTimeout(() => {
        a.classList.remove('is-miss');
        b.classList.remove('is-miss');
        flip(a, false);
        flip(b, false);
        locked = false;
      }, 950);
    }
  };
  stage.addEventListener('click', onClick);

  function finish() {
    done = true;
    clearInterval(timer);
    const bonus = Math.max(0, 40 - Math.max(0, seconds() - 20));
    score = Math.max(0, score + bonus);
    onScore?.(score);
    onInfo?.(`⏱ ${fmt(seconds())} · ${misses} fallos · bono +${bonus}`);
    stage.querySelector('.memory')?.classList.add('is-done');
    setTimeout(() => {
      cleanup();
      onEnd?.(score);
    }, 1400);
  }

  function cleanup() {
    clearInterval(timer);
    stage.removeEventListener('click', onClick);
  }

  onScore?.(0);
  info();
  cards[0]?.focus({ preventScroll: true });

  return {
    stop() {
      done = true;
      cleanup();
    },
  };
}
