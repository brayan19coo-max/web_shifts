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

/**
 * Pantallas completas (El parche, la maleta, la caja fuerte) "tapan" la
 * página: mientras están abiertas, todo lo de atrás se pausa y se esconde
 * (clase `is-covered` en <html>), así el celular solo dibuja lo que se ve.
 */
const covers = new Set();
const coverListeners = new Set();
export const isCovered = () => covers.size > 0;
export function setCovered(owner, on) {
  const before = isCovered();
  if (on) covers.add(owner);
  else covers.delete(owner);
  document.documentElement.classList.toggle('is-covered', isCovered());
  if (before !== isCovered()) coverListeners.forEach((fn) => fn());
}

export function whileVisible(el, onChange, { margin = '100px' } = {}) {
  let inView = false;
  let active = null;
  const update = () => {
    const next = inView && !document.hidden && !isCovered();
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
  coverListeners.add(update);
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
