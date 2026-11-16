import { html, escapeHtml } from '../../utils/dom.js';
import { storage } from '../../utils/storage.js';
import { BRAND, SWAGGY } from '../../config.js';
import { sound } from '../../audio/sound-manager.js';
import { toast } from '../toast.js';
import { chosenLook, currentLook, setSwaggyLook, lookStrip } from './sw3d.js';

/**
 * Clóset de Swaggy
 * -------------------------------------------------------------
 * Panel dentro de El parche para cambiarle la ropa. Algunas prendas se
 * ganan (ver SWAGGY.looks en config.js). Lo que escojas se le queda
 * puesto en toda la web. También arma la "Foto con Swaggy" para historias.
 */

const DAYS_KEY = 'swaggy-days';
const UNLOCKS_KEY = 'swaggy-unlocks';
const FRAME = { w: 240, h: 260 }; // tamaño de cada cuadro de las tiras

/** Anota el día de hoy (para el desbloqueo de "3 días distintos"). */
export function countVisitDay() {
  const today = new Date().toISOString().slice(0, 10);
  const days = storage.get(DAYS_KEY, []);
  if (!days.includes(today)) storage.set(DAYS_KEY, [...days, today].slice(-30));
}

/** Marca algo como ganado (por ejemplo 'drop03' al desbloquear el drop). */
export function grantUnlock(rule) {
  const got = storage.get(UNLOCKS_KEY, {});
  if (got[rule]) return false;
  storage.set(UNLOCKS_KEY, { ...got, [rule]: Date.now() });
  const look = (SWAGGY.looks || []).find((l) => l.unlock === rule);
  if (look) toast(`👕 Nuevo outfit para ${SWAGGY.name}: ${look.name}. Búscalo en el clóset del parche.`, 'success', 5200);
  return true;
}

export function isUnlocked(look) {
  if (!look.unlock) return true;
  const got = storage.get(UNLOCKS_KEY, {});
  if (got[look.unlock]) return true;
  if (look.unlock === 'days3') return storage.get(DAYS_KEY, []).length >= 3;
  if (look.unlock === 'found3') return (storage.get('swaggy', {}).found || 0) >= 3;
  return false;
}

/** Arma y descarga (o comparte) la foto con Swaggy en formato historia. */
export async function photoWithSwaggy() {
  const look = (SWAGGY.looks || []).find((l) => l.id === currentLook());
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  const load = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  try {
    await document.fonts?.load?.('80px "Black Ops One"');
  } catch {
    /* sin la letra: usa la de respaldo */
  }
  // foto en alta (si existe) o el primer cuadro de la animación
  const [photo, strip, logo] = await Promise.all([
    load(`assets/images/swaggy/3d/looks/${currentLook()}/foto.webp`),
    load(lookStrip(currentLook(), 'quieto')),
    load(BRAND.logoSticker),
  ]);

  // fondo
  const g = c.createRadialGradient(W / 2, H * 0.48, 80, W / 2, H * 0.5, H * 0.7);
  g.addColorStop(0, '#2a1440');
  g.addColorStop(1, '#060608');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(155, 77, 255, 0.12)';
  c.lineWidth = 2;
  for (let x = 0; x < W; x += 60) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, H);
    c.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.stroke();
  }
  // logo arriba
  if (logo) {
    const lw = 620;
    const lh = (logo.naturalHeight / logo.naturalWidth) * lw || 360;
    c.drawImage(logo, (W - lw) / 2, 150, lw, lh);
  }
  // Swaggy grande (primer cuadro de "quieto")
  if (photo) {
    const sw = 900;
    const sh = (sw * photo.naturalHeight) / photo.naturalWidth;
    c.drawImage(photo, (W - sw) / 2, 1560 - sh, sw, sh);
  } else if (strip) {
    const sw = 900;
    const sh = (sw * FRAME.h) / FRAME.w;
    c.drawImage(strip, 0, 0, FRAME.w, FRAME.h, (W - sw) / 2, 560, sw, sh);
  }
  // textos
  c.textAlign = 'center';
  c.fillStyle = '#ffffff';
  c.font = '84px "Black Ops One", Impact, sans-serif';
  c.fillText(`YO Y ${SWAGGY.name.toUpperCase()}`, W / 2, 1640);
  c.fillStyle = '#ff5cbe';
  c.font = '44px "Share Tech Mono", monospace';
  c.fillText((look?.name || '').toUpperCase(), W / 2, 1710);
  c.fillStyle = '#bbbbbb';
  c.font = '38px "Share Tech Mono", monospace';
  c.fillText('@shifts_st', W / 2, 1800);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const file = new File([blob], 'swaggy-shifts.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Yo y ${SWAGGY.name}` });
      return;
    } catch {
      /* canceló: se descarga */
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'swaggy-shifts.png';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/**
 * Abre el clóset dentro de `host` (el parche). onPick(look) se llama al escoger.
 * Devuelve una función para cerrarlo.
 */
export function openCloset(host, { onPick } = {}) {
  const looks = SWAGGY.looks || [];
  const panel = html(`
    <section class="closet" role="dialog" aria-label="Clóset de ${escapeHtml(SWAGGY.name)}">
      <div class="closet__head">
        <p class="closet__title">👕 Clóset de ${escapeHtml(SWAGGY.name)}</p>
        <button type="button" class="icon-btn closet__close" data-closet-close aria-label="Cerrar el clóset">✕</button>
      </div>
      <ul class="closet__list">
        ${looks
          .map((l) => {
            const open = isUnlocked(l);
            return `<li>
            <button type="button" class="closet__item${open ? '' : ' is-locked'}${l.id === chosenLook() ? ' is-on' : ''}" data-look="${escapeHtml(l.id)}" ${open ? '' : 'aria-disabled="true"'}>
              <span class="closet__thumb" style="background-image:url('${lookStrip(l.id)}')"></span>
              <span class="closet__name">${escapeHtml(l.name)}</span>
              ${open ? '' : `<small class="closet__hint">🔒 ${escapeHtml(l.hint || 'Bloqueado')}</small>`}
            </button>
          </li>`;
          })
          .join('')}
      </ul>
      <button type="button" class="btn btn--accent closet__photo" data-closet-photo><span>📸 Foto con ${escapeHtml(SWAGGY.name)}</span></button>
    </section>`);
  host.append(panel);
  requestAnimationFrame(() => panel.classList.add('is-open'));
  sound.play('open');

  const close = () => {
    panel.classList.remove('is-open');
    setTimeout(() => panel.remove(), 300);
  };
  panel.querySelector('[data-closet-close]').addEventListener('click', close);
  panel.addEventListener('click', (event) => {
    const item = event.target.closest('[data-look]');
    if (!item) return;
    if (item.classList.contains('is-locked')) {
      sound.play('error');
      item.classList.remove('is-shake');
      void item.offsetWidth;
      item.classList.add('is-shake');
      return;
    }
    panel.querySelectorAll('[data-look]').forEach((b) => b.classList.toggle('is-on', b === item));
    setSwaggyLook(item.dataset.look);
    sound.play('spray');
    onPick?.(item.dataset.look);
  });
  panel.querySelector('[data-closet-photo]').addEventListener('click', async (event) => {
    const btn = event.currentTarget;
    btn.disabled = true;
    await photoWithSwaggy();
    btn.disabled = false;
  });
  return close;
}
