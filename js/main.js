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
import { initLookbook } from './components/lookbook.js';
import { initManifesto } from './components/manifesto.js';
import { initNewsletter } from './components/newsletter.js';
import { initReveal } from './components/reveal.js';
import { initToasts } from './components/toast.js';

document.title = `${BRAND.name} — ${BRAND.tagline}`;
document.querySelectorAll('[data-social]').forEach((el) => {
  const url = BRAND.social[el.dataset.social];
  if (url) el.href = url;
  else el.closest('li')?.remove();
});
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

sound.bindDeclarative();
initToasts();
initCursor();
initHeader();
initHero();
initMagnetic();
initProductGrid();
initQuickView();
initCart();
initLookbook();
initManifesto();
initNewsletter();

initLoader().then(() => {
  document.documentElement.classList.add('is-entered');
  initReveal();
});
