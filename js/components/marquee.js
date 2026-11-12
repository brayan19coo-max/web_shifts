import { $, prefersReducedMotion } from '../utils/dom.js';
import { sound } from '../audio/sound-manager.js';
import { whileVisible } from '../utils/perf.js';

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
  // Con "reducir movimiento" del sistema va más lenta, pero sigue viva
  const BASE_SPEED = prefersReducedMotion() ? -40 : -90;
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

  // "Crucero": cuando va a velocidad normal (sin arrastre ni inercia) el
  // movimiento lo hace la tarjeta gráfica con una animación nativa y el
  // JavaScript descansa. Al tocarla vuelve el control por cuadros.
  let cruise = null;
  let cruiseStart = 0;
  let cruiseSpeed = 0;

  const startCruise = () => {
    if (cruise || !loopWidth || !track.animate) return false;
    wrap();
    cruiseStart = offset;
    cruiseSpeed = target;
    const duration = (loopWidth / Math.abs(cruiseSpeed)) * 1000;
    cruise = track.animate(
      [{ transform: `translate3d(${offset}px, 0, 0)` }, { transform: `translate3d(${offset - loopWidth}px, 0, 0)` }],
      { duration, iterations: Infinity, easing: 'linear' },
    );
    if (!running) cruise.pause();
    return true;
  };

  const stopCruise = () => {
    if (!cruise) return;
    const t = (Number(cruise.currentTime) || 0) / 1000;
    offset = cruiseStart + cruiseSpeed * t;
    wrap();
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
    cruise.cancel();
    cruise = null;
    velocity = cruiseSpeed;
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
    // ya se calmó: pasar a modo crucero y soltar el ciclo de cuadros
    if (!dragging && Math.abs(velocity - target) < 1 && startCruise()) {
      raf = 0;
      return;
    }
    raf = running ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => {
    stopCruise();
    if (running && !raf) {
      lastFrame = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  let raf = 0;
  let running = false;

  marquee.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') {
      if (event.button !== 0) return;
      event.preventDefault(); // evita que el navegador seleccione texto en vez de arrastrar
    }
    stopCruise();
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastTime = performance.now();
    velocity = 0;
    marquee.setPointerCapture(event.pointerId);
    marquee.classList.add('is-dragging');
    kick();
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
    kick();
  };
  marquee.addEventListener('pointerup', release);
  marquee.addEventListener('pointercancel', release);

  marquee.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') {
      target = HOVER_SPEED;
      kick();
    }
  });
  marquee.addEventListener('pointerleave', () => {
    target = BASE_SPEED;
    kick();
  });

  marquee.addEventListener('dragstart', (event) => event.preventDefault());
  const remeasure = () => {
    stopCruise();
    measure();
    kick();
  };
  window.addEventListener('resize', remeasure);
  document.fonts?.ready.then(remeasure);
  measure();
  // Solo se mueve mientras se ve en pantalla (ahorra batería)
  whileVisible(marquee, (on) => {
    running = on;
    if (cruise) {
      if (on) cruise.play();
      else cruise.pause();
    } else if (on && !raf) {
      lastFrame = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });
}
