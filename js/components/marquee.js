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

  // Velocidades en px por segundo (negativo = hacia la izquierda)
  const BASE_SPEED = prefersReducedMotion() ? 0 : -90;
  const HOVER_SPEED = BASE_SPEED * 0.4;
  let offset = 0;
  let velocity = BASE_SPEED;
  let target = BASE_SPEED;
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastTime = 0;
  let lastFrame = performance.now();
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

  const frame = (now) => {
    // dt en segundos: misma velocidad en pantallas de 60 Hz, 120 Hz o 144 Hz
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (!dragging) {
      velocity += (target - velocity) * Math.min(1, dt * 2.5); // la inercia se disipa suavemente
      offset += velocity * dt;
    }
    wrap();
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
    requestAnimationFrame(frame);
  };

  marquee.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') {
      if (event.button !== 0) return;
      event.preventDefault(); // evita que el navegador seleccione texto en vez de arrastrar
    }
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
    // Velocidad del gesto en px/s para la inercia al soltar
    velocity = (dx / Math.max(1, now - lastTime)) * 1000;
    lastX = event.clientX;
    lastTime = now;
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    marquee.classList.remove('is-dragging');
    // Si se quedó quieta antes de soltar, no hay impulso
    if (performance.now() - lastTime > 80) velocity = 0;
    velocity = Math.max(-3600, Math.min(3600, velocity));
    if (moved && Math.abs(velocity) > 700) sound.play('whoosh');
  };
  marquee.addEventListener('pointerup', release);
  marquee.addEventListener('pointercancel', release);

  marquee.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') target = HOVER_SPEED;
  });
  marquee.addEventListener('pointerleave', () => (target = BASE_SPEED));

  marquee.addEventListener('dragstart', (event) => event.preventDefault());
  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  measure();
  requestAnimationFrame(frame);
}
