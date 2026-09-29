import { $, prefersReducedMotion } from '../utils/dom.js';
import { sound } from '../audio/sound-manager.js';

/**
 * Cinta (marquee) interactiva
 * -------------------------------------------------------------
 * Se desplaza sola y se puede arrastrar con el mouse o el dedo como
 * un carrusel: al soltarla sigue con la inercia del gesto y luego
 * vuelve a su velocidad normal. Al pasar el mouse va más lento.
 * El contenido está duplicado en el HTML para que el loop no tenga corte.
 */
export function initMarquee() {
  const marquee = $('[data-marquee]');
  if (!marquee) return;
  const track = $('.marquee__track', marquee);

  const BASE_SPEED = prefersReducedMotion() ? 0 : -0.6; // px por frame (negativo = hacia la izquierda)
  let offset = 0;
  let velocity = BASE_SPEED;
  let target = BASE_SPEED;
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastTime = 0;
  let loopWidth = 0;

  const measure = () => {
    // El track tiene el contenido 2 veces: un ciclo = distancia entre el
    // primer elemento de cada copia (incluye el espacio entre copias)
    const items = track.children;
    loopWidth = items[items.length / 2].offsetLeft - items[0].offsetLeft;
  };

  const wrap = () => {
    if (!loopWidth) return;
    offset %= loopWidth;
    if (offset > 0) offset -= loopWidth;
  };

  const frame = () => {
    if (!dragging) {
      velocity += (target - velocity) * 0.04; // la inercia se disipa suavemente
      offset += velocity;
    }
    wrap();
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
    requestAnimationFrame(frame);
  };

  marquee.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastTime = performance.now();
    velocity = 0;
    marquee.setPointerCapture(event.pointerId);
    marquee.classList.add('is-dragging');
  });

  marquee.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = event.clientX - lastX;
    if (Math.abs(dx) > 2) moved = true;
    offset += dx;
    // Velocidad del gesto en px/frame (~16 ms) para la inercia al soltar
    velocity = (dx / Math.max(1, now - lastTime)) * 16;
    lastX = event.clientX;
    lastTime = now;
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    marquee.classList.remove('is-dragging');
    velocity = Math.max(-60, Math.min(60, velocity));
    if (moved && Math.abs(velocity) > 12) sound.play('whoosh');
  };
  marquee.addEventListener('pointerup', release);
  marquee.addEventListener('pointercancel', release);

  marquee.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') target = BASE_SPEED * 0.3;
  });
  marquee.addEventListener('pointerleave', () => (target = BASE_SPEED));

  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  measure();
  requestAnimationFrame(frame);
}
