/**
 * Swaggy — versión PROVISIONAL dibujada con código (SVG).
 * -------------------------------------------------------------
 * Nutria con lentes deportivos oscuros, el brother de la marca.
 * Cuando esté la ilustración oficial, basta con reemplazar esta
 * función por <img> de cada pose (mismos nombres de ánimo).
 *
 * Ánimos: 'chill' | 'happy' | 'annoyed' | 'party' | 'sleepy'
 * El SVG es autónomo (colores en línea) para poder dibujarse
 * también dentro del canvas de los juegos.
 */

const FUR = '#3b3b3f';
const FUR_DARK = '#26262a';
const BELLY = '#d8d6d0';
const INK = '#0a0a0a';
const RED = '#e3151a';

const MOUTHS = {
  chill: `<path d="M88 104 Q100 110 114 101" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
  happy: `<path d="M86 100 Q100 122 114 100 Z" fill="${INK}"/><path d="M93 108 Q100 116 107 108 Z" fill="${RED}"/>`,
  annoyed: `<path d="M89 107 Q100 101 111 107" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
  party: `<ellipse cx="100" cy="106" rx="11" ry="10" fill="${INK}"/><ellipse cx="100" cy="110" rx="6" ry="4" fill="${RED}"/>`,
  sleepy: `<ellipse cx="100" cy="105" rx="4" ry="3.5" fill="${INK}"/>`,
};

const BROWS = {
  chill: `<path d="M60 58 L84 56 M116 56 L140 58" stroke="${FUR_DARK}" stroke-width="4" stroke-linecap="round"/>`,
  happy: `<path d="M60 55 Q72 48 84 53 M116 53 Q128 48 140 55" fill="none" stroke="${FUR_DARK}" stroke-width="4" stroke-linecap="round"/>`,
  annoyed: `<path d="M60 52 L86 60 M114 60 L140 52" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`,
  party: `<path d="M60 52 Q72 44 84 50 M116 50 Q128 44 140 52" fill="none" stroke="${FUR_DARK}" stroke-width="4" stroke-linecap="round"/>`,
  sleepy: `<path d="M60 60 L84 60 M116 60 L140 60" stroke="${FUR_DARK}" stroke-width="4" stroke-linecap="round"/>`,
};

const ARMS_DOWN = `
  <path d="M58 140 Q44 170 56 196" fill="none" stroke="${FUR}" stroke-width="16" stroke-linecap="round"/>
  <path d="M142 140 Q156 170 144 196" fill="none" stroke="${FUR}" stroke-width="16" stroke-linecap="round"/>`;

const ARMS_UP = `
  <path d="M60 138 Q36 112 40 84" fill="none" stroke="${FUR}" stroke-width="16" stroke-linecap="round"/>
  <path d="M140 138 Q164 112 160 84" fill="none" stroke="${FUR}" stroke-width="16" stroke-linecap="round"/>`;

const ARMS_CROSSED = `
  <path d="M60 148 Q100 176 140 150" fill="none" stroke="${FUR_DARK}" stroke-width="17" stroke-linecap="round"/>
  <path d="M140 160 Q100 184 60 160" fill="none" stroke="${FUR}" stroke-width="17" stroke-linecap="round"/>`;

/** Devuelve el SVG de Swaggy como string. */
export function swaggySvg(mood = 'chill', { className = '' } = {}) {
  const arms = mood === 'party' ? ARMS_UP : mood === 'chill' ? ARMS_CROSSED : ARMS_DOWN;
  const zzz =
    mood === 'sleepy'
      ? `<g fill="#f4f4f4" font-family="Arial Black, Arial, sans-serif" font-weight="900">
           <text x="150" y="40" font-size="18">z</text><text x="164" y="24" font-size="13">z</text></g>`
      : '';
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" class="${className}" role="img" aria-label="Swaggy">
  <!-- cola -->
  <path d="M138 206 Q190 214 186 176 Q184 164 174 170 Q176 196 132 190 Z" fill="${FUR_DARK}"/>
  <!-- cuerpo -->
  <ellipse cx="100" cy="164" rx="52" ry="62" fill="${FUR}"/>
  <ellipse cx="100" cy="176" rx="32" ry="42" fill="${BELLY}"/>
  <!-- cadena con cruz (Saint Mode) -->
  <path d="M72 120 Q100 150 128 120" fill="none" stroke="#f4f4f4" stroke-width="2.5" stroke-dasharray="3 2"/>
  <path d="M100 140 V156 M94 146 H106" stroke="${RED}" stroke-width="3.5" stroke-linecap="round"/>
  <!-- pies -->
  <ellipse cx="78" cy="224" rx="17" ry="9" fill="${FUR_DARK}"/>
  <ellipse cx="122" cy="224" rx="17" ry="9" fill="${FUR_DARK}"/>
  ${arms}
  <!-- cabeza -->
  <circle cx="62" cy="44" r="11" fill="${FUR_DARK}"/>
  <circle cx="138" cy="44" r="11" fill="${FUR_DARK}"/>
  <circle cx="100" cy="78" r="47" fill="${FUR}"/>
  <ellipse cx="100" cy="98" rx="28" ry="20" fill="${BELLY}"/>
  <ellipse cx="100" cy="87" rx="9.5" ry="6.5" fill="${INK}"/>
  <path d="M72 96 L52 92 M72 101 L52 104 M128 96 L148 92 M128 101 L148 104" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
  ${BROWS[mood] || BROWS.chill}
  <!-- lentes deportivos oscuros -->
  <path d="M47 66 Q100 54 153 66 L151 80 Q130 92 107 81 L100 77 L93 81 Q70 92 49 80 Z" fill="${INK}"/>
  <path d="M58 68 Q74 64 86 67" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <path d="M114 67 Q126 64 140 67" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
  <path d="M100 70 L100 74" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>
  ${MOUTHS[mood] || MOUTHS.chill}
  ${zzz}
</svg>`;
}

/** Imagen de Swaggy (para dibujar en canvas). */
export function swaggyImage(mood = 'chill') {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(swaggySvg(mood).trim())}`;
  return img;
}
