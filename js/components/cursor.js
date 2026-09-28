import { html, isFinePointer, prefersReducedMotion } from '../utils/dom.js';
import { lerp } from '../utils/format.js';

/**
 * Cursor personalizado: punto + anillo con inercia.
 * - Crece sobre enlaces/botones.
 * - Muestra una etiqueta con data-cursor="Texto".
 * Solo se activa con mouse (no en pantallas táctiles).
 */
export function initCursor() {
  if (!isFinePointer() || prefersReducedMotion()) return;

  const dot = html('<div class="cursor-dot" aria-hidden="true"></div>');
  const ring = html('<div class="cursor-ring" aria-hidden="true"><span class="cursor-ring__label"></span></div>');
  const label = ring.firstElementChild;
  document.body.append(dot, ring);
  document.documentElement.classList.add('has-cursor');

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  let visible = false;

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    pos.x = event.clientX;
    pos.y = event.clientY;
    if (!visible) {
      visible = true;
      ringPos.x = pos.x;
      ringPos.y = pos.y;
      document.documentElement.classList.add('cursor-visible');
    }
  });
  document.addEventListener('pointerleave', () => {
    visible = false;
    document.documentElement.classList.remove('cursor-visible');
  });
  window.addEventListener('pointerdown', () => ring.classList.add('is-down'));
  window.addEventListener('pointerup', () => ring.classList.remove('is-down'));

  document.addEventListener('pointerover', (event) => {
    const labelled = event.target.closest('[data-cursor]');
    const interactive = event.target.closest('a, button, input, select, textarea, label, [role="button"]');
    ring.classList.toggle('is-hover', Boolean(interactive || labelled));
    ring.classList.toggle('has-label', Boolean(labelled));
    label.textContent = labelled ? labelled.dataset.cursor : '';
  });

  const tick = () => {
    ringPos.x = lerp(ringPos.x, pos.x, 0.18);
    ringPos.y = lerp(ringPos.y, pos.y, 0.18);
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
