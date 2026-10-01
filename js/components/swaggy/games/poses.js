import { swaggySvg } from '../art.js';

/**
 * Animaciones de Swaggy para los juegos (cuadro por cuadro)
 * -------------------------------------------------------------
 * Cada animación es una lista de cuadros. Cada cuadro es una pose del
 * muñeco articulado (brazos con hombro/codo/mano, pies, cola, cabeza,
 * cuerpo) con un ánimo (cara).
 *
 * Cuando estén los sprites dibujados (ver assets/images/juegos/LEEME.md),
 * cada animación se reemplaza por su tira de cuadros en PNG.
 *
 *   frames('correr')        → [Image, Image, …]
 *   frame('correr', t, fps) → el cuadro que toca en el tiempo t (segundos)
 */

// espejo: la pose del brazo derecho es la del izquierdo con signo contrario
const m = ([a, b, c = 0]) => [-a, -b, -c];

const ANIMS = {
  // correr: brazos que bombean y pies que se levantan, alternando
  correr: [
    { mood: 'happy', arms: { l: [28, -85, 10], r: m([-12, 15]) }, feet: [[0, -12], [0, 0]], tail: [12, 10, 12], head: [-3, 0, 1], body: [1.02, 0.98] },
    { mood: 'happy', arms: { l: [10, -45, 0], r: m([5, -45]) }, feet: [[0, -4], [0, -4]], tail: [4, 4, 6], head: [0, 0, -2], body: [0.98, 1.03] },
    { mood: 'happy', arms: { l: [-12, 15, 0], r: m([28, -85, 10]) }, feet: [[0, 0], [0, -12]], tail: [-6, -8, -10], head: [3, 0, 1], body: [1.02, 0.98] },
    { mood: 'happy', arms: { l: [5, -45, 0], r: m([10, -45]) }, feet: [[0, -4], [0, -4]], tail: [2, 0, -2], head: [0, 0, -2], body: [0.98, 1.03] },
  ],
  saltar: [{ mood: 'party', arms: { l: [135, -15, 10], r: m([135, -15, 10]) }, feet: [[6, -14], [-6, -14]], tail: [-20, -15, -10], head: [0, 0, -3], body: [0.95, 1.06] }],
  caer: [{ mood: 'happy', arms: { l: [75, 25, 15], r: m([75, 25, 15]) }, feet: [[0, -6], [0, -6]], tail: [15, 15, 15], head: [0, 0, 2], body: [1.04, 0.97] }],
  // voltereta del doble salto: brazos recogidos
  recoger: [{ mood: 'party', arms: { l: [20, -110, 0], r: m([20, -110, 0]) }, feet: [[8, -18], [-8, -18]], tail: [30, 25, 20], head: [0, 0, 4], body: [0.96, 0.96] }],
  golpe: [
    { mood: 'annoyed', arms: { l: [70, 60, 25], r: m([40, 80, 25]) }, feet: [[-6, -8], [6, 0]], tail: [-25, -20, -15], head: [12, 3, 2], body: [1.05, 0.95] },
    { mood: 'annoyed', arms: { l: [50, 80, 25], r: m([70, 60, 25]) }, feet: [[-6, 0], [6, -8]], tail: [-15, -10, -5], head: [-10, -3, 2], body: [1.05, 0.95] },
  ],
  // aletear con la lata (Flap): golpe de brazos hacia abajo y planeo
  aletear: [
    { mood: 'party', arms: { l: [125, 10, 20], r: m([125, 10, 20]) }, feet: [[4, -2], [-4, -2]], tail: [-15, -10, -5], head: [0, 0, -2] },
    { mood: 'party', arms: { l: [60, 30, 10], r: m([60, 30, 10]) }, feet: [[2, 4], [-2, 4]], tail: [5, 5, 5], head: [0, 0, 1] },
  ],
  planear: [
    { mood: 'happy', arms: { l: [95, 15, 0], r: m([95, 15, 0]) }, feet: [[0, 4], [0, 4]], tail: [10, 8, 6] },
    { mood: 'happy', arms: { l: [88, 20, 8], r: m([88, 20, 8]) }, feet: [[0, 6], [0, 6]], tail: [14, 12, 10] },
  ],
  // bailar: 4 cuadros que se repiten con el beat
  bailar: [
    { mood: 'party', arms: { l: [140, -20, 15], r: m([20, -60, 0]) }, feet: [[0, -10], [0, 0]], tail: [15, 15, 15], head: [-8, -3, 0], body: [1, 1.03] },
    { mood: 'happy', arms: { l: [90, 40, 0], r: m([90, 40, 0]) }, feet: [[0, 0], [0, 0]], tail: [0, 0, 0], head: [0, 0, 3], body: [1.04, 0.96] },
    { mood: 'party', arms: { l: [20, -60, 0], r: m([140, -20, 15]) }, feet: [[0, 0], [0, -10]], tail: [-15, -15, -15], head: [8, 3, 0], body: [1, 1.03] },
    { mood: 'happy', arms: { l: [60, -90, 20], r: m([60, -90, 20]) }, feet: [[-4, 0], [4, 0]], tail: [0, 0, 0], head: [0, 0, 3], body: [1.04, 0.96] },
  ],
  // celebrar: brazos arriba bombeando
  celebrar: [
    { mood: 'party', arms: { l: [125, 12, 15], r: m([125, 12, 15]) }, feet: [[0, -8], [0, -8]], tail: [-20, -15, -10], head: [0, 0, -4], body: [0.96, 1.05] },
    { mood: 'party', arms: { l: [110, 35, -10], r: m([110, 35, -10]) }, feet: [[0, 0], [0, 0]], tail: [15, 10, 5], head: [0, 0, 2], body: [1.04, 0.96] },
  ],
  // nervioso (Tap the Drop / Stack): manos juntas, temblando
  nervioso: [
    { mood: 'sad', arms: { l: [-14, -30, -10], r: m([-14, -30, -10]) }, tail: [5, 5, 5], head: [-2, -1, 0] },
    { mood: 'sad', arms: { l: [-10, -38, -18], r: m([-10, -38, -18]) }, tail: [-5, -5, -5], head: [2, 1, 0] },
  ],
  triste: [{ mood: 'sad', arms: { l: [-8, -20, -15], r: m([-8, -20, -15]) }, tail: [20, 15, 10], head: [8, 0, 6], body: [1.03, 0.97] }],
  // pintar (Guardia): brazo derecho estirado hacia el muro, el izquierdo en la cintura
  pintar: [
    { mood: 'happy', arms: { l: [26, -56, 0], r: m([110, 25, 10]) }, feet: [[0, 0], [0, 0]], tail: [10, 10, 10], head: [-6, -2, 0] },
    { mood: 'happy', arms: { l: [26, -56, 0], r: m([100, 45, -10]) }, feet: [[0, 0], [0, -3]], tail: [-5, -5, -5], head: [-4, -2, 1] },
    { mood: 'happy', arms: { l: [26, -56, 0], r: m([115, 5, 15]) }, feet: [[0, 0], [0, 0]], tail: [5, 5, 5], head: [-7, -2, 0] },
  ],
  // disimular: brazos cruzados, mirando para otro lado
  disimular: [
    { mood: 'chill', arms: 'crossed', head: [-10, -4, 0], tail: [10, 10, 10] },
    { mood: 'chill', arms: 'crossed', head: [-12, -4, -1], tail: [-6, -6, -6] },
  ],
  // caminar (Atrapa la lata)
  caminar: [
    { mood: 'happy', arms: { l: [18, 10, 5], r: m([-5, -10]) }, feet: [[0, -8], [0, 0]], tail: [10, 8, 6], head: [-2, 0, 0] },
    { mood: 'happy', arms: { l: [5, 0, 0], r: m([5, 0]) }, feet: [[0, -2], [0, -2]], tail: [0, 0, 0], head: [0, 0, -1] },
    { mood: 'happy', arms: { l: [-5, -10, 0], r: m([18, 10, 5]) }, feet: [[0, 0], [0, -8]], tail: [-10, -8, -6], head: [2, 0, 0] },
    { mood: 'happy', arms: { l: [5, 0, 0], r: m([5, 0]) }, feet: [[0, -2], [0, -2]], tail: [0, 0, 0], head: [0, 0, -1] },
  ],
  quieto: [
    { mood: 'happy', arms: { l: [18, 12, 8], r: m([18, 12, 8]) }, tail: [6, 6, 6] },
    { mood: 'happy', arms: { l: [16, 16, 4], r: m([16, 16, 4]) }, tail: [-4, -4, -4], body: [1.01, 0.99] },
  ],
  atrapar: [{ mood: 'party', arms: { l: [150, -30, 0], r: m([150, -30, 0]) }, feet: [[0, -6], [0, -6]], tail: [-15, -10, -5], head: [0, 0, -3] }],
  guinar: [{ mood: 'happy', arms: { l: [26, -56, 0], r: m([156, 22, 30]) }, glasses: 26, tail: [10, 10, 10] }],
};

const cache = new Map();

const toImage = (svg) => {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
  return img;
};

/** Cuadros (imágenes) de una animación. */
export function frames(name) {
  if (!cache.has(name)) {
    const list = (ANIMS[name] || ANIMS.quieto).map(({ mood = 'happy', ...pose }) => toImage(swaggySvg(mood, { pose })));
    cache.set(name, list);
  }
  return cache.get(name);
}

/** El cuadro que toca en el tiempo t (segundos) a cierta velocidad (cuadros por segundo). */
export function frame(name, t, fps = 8) {
  const list = frames(name);
  return list[Math.floor(Math.max(0, t) * fps) % list.length];
}

/** Carga todas las animaciones de una vez (para que no parpadeen al empezar). */
export function preload(names) {
  names.forEach(frames);
}
