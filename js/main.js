/**
 * Punto de entrada: inicializa cada módulo en orden.
 * Cada componente es independiente; si no quieres uno, basta con
 * quitar su línea aquí (y su sección del HTML).
 */
import { BRAND } from './config.js';
import { sound } from './audio/sound-manager.js';
import { initLoader } from './components/loader.js';
import { initCursor } from './components/cursor.js';
import { initHeader } from './components/header.js';
import { initHero } from './components/hero.js';
import { initMagnetic } from './components/magnetic.js';
import { initProductGrid } from './components/product-grid.js';
import { initQuickView } from './components/quick-view.js';
import { initCart } from './components/cart.js';
import { initDropLock } from './components/drop-lock.js';
import { initMarquee } from './components/marquee.js';
import { initLookbook } from './components/lookbook.js';
import { initManifesto } from './components/manifesto.js';
import { initCrew } from './components/crew.js';
import { initReveal } from './components/reveal.js';
import { initToasts } from './components/toast.js';
import { initSwaggy } from './components/swaggy/spot.js';
import { initSwaggyRoam } from './components/swaggy/roam.js';

// Avisa al "rescate" del index.html que el JavaScript sí arrancó
window.__shiftsBooted = true;

/**
 * Ejecuta cada módulo aislado: si uno falla (p.ej. por un archivo viejo
 * en caché), el resto de la página sigue funcionando.
 */
function safe(name, fn) {
  try {
    return fn();
  } catch (error) {
    console.error(`[${name}] no se pudo iniciar:`, error);
    return undefined;
  }
}

safe('marca', () => {
  document.title = `${BRAND.name} — ${BRAND.tagline}`;
  document.querySelectorAll('[data-social]').forEach((el) => {
    const url = BRAND.social?.[el.dataset.social];
    if (url) el.href = url;
    else el.closest('li')?.remove();
  });
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
});

safe('sonido', () => sound.bindDeclarative());
safe('toasts', initToasts);
safe('cursor', initCursor);
safe('header', initHeader);
safe('hero', initHero);
safe('magnetic', initMagnetic);
safe('marquee', initMarquee);
safe('tienda', initProductGrid);
safe('vista rápida', initQuickView);
safe('carrito', initCart);
safe('drop', initDropLock);
safe('lookbook', initLookbook);
safe('manifiesto', initManifesto);
safe('crew', initCrew);
safe('swaggy', initSwaggy);
safe('swaggy por la página', initSwaggyRoam);

const entered = safe('loader', initLoader) || Promise.resolve();
entered.then(() => {
  document.documentElement.classList.add('is-entered');
  safe('reveal', initReveal);
});
