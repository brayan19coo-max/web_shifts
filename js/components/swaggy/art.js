/**
 * Swaggy — versión PROVISIONAL dibujada con código (SVG).
 * -------------------------------------------------------------
 * Nutria con lentes deportivos oscuros, el brother de la marca.
 * Cuando esté la ilustración oficial, se reemplaza este dibujo
 * (mismos nombres de ánimo y de partes).
 *
 * Ánimos: 'chill' | 'happy' | 'annoyed' | 'party' | 'sleepy' | 'sad'
 *
 * Dos modos:
 * - swaggySvg(mood)            → dibujo quieto de un solo ánimo (canvas, miniaturas).
 * - swaggySvg(mood, {rig:true}) → "muñeco articulado": cola (3 partes), cuerpo,
 *   brazos (hombro, codo y mano), cabeza, orejas, bigotes, cejas, cachetes,
 *   ojos, lentes, boca y brillo son grupos separados que
 *   se animan con CSS (css/swaggy.css). El ánimo se cambia con el atributo
 *   data-mood y las acciones con data-action, sin volver a dibujarlo.
 */

const FUR = '#3b3b3f';
const FUR_DARK = '#26262a';
const BELLY = '#d8d6d0';
const INK = '#0a0a0a';
const RED = '#e3151a';
const WHITE = '#f4f4f4';

export const MOODS = ['chill', 'happy', 'annoyed', 'party', 'sleepy', 'sad'];

const MOUTHS = {
  chill: `<path d="M88 104 Q100 110 114 101" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
  happy: `<path d="M86 100 Q100 122 114 100 Z" fill="${INK}"/><path d="M93 108 Q100 116 107 108 Z" fill="${RED}"/>`,
  annoyed: `<path d="M89 107 Q100 101 111 107" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
  party: `<ellipse cx="100" cy="106" rx="11" ry="10" fill="${INK}"/><ellipse cx="100" cy="110" rx="6" ry="4" fill="${RED}"/>`,
  sleepy: `<ellipse cx="100" cy="105" rx="4" ry="3.5" fill="${INK}"/>`,
  sad: `<path d="M89 108 Q100 99 111 108" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
        <path class="sw-tear" d="M142 84 q-5 8 0 11 q5 -3 0 -11 Z" fill="#8fd3ff"/>`,
};

const BROWS = {
  chill: `<path d="M60 58 L84 56 M116 56 L140 58" stroke="${FUR_DARK}" stroke-width="4" stroke-linecap="round"/>`,
  happy: `<path d="M60 55 Q72 48 84 53 M116 53 Q128 48 140 55" fill="none" stroke="${FUR_DARK}" stroke-width="4" stroke-linecap="round"/>`,
  annoyed: `<path d="M60 52 L86 60 M114 60 L140 52" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`,
  party: `<path d="M60 52 Q72 44 84 50 M116 50 Q128 44 140 52" fill="none" stroke="${FUR_DARK}" stroke-width="4" stroke-linecap="round"/>`,
  sleepy: `<path d="M60 60 L84 60 M116 60 L140 60" stroke="${FUR_DARK}" stroke-width="4" stroke-linecap="round"/>`,
  sad: `<path d="M60 58 L84 51 M116 51 L140 58" stroke="${FUR_DARK}" stroke-width="4" stroke-linecap="round"/>`,
};

// Brazos articulados: hombro → codo → mano (cada uno gira desde su punto).
// Las poses del muñeco las pone el CSS con variables (--shL, --elL, --hdL…).
const JOINTS = {
  l: { sh: [60, 140], el: [50, 167], wr: [54, 190] },
  r: { sh: [140, 140], el: [150, 167], wr: [146, 190] },
};

function armMarkup(side, pose = [0, 0, 0], rig = false) {
  const j = JOINTS[side];
  const [sh, el, hd] = pose;
  const t = (deg, [x, y]) => (rig || !deg ? '' : ` transform="rotate(${deg} ${x} ${y})"`);
  const toe = side === 'l' ? -1 : 1;
  return `
    <g class="sw-arm sw-sh-${side}"${t(sh, j.sh)}>
      <path d="M${j.sh} L${j.el}" stroke="${FUR}" stroke-width="16" stroke-linecap="round"/>
      <g class="sw-el-${side}"${t(el, j.el)}>
        <path d="M${j.el} L${j.wr}" stroke="${FUR}" stroke-width="14.5" stroke-linecap="round"/>
        <g class="sw-hd-${side}"${t(hd, j.wr)}>
          <ellipse cx="${j.wr[0] + toe}" cy="${j.wr[1] + 5}" rx="9" ry="8" fill="${FUR_DARK}"/>
          <path d="M${j.wr[0] - 4 + toe} ${j.wr[1] + 9} v3 M${j.wr[0] + toe} ${j.wr[1] + 10} v3 M${j.wr[0] + 4 + toe} ${j.wr[1] + 9} v3" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" opacity="0.6"/>
        </g>
      </g>
    </g>`;
}

const ARMS_CROSSED = `
  <path d="M60 148 Q100 176 140 150" fill="none" stroke="${FUR_DARK}" stroke-width="17" stroke-linecap="round"/>
  <path d="M140 160 Q100 184 60 160" fill="none" stroke="${FUR}" stroke-width="17" stroke-linecap="round"/>`;

// Poses de brazo para el dibujo quieto [hombro, codo, mano] (izquierdo; el derecho es espejo)
const STATIC_POSE = {
  happy: [20, 15, 10],
  annoyed: [26, -56, 0],
  party: [125, 12, 0],
  sleepy: [-6, -12, 0],
  sad: [-12, -25, 0],
};

const CHEEKS = `<g class="sw-cheeks" fill="${RED}" opacity="0.28"><ellipse cx="66" cy="100" rx="8" ry="4.5"/><ellipse cx="134" cy="100" rx="8" ry="4.5"/></g>`;

// Cola en tres partes: cada una gira desde donde se une con la anterior
const TAIL = `
  <g class="sw-tail">
    <path d="M132 196 Q148 210 163 204" fill="none" stroke="${FUR_DARK}" stroke-width="15" stroke-linecap="round"/>
    <g class="sw-tail-2">
      <path d="M163 204 Q178 198 183 186" fill="none" stroke="${FUR_DARK}" stroke-width="12.5" stroke-linecap="round"/>
      <g class="sw-tail-3">
        <path d="M183 186 Q187 174 179 166" fill="none" stroke="${FUR_DARK}" stroke-width="9.5" stroke-linecap="round"/>
      </g>
    </g>
  </g>`;

const LENS = 'M47 66 Q100 54 153 66 L151 80 Q130 92 107 81 L100 77 L93 81 Q70 92 49 80 Z';

let uid = 0;

/** Devuelve el SVG de Swaggy como string. */
export function swaggySvg(mood = 'chill', { className = '', rig = false } = {}) {
  const id = `sw${++uid}`;

  // En el muñeco van todas las variantes y el CSS muestra la del ánimo actual
  const variants = (table) =>
    rig
      ? MOODS.map((m) => `<g class="sw-mood" data-m="${m}">${table[m]}</g>`).join('')
      : table[mood] || table.chill;

  let arms;
  if (rig) {
    arms = `
      <g class="sw-arms-crossed">${ARMS_CROSSED}</g>
      <g class="sw-arms-open">${armMarkup('l', [0, 0, 0], true)}${armMarkup('r', [0, 0, 0], true)}</g>`;
  } else if (mood === 'chill') {
    arms = ARMS_CROSSED;
  } else {
    const pose = STATIC_POSE[mood] || [0, 0, 0];
    arms = armMarkup('l', pose) + armMarkup('r', pose.map((d) => -d));
  }

  const zzz = `<g class="sw-zzz" fill="${WHITE}" font-family="Arial Black, Arial, sans-serif" font-weight="900">
      <text x="150" y="40" font-size="18">z</text><text x="166" y="22" font-size="13">z</text></g>`;
  const notes = `<g class="sw-notes" fill="${WHITE}" font-family="Arial, sans-serif" font-weight="900">
      <text class="sw-note sw-note-1" x="28" y="44" font-size="22">♪</text>
      <text class="sw-note sw-note-2" x="160" y="36" font-size="20" fill="${RED}">♫</text></g>`;
  const extras = rig ? zzz + notes : mood === 'sleepy' ? zzz : '';

  // Ojos (solo se ven cuando se sube los lentes)
  const eyes = rig
    ? `<g class="sw-eyes">
        <g class="sw-eye sw-eye-l"><ellipse cx="75" cy="76" rx="8" ry="8.5" fill="${WHITE}"/><circle class="sw-pupil" cx="76" cy="77" r="4" fill="${INK}"/></g>
        <g class="sw-eye sw-eye-r"><ellipse cx="125" cy="76" rx="8" ry="8.5" fill="${WHITE}"/><circle class="sw-pupil" cx="124" cy="77" r="4" fill="${INK}"/></g>
      </g>`
    : '';

  // Brillo que cruza los lentes
  const glint = rig
    ? `<clipPath id="${id}-lens"><path d="${LENS}"/></clipPath>
       <g clip-path="url(#${id}-lens)"><path class="sw-glint" d="M36 50 h12 l-14 44 h-12 Z" fill="#ffffff" opacity="0.5"/></g>`
    : '';

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" class="${rig ? 'swaggy is-rig ' : ''}${className}" data-mood="${mood}" role="img" aria-label="Swaggy">
 <g class="sw-all">
  ${TAIL}
  <g class="sw-body">
    <ellipse cx="100" cy="164" rx="52" ry="62" fill="${FUR}"/>
    <ellipse cx="100" cy="176" rx="32" ry="42" fill="${BELLY}"/>
    <g class="sw-chain">
      <path d="M72 120 Q100 150 128 120" fill="none" stroke="${WHITE}" stroke-width="2.5" stroke-dasharray="3 2"/>
      <path d="M100 140 V156 M94 146 H106" stroke="${RED}" stroke-width="3.5" stroke-linecap="round"/>
    </g>
  </g>
  <g class="sw-feet">
    <ellipse class="sw-foot-l" cx="78" cy="224" rx="17" ry="9" fill="${FUR_DARK}"/>
    <ellipse class="sw-foot-r" cx="122" cy="224" rx="17" ry="9" fill="${FUR_DARK}"/>
  </g>
  ${arms}
  <g class="sw-head"><g class="sw-head-in">
    <circle class="sw-ear sw-ear-l" cx="62" cy="44" r="11" fill="${FUR_DARK}"/>
    <circle class="sw-ear sw-ear-r" cx="138" cy="44" r="11" fill="${FUR_DARK}"/>
    <circle cx="100" cy="78" r="47" fill="${FUR}"/>
    <ellipse cx="100" cy="98" rx="28" ry="20" fill="${BELLY}"/>
    <ellipse class="sw-nose" cx="100" cy="87" rx="9.5" ry="6.5" fill="${INK}"/>
    <path class="sw-whiskers" d="M72 96 L52 92 M72 101 L52 104 M128 96 L148 92 M128 101 L148 104" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
    ${eyes}
    ${rig || mood === 'happy' || mood === 'party' ? CHEEKS : ''}
    <g class="sw-brows">${variants(BROWS)}</g>
    <g class="sw-glasses">
      <path d="${LENS}" fill="${INK}"/>
      <path d="M58 68 Q74 64 86 67" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
      <path d="M114 67 Q126 64 140 67" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
      <path d="M100 70 L100 74" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>
      ${glint}
    </g>
    <g class="sw-mouth">${variants(MOUTHS)}</g>
  </g></g>
  ${extras}
 </g>
</svg>`;
}

/** Mueve la boca del muñeco mientras "dice" un texto (según lo largo que sea). */
export function talk(svg, text = '') {
  if (!svg || !text) return;
  clearTimeout(svg._talkTimer);
  svg.dataset.talking = '';
  svg._talkTimer = setTimeout(() => delete svg.dataset.talking, Math.min(2600, 300 + text.length * 45));
}

/** Imagen de Swaggy (para dibujar en canvas). */
export function swaggyImage(mood = 'chill') {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(swaggySvg(mood).trim())}`;
  return img;
}
