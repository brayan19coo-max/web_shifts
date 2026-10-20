/**
 * Swaggy 3D en la página
 * -------------------------------------------------------------
 * El modelo 3D de Swaggy grabado cuadro por cuadro (tiras en
 * assets/images/swaggy/3d/). Así se ve exactamente el modelo, con sus
 * líneas y su sombreado, sin cargar el motor 3D en la página.
 *
 * Uso: swaggy3d('chill') devuelve el HTML. Después se controla con los
 * mismos atributos que el muñeco anterior:
 *   data-mood    → chill | happy | annoyed | party | sleepy | sad
 *   data-action  → wave, glasses, dance, look, jump, spin, flip, stretch,
 *                  purr, surprise, rap, flex, highfive, chain, tantrum
 *   data-talking → mientras habla
 * Un solo reloj anima todos los Swaggy visibles a 12 cuadros por segundo.
 *
 * Para regrabar (si cambia el modelo): ver assets/images/swaggy/3d/LEEME.md
 */
const BASE = 'assets/images/swaggy/3d/';
const VERSION = '1';
const FPS = 12;
// cuadros de cada tira (ver manifest.json)
const ANIMS = {
  quieto: 24, saludar: 29, hablar: 22, risa: 11, carcajada: 17, bailar: 30, rapear: 30, flex: 19, chocala: 19, bravo: 10,
  pataleta: 16, triste: 24, dormido: 36, bostezo: 28, gafas: 28, susto: 12, mirar: 31, girar: 18, saltar: 16, cadena: 25,
};
// las que se repiten; las demás se ven una vez y vuelven al ánimo
const LOOPS = new Set(['quieto', 'hablar', 'risa', 'bailar', 'rapear', 'bravo', 'dormido']);

const MOOD_ANIM = { chill: 'quieto', happy: 'risa', party: 'bailar', annoyed: 'bravo', sleepy: 'dormido', sad: 'triste' };
const ACTION_ANIM = {
  wave: 'saludar', glasses: 'gafas', dance: 'bailar', look: 'mirar', jump: 'saltar', spin: 'girar', flip: 'girar',
  stretch: 'bostezo', purr: 'carcajada', surprise: 'susto', rap: 'rapear', flex: 'flex', highfive: 'chocala',
  chain: 'cadena', tantrum: 'pataleta',
};

/** Duración en segundos de cada acción (para los temporizadores de quien la usa). */
export const ACTION_TIME = Object.fromEntries(Object.entries(ACTION_ANIM).map(([a, n]) => [a, ANIMS[n] / FPS]));

const url = (name) => `${BASE}${name}.webp?v=${VERSION}`;
const loaded = new Map(); // nombre → Promise

function load(name) {
  if (!loaded.has(name)) {
    loaded.set(
      name,
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url(name);
      }),
    );
  }
  return loaded.get(name);
}

/** HTML de un Swaggy 3D. */
export function swaggy3d(mood = 'chill', { className = '' } = {}) {
  return `<div class="sw3d ${className}" data-sw3d data-mood="${mood}" role="img" aria-label="Swaggy"><div class="sw3d__img"></div></div>`;
}

// ---------- Reloj único ----------
const state = new WeakMap(); // elemento → { anim, frame, shown, done }
const visible = new Set();
let raf = 0;
let last = 0;
let acc = 0;

const io = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      if (visible.size) start();
    })
  : null;

function wanted(el, st) {
  const action = el.dataset.action;
  if (action && ACTION_ANIM[action] && !(st.done && st.doneFor === action)) return { name: ACTION_ANIM[action], key: action };
  if ('talking' in el.dataset && el.dataset.mood !== 'sleepy') return { name: 'hablar', key: 'talk' };
  return { name: MOOD_ANIM[el.dataset.mood] || 'quieto', key: 'mood:' + el.dataset.mood };
}

function paint(el, st) {
  const img = el.firstElementChild;
  const n = ANIMS[st.shown];
  if (!img || !n) return;
  if (img.dataset.anim !== st.shown) {
    img.dataset.anim = st.shown;
    img.style.backgroundImage = `url("${url(st.shown)}")`;
    img.style.backgroundSize = `${n * 100}% 100%`;
  }
  img.style.backgroundPosition = `${n > 1 ? (st.frame / (n - 1)) * 100 : 0}% 0`;
}

function step(el) {
  let st = state.get(el);
  if (!st) {
    st = { anim: null, key: null, frame: 0, shown: null, done: false };
    state.set(el, st);
  }
  const want = wanted(el, st);
  if (want.key !== st.key) {
    // cambió lo que debe hacer: empezar esa animación (cuando esté cargada)
    st.key = want.key;
    st.anim = want.name;
    st.done = false;
    st.doneFor = null;
    st.frame = 0;
    load(want.name).then(() => {
      if (st.anim === want.name) {
        st.shown = want.name;
        paint(el, st);
      }
    });
    return;
  }
  if (st.shown !== st.anim) return; // todavía cargando: se queda con la anterior
  const n = ANIMS[st.anim];
  if (st.frame < n - 1) st.frame += 1;
  else if (LOOPS.has(st.anim)) st.frame = 0;
  else if (el.dataset.action && ACTION_ANIM[el.dataset.action] === st.anim) {
    // la acción terminó: volver al ánimo aunque el atributo siga puesto
    st.done = true;
    st.doneFor = el.dataset.action;
  }
  paint(el, st);
}

function tick(now) {
  raf = 0;
  if (!visible.size || document.hidden) return;
  acc += Math.min(0.25, (now - last) / 1000);
  last = now;
  if (acc >= 1 / FPS) {
    acc %= 1 / FPS;
    visible.forEach((el) => (el.isConnected ? step(el) : visible.delete(el)));
  }
  raf = requestAnimationFrame(tick);
}

function start() {
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && visible.size) start();
});

/** Activa todos los Swaggy 3D que haya dentro de `root` (llamar después de insertarlos). */
export function mountSwaggy3d(root = document) {
  const els = root.matches?.('[data-sw3d]') ? [root] : [...root.querySelectorAll('[data-sw3d]')];
  els.forEach((el) => {
    if (el._sw3d) return;
    el._sw3d = true;
    if (io) io.observe(el);
    else visible.add(el);
    // si le vuelven a poner la misma acción, que la repita desde el inicio
    new MutationObserver(() => {
      const st = state.get(el);
      if (st) st.key = null;
    }).observe(el, { attributes: true, attributeFilter: ['data-action'] });
    step(el); // primer cuadro de una vez
  });
  start();
  return els[0];
}

/** Precarga animaciones (por ejemplo las de reacción, para que no tarden). */
export function preloadSwaggy3d(names = ['quieto', 'hablar']) {
  names.forEach(load);
}
