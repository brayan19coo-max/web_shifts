/**
 * Swaggy habla
 * -------------------------------------------------------------
 * El Swaggy de la página es el 3D (sw3d.js) y el del parche es la calle
 * 3D (swaggy3d.html). El dibujo 2D de antes ya no se usa; de aquí solo
 * queda talk(), que pone a Swaggy en modo "hablando" mientras dice algo.
 */

/** Mueve la boca de Swaggy mientras "dice" un texto (según lo largo que sea). */
export function talk(el, text = '') {
  if (!el || !text) return;
  clearTimeout(el._talkTimer);
  el.dataset.talking = '';
  el._talkTimer = setTimeout(() => delete el.dataset.talking, Math.min(2600, 300 + text.length * 45));
}
