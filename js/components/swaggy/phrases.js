import { SWAGGY, DROP } from '../../config.js';

/**
 * Frases de Swaggy según el momento
 * -------------------------------------------------------------
 * Junta las frases normales (SWAGGY.phrases) con:
 * - las del drop activo (SWAGGY.byDrop[DROP.id]): cambian solas con cada drop;
 * - las de la fecha y la hora (SWAGGY.dates): Navidad, quincena, viernes…
 *   (salen a veces, mezcladas con las normales).
 * pick('idle') devuelve una frase al azar ya mezclada.
 */

const pickOne = (list = []) => list[Math.floor(Math.random() * list.length)] || '';

/** ¿La fecha de hoy cae en esta regla? */
function matches(rule, now) {
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const h = now.getHours();
  const day = now.getDay(); // 0 domingo … 5 viernes
  if (rule.days && !rule.days.includes(d)) return false;
  if (rule.weekday != null && rule.weekday !== day) return false;
  if (rule.hours && !(h >= rule.hours[0] && h < rule.hours[1])) return false;
  if (rule.from && rule.to) {
    const md = m * 100 + d;
    const [fm, fd] = rule.from.split('-').map(Number);
    const [tm, td] = rule.to.split('-').map(Number);
    const a = fm * 100 + fd;
    const b = tm * 100 + td;
    if (a <= b ? md < a || md > b : md < a && md > b) return false;
  }
  return true;
}

/** Frases de fecha/hora que aplican ahora mismo. */
export function seasonal(now = new Date()) {
  return Object.values(SWAGGY.dates || {})
    .filter((rule) => matches(rule, now))
    .flatMap((rule) => rule.phrases || []);
}

/** Lista de frases para una clave ('idle', 'tap', 'sections.drop'…), con las del drop activo. */
export function list(key) {
  const get = (obj) => key.split('.').reduce((o, k) => o?.[k], obj) || [];
  return [...get(SWAGGY.phrases), ...get(SWAGGY.byDrop?.[DROP.id])];
}

/**
 * Una frase al azar para esa clave.
 * - season: probabilidad (0 a 1) de decir una frase de la fecha en vez de la normal.
 * - vars: reemplaza {name}, {falta}… en el texto.
 */
export function pick(key, { season = 0, vars = {} } = {}) {
  const dated = season ? seasonal() : [];
  const text = dated.length && Math.random() < season ? pickOne(dated) : pickOne(list(key));
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

/** Frase escondida (sale muy de vez en cuando). */
export const rare = (chance = 0.04) => (Math.random() < chance ? pickOne(list('rare')) : '');

/** Todas las frases ya mezcladas con las del drop activo (mismo formato que SWAGGY.phrases). */
export function merged() {
  const base = SWAGGY.phrases || {};
  const extra = SWAGGY.byDrop?.[DROP.id] || {};
  const join = (a = {}, b = {}) => {
    const out = { ...a };
    Object.entries(b).forEach(([k, v]) => {
      out[k] = Array.isArray(v) ? [...(a[k] || []), ...v] : join(a[k], v);
    });
    return out;
  };
  return join(base, extra);
}
