import { BRAND } from '../config.js';
import { prefersReducedMotion } from '../utils/dom.js';

/**
 * Logo girando en 3D.
 * Apila varias copias del logo en profundidad (eje Z) para darle
 * grosor, como una moneda o un sticker extruido. Se puede arrastrar
 * con el mouse o el dedo para girarlo, y vuelve a su velocidad base.
 *
 * Devuelve { spin(boost) } para darle un impulso desde otro módulo.
 */
export function createLogo3D(container, { layers = 14, depth = 28, speed = 0.6 } = {}) {
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
  container.append(spinner);

  if (prefersReducedMotion()) return { spin() {} };

  let angle = 0;
  let velocity = speed;
  let dragging = false;
  let lastX = 0;
  let start = performance.now();

  const frame = (now) => {
    if (!dragging) {
      velocity += (speed - velocity) * 0.02; // vuelve poco a poco a la velocidad base
      angle += velocity;
    }
    const tilt = Math.sin((now - start) / 1400) * 8;
    spinner.style.transform = `rotateX(${tilt}deg) rotateY(${angle}deg)`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  container.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    container.setPointerCapture(event.pointerId);
    container.classList.add('is-dragging');
  });
  container.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    angle += dx * 0.6;
    velocity = dx * 0.6;
  });
  const release = () => {
    dragging = false;
    container.classList.remove('is-dragging');
  };
  container.addEventListener('pointerup', release);
  container.addEventListener('pointercancel', release);

  return {
    spin(boost = 25) {
      velocity = boost;
    },
  };
}
