import { $, $$, escapeHtml, lockScroll, trapFocus } from '../utils/dom.js';
import { BRAND, HELP } from '../config.js';
import { sound } from '../audio/sound-manager.js';

/**
 * Páginas de ayuda (Envíos, Cambios y devoluciones, Guía de tallas)
 * -------------------------------------------------------------
 * Los enlaces [data-help="clave"] abren una ventana con el texto de
 * HELP[clave] (config.js). Si la página no existe, el enlace se oculta.
 */
export function initHelp() {
  const modal = $('#help');
  if (!modal) return;
  const content = $('[data-help-content]', modal);
  let returnFocus = null;

  $$('[data-help]').forEach((link) => {
    if (!HELP[link.dataset.help]) (link.closest('li') || link).hidden = true;
  });

  const open = (key) => {
    const page = HELP[key];
    if (!page) return;
    const paragraphs = (text) => [].concat(text).map((t) => `<p>${escapeHtml(t)}</p>`).join('');
    const wa =
      page.whatsapp && BRAND.whatsapp
        ? `<a class="btn btn--accent help__cta" href="https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(page.whatsapp)}" target="_blank" rel="noopener" data-sfx="click"><span>Escribir por WhatsApp</span><span class="btn__arrow">→</span></a>`
        : '';
    content.innerHTML = `
      <h2 class="help__title" id="help-title">${escapeHtml(page.title)}</h2>
      ${page.blocks.map((b) => `<section class="help__block"><h3>${escapeHtml(b.title)}</h3>${paragraphs(b.text)}</section>`).join('')}
      ${wa}`;
    returnFocus = document.activeElement;
    modal.hidden = false;
    $('.modal__panel', modal).scrollTop = 0;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    lockScroll('help', true);
    document.documentElement.classList.add('is-help'); // Swaggy no se asoma encima del texto
    sound.play('open');
    $('[data-help-close]', modal).focus({ preventScroll: true });
  };

  const close = () => {
    if (modal.hidden) return;
    modal.classList.remove('is-open');
    lockScroll('help', false);
    document.documentElement.classList.remove('is-help');
    sound.play('close');
    setTimeout(() => (modal.hidden = true), 350);
    returnFocus?.focus?.({ preventScroll: true });
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-help]');
    if (link) {
      event.preventDefault();
      open(link.dataset.help);
      return;
    }
    if (event.target === modal || event.target.closest('[data-help-close]')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (modal.hidden) return;
    if (event.key === 'Escape') close();
    else if (event.key === 'Tab') trapFocus(event, modal);
  });
}
