import { BRAND } from '../config.js';
import { prefersReducedMotion } from '../utils/dom.js';
import { LITE, whileVisible } from '../utils/perf.js';

/**
 * Logo girando en 3D.
 * Apila varias copias del logo en profundidad (eje Z) para darle
 * grosor, como una moneda o un sticker extruido. Se puede arrastrar
 * con el mouse o el dedo para girarlo, y vuelve a su velocidad base.
 *
 * Devuelve { spin(boost) } para darle un impulso desde otro módulo.
 */
export function createLogo3D(container, { layers = 14, depth = 28, speed: baseSpeed = 0.6 } = {}) {
  // Con "reducir movimiento" del sistema gira más despacio, pero sigue girando
  const speed = prefersReducedMotion() ? baseSpeed * 0.4 : baseSpeed;
  // En celular / equipos de pocos recursos: menos capas (se ve casi igual)
  if (LITE) layers = Math.min(layers, 6);
  container.classList.add('logo3d');
  container.setAttribute('role', 'img');
  container.setAttribute('aria-label', `Logo ${BRAND.name}`);

  const spinner = document.createElement('div');
  spinner.className = 'logo3d__spinner';

  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1); // 0 = atrás, 1 = frente
    const z = (t - 0.5) * depth;
    const img = document.createElement('img');
    img.src = BRAND.logoSticker;
    img.alt = '';
    img.draggable = false;
    img.className = 'logo3d__layer';
    if (i === 0) {
      img.classList.add('logo3d__face', 'logo3d__face--back');
      img.style.transform = `translateZ(${z}px) rotateY(180deg)`;
    } else if (i === layers - 1) {
      img.classList.add('logo3d__face');
      img.style.transform = `translateZ(${z}px)`;
    } else {
      img.style.transform = `translateZ(${z}px)`;
      img.style.filter = `brightness(${0.25 + t * 0.35})`;
    }
    spinner.append(img);
  }
  // inclinación suave (va en su propia capa, animada por CSS)
  const tilter = document.createElement('div');
  tilter.className = 'logo3d__tilt';
  tilter.append(spinner);
  container.append(tilter);

  // Velocidad en grados por segundo (antes era por cuadro: en pantallas de
  // 120 Hz giraba al doble y gastaba el doble)
  const SPEED = speed * 60;
  let angle = 0;
  let velocity = SPEED;
  let dragging = false;
  let lastX = 0;
  let lastFrame = 0;
  let raf = 0;
  let running = false;

  // "Crucero": girando a velocidad normal lo mueve la tarjeta gráfica con
  // una animación nativa y el JavaScript descansa
  let cruise = null;
  let cruiseFrom = 0;
  const startCruise = () => {
    if (cruise || !spinner.animate) return false;
    angle %= 360;
    cruiseFrom = angle;
    cruise = spinner.animate(
      [{ transform: `rotateY(${angle}deg)` }, { transform: `rotateY(${angle + 360}deg)` }],
      { duration: (360 / SPEED) * 1000, iterations: Infinity, easing: 'linear' },
    );
    if (!running) cruise.pause();
    return true;
  };
  const stopCruise = () => {
    if (!cruise) return;
    angle = cruiseFrom + ((Number(cruise.currentTime) || 0) / 1000) * SPEED;
    spinner.style.transform = `rotateY(${angle}deg)`;
    cruise.cancel();
    cruise = null;
    velocity = SPEED;
  };

  const frame = (now) => {
    const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
    lastFrame = now;
    if (!dragging) {
      velocity += (SPEED - velocity) * Math.min(1, dt * 1.2); // vuelve poco a poco a la velocidad base
      angle += velocity * dt;
    }
    spinner.style.transform = `rotateY(${angle}deg)`;
    if (!dragging && Math.abs(velocity - SPEED) < 2 && startCruise()) {
      raf = 0;
      return;
    }
    raf = running ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => {
    stopCruise();
    if (running && !raf) {
      lastFrame = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  // Solo gira mientras se ve en pantalla
  whileVisible(container, (on) => {
    running = on;
    tilter.classList.toggle('is-paused', !on);
    if (cruise) {
      if (on) cruise.play();
      else cruise.pause();
    } else if (on && !raf) {
      raf = requestAnimationFrame(frame);
    }
  });

  container.addEventListener('pointerdown', (event) => {
    stopCruise();
    dragging = true;
    lastX = event.clientX;
    container.setPointerCapture(event.pointerId);
    container.classList.add('is-dragging');
    kick();
  });
  container.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    angle += dx * 0.6;
    velocity = dx * 0.6 * 60;
  });
  const release = () => {
    dragging = false;
    container.classList.remove('is-dragging');
    kick();
  };
  container.addEventListener('pointerup', release);
  container.addEventListener('pointercancel', release);

  return {
    spin(boost = 25) {
      stopCruise();
      velocity = boost * 60;
      kick();
    },
  };
}
