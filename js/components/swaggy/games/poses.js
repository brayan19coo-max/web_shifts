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
const VERSION = '3';
const STRIP_FPS = 12;

// cuadros y tamaño de cada tira (igual que manifest.json)
const ANIMS = {
  aletear: [2, 159], atrapar: [1, 207], bailar: [4, 207], caer: [1, 159], caminar: [4, 207], celebrar: [10, 207],
  correr: [12, 159], disimular: [16, 207], golpe: [8, 207], golpe_lado: [8, 159], nervioso: [8, 207], pintar: [12, 207],
  planear: [4, 159], quieto: [24, 207], recoger: [1, 159], saltar: [1, 159], triste: [12, 207],
  // guardia y perro de "Esquiva al guardia"
  guardia_espalda: [12, 234], guardia_grita: [8, 234], guardia_mira: [8, 234], guardia_sospecha: [8, 234], guardia_voltea: [6, 234], perro_alerta: [6, 247], perro_duerme: [12, 247], perro_ladra: [8, 247],
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
      const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, i * w, 0, w, FRAME_H, 0, 0, w, FRAME_H);
      // .foot = dónde termina el dibujo por abajo (0..1), para pegarlo al piso
      c.foot = 1;
      try {
        const a = cx.getImageData(0, 0, w, FRAME_H).data;
        let y = FRAME_H - 1;
        for (; y > 0; y--) {
          let hit = false;
          for (let x = 0; x < w; x++) if (a[(y * w + x) * 4 + 3] > 110) { hit = true; break; }
          if (hit) break;
        }
        c.foot = (y + 1) / FRAME_H;
      } catch (e) { /* sin acceso a los píxeles: se queda en 1 */ }
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
