import { setCovered } from '../utils/perf.js';
import { html, escapeHtml, lockScroll, prefersReducedMotion } from '../utils/dom.js';
import { BRAND } from '../config.js';
import { sound } from '../audio/sound-manager.js';
import { XRAY_DIR } from '../data/xray-items.js';

/**
 * Animación de desbloqueo del Drop 03 (pantalla completa).
 * -------------------------------------------------------------
 * 1. Entra una maleta dura en 3D (hecha solo con CSS: sin librerías ni
 *    modelos, así no pesa ni calienta el celular).
 * 2. Un rayo X la recorre de arriba abajo: por donde pasa, la maleta se
 *    vuelve radiografía y se ve lo que lleva (plata, oro, fichas, fierro).
 * 3. "Acceso concedido": saltan los dos seguros.
 * 4. Se abre la tapa y de adentro sale la luz con el logo y el nombre.
 * Se puede saltar con un toque o con Esc. Devuelve una promesa que se
 * resuelve cuando termina.
 */

// Lo que lleva la maleta (radiografías de assets/images/drop-03/xray/)
const CONTENTS = [
  { src: 'x45.webp', x: 4, y: 18, w: 30 }, // fajo de billetes
  { src: 'x47.webp', x: 64, y: 22, w: 32 }, // lingotes
  { src: 'x53.webp', x: 38, y: 40, w: 20 }, // fichas
  { src: 'x46.webp', x: 30, y: 6, w: 30 }, // billetes sueltos
];

// Cuándo pasa el rayo por cada cosa (el barrido de bajada dura SWEEP ms)
const SWEEP = 1600;
const hitAt = (c) => Math.round((SWEEP * (c.y + c.w * 0.35)) / 100);

// Billetes que salen volando al abrir
const FLY = [
  { src: 'x46.webp', dx: -260, dy: -70, r: -40, d: 0 },
  { src: 'x45.webp', dx: 250, dy: -80, r: 35, d: 90 },
  { src: 'x46.webp', dx: -280, dy: 30, r: 20, d: 180 },
  { src: 'x47.webp', dx: 270, dy: 10, r: -25, d: 260 },
  { src: 'x46.webp', dx: 220, dy: 90, r: 60, d: 320 },
];

const PISTOL = `
  <svg class="scan__pistol" viewBox="0 0 240 160" aria-hidden="true">
    <path d="M26 58H196V70H120L114 70Q114 98 88 98L84 98L78 146H36L46 92Q30 86 30 72Z" fill="currentColor" fill-opacity=".14"/>
    <rect x="22" y="34" width="176" height="24" rx="3" fill="currentColor" fill-opacity=".18"/>
    <rect x="58" y="40" width="142" height="10" rx="2" fill="currentColor" fill-opacity=".55"/>
    <path d="M52 78H84L78 142H44Z" fill="currentColor" fill-opacity=".3"/>
    <path d="M110 70Q110 92 90 92L90 87Q104 87 104 70Z" fill="currentColor" fill-opacity=".3"/>
  </svg>`;

export function playScanner({ title = '', subtitle = '', colors = [] } = {}) {
  const palette = colors.length ? colors : ['#b0101c', '#ff5cbe', '#9b4dff'];
  const reduced = prefersReducedMotion();
  const contents = CONTENTS.map(
    (c) =>
      `<span class="scan__thing" style="left:${c.x}%;top:${c.y}%;width:${c.w}%;--hit:${hitAt(c)}ms;-webkit-mask-image:url('${XRAY_DIR}${c.src}');mask-image:url('${XRAY_DIR}${c.src}')"></span>`,
  ).join('');
  // Caras de una caja (frente, atrás, lados, arriba, abajo)
  const faces = (extra = {}) =>
    ['front', 'back', 'left', 'right', 'top', 'bottom']
      .map((f) => `<div class="scan__face scan__face--${f}">${extra[f] || ''}</div>`)
      .join('');

  const overlay = html(`
    <div class="scan" role="dialog" aria-modal="true" aria-label="Escaneando la maleta" style="--xr:${palette[0]}">
      <div class="scan__grid" aria-hidden="true"></div>
      <div class="scan__stage" aria-hidden="true">
        <div class="scan__float"><div class="scan__case">
          <div class="scan__body">
            ${faces({
              front: `<span class="scan__latch scan__latch--l"></span><span class="scan__latch scan__latch--r"></span>
                      <span class="scan__handle"></span>`,
              top: `<div class="scan__tray"><div class="scan__light"></div></div>`,
            })}
          </div>
          <div class="scan__lid">
            ${faces({
              top: `<span class="scan__ribs scan__ribs--top"></span>
                    <span class="scan__plate"><img src="${escapeHtml(BRAND.logoSticker)}" alt=""></span>
                    <div class="scan__xray">${contents}${PISTOL}</div>`,
            })}
          </div>
        </div></div>
        <div class="scan__beam"></div>
        <div class="scan__fly">${FLY.map(
          (f) =>
            `<span style="--dx:${f.dx}%;--dy:${f.dy}%;--r:${f.r}deg;--d:${f.d}ms;-webkit-mask-image:url('${XRAY_DIR}${f.src}');mask-image:url('${XRAY_DIR}${f.src}')"></span>`,
        ).join('')}</div>
        <div class="scan__reveal">
          <span class="scan__rays"></span>
          <img class="scan__logo" src="${escapeHtml(BRAND.logoSticker)}" alt="">
          <p class="scan__title">${title
            .split(' — ')
            .map((line) => `<span>${escapeHtml(line.replace(/-/g, '\u2011'))}</span>`)
            .join('')}</p>
        </div>
      </div>
      <p class="scan__caption" aria-live="polite"><span class="scan__rec"></span><span data-scan-text>Iniciando escáner…</span></p>
      <div class="scan__flash" aria-hidden="true"></div>
      <button type="button" class="scan__skip">Saltar →</button>
    </div>`);

  document.body.append(overlay);
  lockScroll('scan', true);
  setTimeout(() => setCovered('scan', overlay.isConnected), 450);

  const text = overlay.querySelector('[data-scan-text]');
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, reduced ? ms * 0.6 : ms));

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      overlay.classList.add('is-leaving');
      setCovered('scan', false); // la página vuelve a verse mientras se desvanece
      document.removeEventListener('keydown', onKey);
      setTimeout(() => {
        overlay.remove();
        lockScroll('scan', false);
        resolve();
      }, 500);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') finish();
    };
    document.addEventListener('keydown', onKey);
    overlay.querySelector('.scan__skip').addEventListener('click', finish);

    // --- Línea de tiempo ---
    requestAnimationFrame(() => overlay.classList.add('is-in'));

    at(650, () => sound.play('scanStart'));

    // Barrido de bajada: la maleta se vuelve radiografía, cambia de color y pita en cada cosa
    const SCAN_AT = 1300; // después de que la maleta termina de caer
    at(SCAN_AT, () => {
      overlay.classList.add('is-scanning');
      sound.play('scan', { duration: (SWEEP + 800) / 1000 });
      // porcentaje del escaneo
      const start = performance.now();
      const total = SWEEP + 800;
      const step = () => {
        if (done || overlay.classList.contains('is-scanned')) return;
        const pct = Math.min(100, Math.round(((performance.now() - start) / total) * 100));
        text.textContent = `Escaneando maleta… ${pct}%`;
        if (pct < 100) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    [...CONTENTS.map(hitAt), hitAt({ y: 46, w: 34 })]
      .sort((a, b) => a - b)
      .forEach((t) => at(SCAN_AT + t, () => sound.play('beep')));
    palette.forEach((color, i) => at(SCAN_AT + 200 + i * 600, () => overlay.style.setProperty('--xr', color)));
    // Segunda pasada, de subida y rápida
    at(SCAN_AT + SWEEP, () => overlay.classList.add('is-scanning-up'));

    // Acceso concedido: destello, saltan los seguros y la maleta se sacude
    const OK_AT = SCAN_AT + SWEEP + 800;
    at(OK_AT, () => {
      overlay.classList.add('is-scanned');
      text.textContent = 'Acceso concedido.';
      sound.play('granted');
    });
    at(OK_AT + 350, () => {
      overlay.classList.add('is-unlocked');
      sound.play('click');
    });
    at(OK_AT + 500, () => sound.play('click'));

    // Se abre la tapa: luz, rayos, billetes volando y el logo
    at(OK_AT + 850, () => {
      overlay.classList.add('is-open');
      text.textContent = subtitle || 'Drop desbloqueado';
      sound.play('unlock');
      sound.play('whoosh');
    });
    at(OK_AT + 850 + 2900, finish);
  });
}
