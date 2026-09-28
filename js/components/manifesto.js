import { $, prefersReducedMotion } from '../utils/dom.js';
import { clamp } from '../utils/format.js';

/** El texto del manifiesto se "enciende" palabra por palabra con el scroll. */
export function initManifesto() {
  const text = $('[data-manifesto]');
  if (!text) return;

  const words = text.textContent.trim().split(/\s+/);
  text.innerHTML = words.map((w) => `<span class="word">${w}</span> `).join('');
  const spans = [...text.querySelectorAll('.word')];

  if (prefersReducedMotion()) {
    spans.forEach((s) => s.classList.add('is-lit'));
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = text.getBoundingClientRect();
    const p = clamp((innerHeight * 0.85 - rect.top) / (rect.height + innerHeight * 0.35), 0, 1);
    const lit = Math.round(p * spans.length);
    spans.forEach((span, i) => span.classList.toggle('is-lit', i < lit));
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}
