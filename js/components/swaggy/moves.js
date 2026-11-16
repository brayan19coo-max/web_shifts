import { html, prefersReducedMotion } from '../../utils/dom.js';
import { storage } from '../../utils/storage.js';
import { BRAND, DROP, SWAGGY } from '../../config.js';
import { sound } from '../../audio/sound-manager.js';
import { bus } from '../../core/bus.js';
import { LITE } from '../../utils/perf.js';
import { swaggy3d, mountSwaggy3d } from './sw3d.js';
import { XRAY_DIR } from '../../data/xray-items.js';

/**
 * Movimientos especiales de Swaggy por la web (hechos con CSS sobre sus
 * animaciones grabadas, así no pesan):
 * - Patineta: de vez en cuando cruza la pantalla en patineta y hace un ollie.
 * - Grafiti: al llegar al pie de página pinta el logo con aerosol.
 * - Lluvia de billetes: cuando haces un pedido.
 * - Ficha policial (Drop 03): se asoma con el cartel "SWAGGY #03".
 * - Rayos X: cuando el logo del Drop 03 parpadea, Swaggy también sale en radiografía.
 */
const root = document.documentElement;
const busy = () =>
  root.classList.contains('is-locked') || !root.classList.contains('is-entered') || document.hidden || !!document.querySelector('.parche');

export function initSwaggyMoves() {
  const reduced = prefersReducedMotion();

  // ---------- Patineta ----------
  const skate = html(`
    <div class="swaggy-skate" aria-hidden="true">
      <div class="swaggy-skate__rider">${swaggy3d('party')}</div>
      <svg class="swaggy-skate__board" viewBox="0 0 120 30">
        <path d="M6 12h108q6 0 4 6l-2 2H4l-2-2q-2-6 4-6z" fill="#111" stroke="#fff" stroke-width="2"/>
        <circle cx="26" cy="24" r="5" fill="#fff"/><circle cx="94" cy="24" r="5" fill="#fff"/>
      </svg>
    </div>`);
  document.body.append(skate);
  const rider = mountSwaggy3d(skate);
  let skated = false;
  const ride = () => {
    if (skated || busy() || reduced) return;
    skated = true;
    const toLeft = Math.random() < 0.5;
    skate.classList.toggle('is-left', toLeft);
    skate.classList.remove('is-go');
    void skate.offsetWidth;
    skate.classList.add('is-go');
    // ollie a la mitad
    setTimeout(() => {
      rider.dataset.action = 'jump';
      sound.play('jump');
    }, 2300);
    setTimeout(() => {
      delete rider.dataset.action;
      skate.classList.remove('is-go');
    }, 5200);
  };
  // pasa una vez por visita, después de un rato navegando
  setTimeout(function tryRide() {
    if (busy()) return setTimeout(tryRide, 8000);
    ride();
  }, 45000 + Math.random() * 30000);

  // ---------- Grafiti en el pie de página ----------
  const footer = document.querySelector('.footer');
  if (footer && !reduced) {
    const tag = html(`
      <div class="swaggy-graffiti" aria-hidden="true">
        <div class="swaggy-graffiti__guy">${swaggy3d('happy')}</div>
        <img class="swaggy-graffiti__logo" src="${BRAND.logoSticker}" alt="">
      </div>`);
    if (getComputedStyle(footer).position === 'static') footer.style.position = 'relative';
    footer.append(tag);
    const guy = mountSwaggy3d(tag);
    let done = false;
    new IntersectionObserver(
      (entries, obs) => {
        if (!entries[0].isIntersecting || done) return;
        done = true;
        obs.disconnect();
        tag.classList.add('is-on');
        guy.dataset.action = 'flex';
        sound.play('spray');
        setTimeout(() => sound.play('spray'), 900);
      },
      { threshold: 0.5 },
    ).observe(footer);
  }

  // ---------- Lluvia de billetes al hacer el pedido ----------
  bus.on('cart:checkout', () => {
    if (reduced) return;
    const count = LITE ? 10 : 20;
    const rain = html(`<div class="swaggy-rain" aria-hidden="true"></div>`);
    for (let i = 0; i < count; i++) {
      const bill = document.createElement('span');
      bill.style.left = `${Math.random() * 100}%`;
      bill.style.setProperty('--d', `${Math.random() * 0.9}s`);
      bill.style.setProperty('--r', `${Math.round(Math.random() * 720 - 360)}deg`);
      bill.style.setProperty('--x', `${Math.round(Math.random() * 120 - 60)}px`);
      bill.style.webkitMaskImage = bill.style.maskImage = `url("${XRAY_DIR}${Math.random() < 0.5 ? 'x46' : 'x45'}.webp")`;
      rain.append(bill);
    }
    document.body.append(rain);
    setTimeout(() => rain.remove(), 3600);
  });

  // ---------- Rayos X: Swaggy también sale en radiografía ----------
  // (xray.js prende la clase html.is-xray-flash y la variable --xr en cada parpadeo)

  // ---------- Ficha policial (solo en el Drop 03) ----------
  if (DROP.id === 'drop-03') {
    const drop = document.querySelector('#drop');
    const card = html(`
      <div class="swaggy-mugshot" aria-hidden="true">
        <div class="swaggy-mugshot__chart"></div>
        <div class="swaggy-mugshot__guy">${swaggy3d('annoyed')}</div>
        <p class="swaggy-mugshot__sign">${SWAGGY.name.toUpperCase()} #03<small>X-COPS DIVISION</small></p>
      </div>`);
    document.body.append(card);
    mountSwaggy3d(card);
    let shown = storage.get('swaggy-mugshot', 0) > Date.now() - 6 * 3600000;
    if (drop && !shown) {
      new IntersectionObserver(
        (entries, obs) => {
          if (!entries[0].isIntersecting || shown || busy()) return;
          shown = true;
          obs.disconnect();
          storage.set('swaggy-mugshot', Date.now());
          setTimeout(() => {
            card.classList.add('is-in');
            sound.play('tick');
            setTimeout(() => sound.play('tick'), 160); // "flash" de la cámara
            setTimeout(() => card.classList.remove('is-in'), 3600);
          }, 5200);
        },
        { threshold: 0.35 },
      ).observe(drop);
    }
  }

  // ---------- Reacciones al drop ----------
  // Al escribir la clave se tapa la cara (no mira); en los últimos 10 s baila.
  const key = document.querySelector('#drop-key');
  key?.addEventListener('focus', () => bus.emit('swaggy:say', { key: 'dropKey' }), { once: false });
}
