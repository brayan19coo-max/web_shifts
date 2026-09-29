import { $, escapeHtml } from '../utils/dom.js';
import { BRAND } from '../config.js';

/** Sección Crew: enlace al canal de WhatsApp y lista de beneficios. */
export function initCrew() {
  const section = $('#crew');
  if (!section) return;

  const crew = BRAND.crew || {};
  const link = $('[data-crew-link]', section);
  if (crew.url) link.href = crew.url;

  $('[data-crew-perks]', section).innerHTML = (crew.perks || [])
    .map((perk) => `<li>${escapeHtml(perk)}</li>`)
    .join('');
}
