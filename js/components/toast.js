import { html, escapeHtml } from '../utils/dom.js';

let region;

export function initToasts() {
  region = html('<div class="toasts" role="status" aria-live="polite"></div>');
  document.body.append(region);
}

/** Muestra una notificación temporal. type: 'info' | 'success' | 'error' */
export function toast(message, type = 'info', duration = 2800) {
  if (!region) initToasts();
  const el = html(`<div class="toast toast--${type}"><span class="toast__dot"></span>${escapeHtml(message)}</div>`);
  region.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => {
    el.classList.remove('is-in');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, duration);
}
