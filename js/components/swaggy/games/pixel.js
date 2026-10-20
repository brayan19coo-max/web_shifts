/**
 * Modo arcade pixel art
 * -------------------------------------------------------------
 * Todos los mini juegos dibujan igual que antes (en coordenadas de
 * pantalla), pero el lienzo real es pequeño: cada "pixel" del juego
 * ocupa 2 o 3 pixeles de la pantalla y se agranda sin suavizar.
 * Al final de cada cuadro, cada pixel se ajusta a una paleta fija de
 * arcade con un tramado (dithering) ordenado, como en las máquinas
 * de los 80 y 90.
 *
 *   fitPixel(canvas, ctx)  → ajusta el tamaño; devuelve { W, H } en px de pantalla
 *   pixelPost(ctx)         → aplica la paleta al cuadro ya dibujado
 *   PIXEL.enabled          → apágalo para volver al dibujo normal
 */
export const PIXEL = { enabled: true };

// Paleta del arcade de Swaggy (40 colores)
const PALETTE = [
  '#0a0a0a', '#1b1a22', '#2b2b2b', '#3a3f45', '#5a5a66', '#8a8a8a', '#bdbdc6', '#f4f4f4',
  '#e3151a', '#8b0f1a', '#ff6b4a', '#ff8a1f', '#f2c14e', '#ffe680', '#7a4a2a', '#c8925e',
  '#2f4a7a', '#3b6fd6', '#7fc6ff', '#2de2e6', '#1c2230', '#12162a', '#5a2a7a', '#9a5cff',
  '#ff3b8b', '#ff9fd0', '#3fae4a', '#b6f03c', '#1f5a33', '#9fb4ff', '#f0c8a0', '#3a1f33',
  '#121216', '#202026', '#34343c', '#46464f', '#6e6e78', '#a4a4ae', '#dcdce2', '#4a1418',
].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);

// Tabla rápida: color reducido a 5 bits por canal → color de la paleta
const LUT = new Uint32Array(32768);
(() => {
  const little = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  for (let i = 0; i < 32768; i++) {
    const r = ((i >> 10) & 31) * 8 + 4;
    const g = ((i >> 5) & 31) * 8 + 4;
    const b = (i & 31) * 8 + 4;
    let best = 0;
    let bd = Infinity;
    for (let k = 0; k < PALETTE.length; k++) {
      const [pr, pg, pb] = PALETTE[k];
      // distancia con peso perceptual simple
      const d = (r - pr) * (r - pr) * 3 + (g - pg) * (g - pg) * 4 + (b - pb) * (b - pb) * 2;
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    const [pr, pg, pb] = PALETTE[best];
    LUT[i] = little ? (255 << 24) | (pb << 16) | (pg << 8) | pr : (pr << 24) | (pg << 16) | (pb << 8) | 255;
  }
})();

// Tramado ordenado 4×4 (Bayer), en pasos de color
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => Math.round((v / 16 - 0.5) * 12));

/** Cuántos pixeles de pantalla mide cada pixel del juego. */
export function pixelScale(width) {
  if (!PIXEL.enabled) return 1 / Math.min(2, window.devicePixelRatio || 1);
  return width > 760 ? 3 : 2;
}

/** Ajusta el lienzo al modo pixel. Devuelve el tamaño en px de pantalla. */
export function fitPixel(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  const s = pixelScale(W);
  canvas.width = Math.max(1, Math.ceil(W / s));
  canvas.height = Math.max(1, Math.ceil(H / s));
  ctx.setTransform(1 / s, 0, 0, 1 / s, 0, 0);
  ctx.imageSmoothingEnabled = !PIXEL.enabled;
  canvas.style.imageRendering = PIXEL.enabled ? 'pixelated' : '';
  canvas.classList.toggle('is-pixel', PIXEL.enabled);
  return { W, H };
}

/** Pasa el cuadro dibujado a la paleta del arcade. */
export function pixelPost(ctx) {
  if (!PIXEL.enabled) return;
  const { width: w, height: h } = ctx.canvas;
  if (!w || !h) return;
  const img = ctx.getImageData(0, 0, w, h);
  const px = new Uint32Array(img.data.buffer);
  const d = img.data;
  for (let y = 0, i = 0; y < h; y++) {
    const row = (y & 3) << 2;
    for (let x = 0; x < w; x++, i++) {
      const o = i << 2;
      if (d[o + 3] < 110) {
        px[i] = 0;
        continue;
      }
      const t = BAYER[row | (x & 3)];
      let r = d[o] + t;
      let g = d[o + 1] + t;
      let b = d[o + 2] + t;
      r = r < 0 ? 0 : r > 255 ? 255 : r;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      b = b < 0 ? 0 : b > 255 ? 255 : b;
      px[i] = LUT[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];
    }
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.putImageData(img, 0, 0);
  ctx.restore();
}
