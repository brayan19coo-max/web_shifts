import { $$, isFinePointer, prefersReducedMotion } from '../utils/dom.js';

/** Elementos con [data-magnetic] se "pegan" suavemente al cursor. */
export function initMagnetic(root = document) {
  if (!isFinePointer() || prefersReducedMotion()) return;

  $$('[data-magnetic]', root).forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.35;
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });
}
