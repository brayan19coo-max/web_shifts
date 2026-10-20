/**
 * Animaciones de Swaggy para los juegos (cuadro por cuadro)
 * -------------------------------------------------------------
 * Son el Swaggy 3D grabado desde la calle 3D (swaggy3d.html), en tiras
 * de cuadros: assets/images/juegos/3d/<nombre>.webp (ver manifest.json).
 * En el juego, el filtro de pixel art (pixel.js) lo deja en estilo arcade.
 *
 *   frames('correr')        → [lienzo, lienzo, …] (cada uno con .complete)
 *   frame('correr', t, fps) → el cuadro que toca en el tiempo t (segundos)
 *
 * Vistas: 'correr', 'saltar', 'caer', 'recoger', 'golpe_lado', 'aletear' y
 * 'planear' son de lado (mirando a la derecha); las demás de frente.
 * Para regrabarlas: tools/swaggy3d/game_studio.py → capture_games.py →
 * build_game_sheets.py.
 */
const BASE = 'assets/images/juegos/3d/';
const VERSION = '1';
const STRIP_FPS = 12;

// cuadros y tamaño de cada tira (igual que manifest.json)
const ANIMS = {
  aletear: [2, 158], atrapar: [1, 207], bailar: [4, 207], caer: [1, 158], caminar: [4, 207], celebrar: [10, 207],
  correr: [4, 158], disimular: [16, 207], golpe: [8, 207], golpe_lado: [8, 158], nervioso: [8, 207], pintar: [12, 207],
  planear: [4, 158], quieto: [24, 207], recoger: [1, 158], saltar: [1, 158], triste: [12, 207],
};
const FRAME_H = 220;
// nombres viejos que se siguen usando
const ALIAS = { guinar: 'celebrar' };

const cache = new Map();

function loadStrip(name) {
  const [n, w] = ANIMS[name];
  const list = Array.from({ length: n }, () => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = FRAME_H;
    c.complete = false; // los juegos esperan .complete como en una imagen
    return c;
  });
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    list.forEach((c, i) => {
      c.getContext('2d').drawImage(img, i * w, 0, w, FRAME_H, 0, 0, w, FRAME_H);
      c.complete = true;
    });
  };
  img.src = `${BASE}${name}.webp?v=${VERSION}`;
  return list;
}

/** Cuadros de una animación. */
export function frames(name) {
  name = ALIAS[name] || name;
  if (!ANIMS[name]) name = 'quieto';
  if (!cache.has(name)) cache.set(name, loadStrip(name));
  return cache.get(name);
}

/**
 * El cuadro que toca en el tiempo t (segundos). Las animaciones largas
 * (grabadas a 12 cuadros por segundo) van a su velocidad real; las cortas,
 * a la velocidad que pide el juego.
 */
export function frame(name, t, fps = 8) {
  const list = frames(name);
  const speed = list.length > 4 ? STRIP_FPS : fps;
  return list[Math.floor(Math.max(0, t) * speed) % list.length];
}

/** Carga todas las animaciones de una vez (para que no parpadeen al empezar). */
export function preload(names = Object.keys(ANIMS)) {
  names.forEach(frames);
}

/** Ancho/alto de un cuadro (para dibujarlo sin deformarlo). */
export const aspect = (img) => (img?.width || 207) / (img?.height || FRAME_H);
