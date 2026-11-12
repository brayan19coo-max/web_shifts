/**
 * Rendimiento
 * -------------------------------------------------------------
 * - LITE: celulares y equipos de pocos recursos. Ahí se usan efectos más
 *   livianos (sin desenfoques pesados, logo 3D con menos capas, sin grano).
 *   La clase `perf-lite` en <html> la pone el script del index.html.
 * - whileVisible(): corre una animación solo mientras se ve en pantalla y
 *   la pestaña está abierta. Así nada gasta batería escondido.
 */
export const LITE = document.documentElement.classList.contains('perf-lite');

export function whileVisible(el, onChange, { margin = '100px' } = {}) {
  let inView = false;
  let active = null;
  const update = () => {
    const next = inView && !document.hidden;
    if (next !== active) {
      active = next;
      onChange(next);
    }
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        inView = entries[entries.length - 1].isIntersecting;
        update();
      },
      { rootMargin: margin },
    ).observe(el);
  } else {
    inView = true;
  }
  document.addEventListener('visibilitychange', update);
  update();
}

/**
 * Pausa las animaciones CSS infinitas de cada sección cuando no se ve
 * (les pone la clase `is-offscreen`).
 */
export function pauseOffscreenSections(selector = 'main > section, footer') {
  document.querySelectorAll(selector).forEach((section) => {
    whileVisible(section, (on) => section.classList.toggle('is-offscreen', !on), { margin: '200px' });
  });
}
