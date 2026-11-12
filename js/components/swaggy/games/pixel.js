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
 *
 * Rendimiento: la paleta la aplica la tarjeta gráfica (un lienzo WebGL
 * encima del juego, con el mismo resultado). Si el equipo no tiene WebGL,
 * se hace con el procesador como antes (PIXEL.gpu = false lo fuerza).
 */
export const PIXEL = { enabled: true, gpu: true };

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

/**
 * Tope de 60 cuadros por segundo para los juegos: en pantallas de 120 o
 * 144 Hz no hace falta dibujar el doble (calienta más y no se nota).
 * Uso al inicio de cada cuadro:  if (skipFrame(now, last)) { ...pedir otro cuadro; return; }
 */
export const skipFrame = (now, last) => now - last < 10;

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
  // si el lienzo de la tarjeta gráfica ya está sobre este, se reacomoda de una vez
  if (gpu && gpu.canvas.previousElementSibling === canvas) placeGpu(canvas);
  else canvas._pxDirty = true;
  return { W, H };
}

// ---------- Paleta con la tarjeta gráfica (WebGL) ----------
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG = `
precision highp float;
uniform sampler2D uSrc, uLut, uBayer;
uniform vec2 uSize;
void main(){
  float x = floor(gl_FragCoord.x);
  float y = uSize.y - 1.0 - floor(gl_FragCoord.y); // fila contando desde arriba
  vec4 c = texture2D(uSrc, vec2((x + 0.5) / uSize.x, (y + 0.5) / uSize.y));
  // casi transparente: se ve el fondo de la pantalla del arcade (#050505)
  if (c.a * 255.0 < 109.5) { gl_FragColor = vec4(vec3(5.0 / 255.0), 1.0); return; }
  float t = floor(texture2D(uBayer, vec2((x + 0.5) / 4.0, (y + 0.5) / 4.0)).r * 255.0 + 0.5) - 6.0;
  vec3 q = floor(clamp(floor(c.rgb * 255.0 + 0.5) + t, 0.0, 255.0) / 8.0);
  gl_FragColor = vec4(texture2D(uLut, vec2((q.g * 32.0 + q.b + 0.5) / 1024.0, (q.r + 0.5) / 32.0)).rgb, 1.0);
}`;

let gpu = null; // { canvas, gl, src, uSize } | false si no se puede

function initGpu() {
  try {
    const canvas = document.createElement('canvas');
    canvas.className = 'game__gl';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!gl) return false;
    const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!hp || !hp.precision) return false; // sin precisión alta el color no saldría exacto
    const shader = (type, code) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, code);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const texture = (unit, name, repeat) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(prog, name), unit);
      return tex;
    };
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    // tabla de la paleta: 1024 × 32 (columna = verde·32 + azul, fila = rojo)
    texture(1, 'uLut', false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 32, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(LUT.buffer));
    // tramado 4 × 4 (guardado como valor + 6 para que no sea negativo)
    texture(2, 'uBayer', true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 4, 4, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array(BAYER.map((v) => v + 6)));
    const src = texture(0, 'uSrc', false);
    gl.activeTexture(gl.TEXTURE0);
    if (gl.getError() !== gl.NO_ERROR) return false;
    // si el navegador le quita el WebGL (poca memoria), se sigue con el procesador
    canvas.addEventListener('webglcontextlost', () => {
      canvas.remove();
      gpu = false;
    });
    return { canvas, gl, src, uSize: gl.getUniformLocation(prog, 'uSize') };
  } catch (error) {
    console.warn('[pixel] sin tarjeta gráfica para la paleta, se usa el procesador:', error);
    return false;
  }
}

/** Pone el lienzo WebGL justo encima del lienzo del juego, del mismo tamaño. */
function placeGpu(source) {
  const { canvas, gl } = gpu;
  const w = source.width;
  const h = source.height;
  if (canvas.previousElementSibling !== source) source.after(canvas);
  source._pxDirty = false;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  canvas.style.left = `${source.offsetLeft}px`;
  canvas.style.top = `${source.offsetTop}px`;
  canvas.style.width = `${source.offsetWidth}px`;
  canvas.style.height = `${source.offsetHeight}px`;
  gl.viewport(0, 0, w, h);
  gl.uniform2f(gpu.uSize, w, h);
}

/** Dibuja el cuadro con la paleta usando la tarjeta gráfica. false = no se pudo. */
function gpuPost(ctx) {
  if (gpu === null) gpu = initGpu();
  if (!gpu) return false;
  const source = ctx.canvas;
  const { canvas, gl } = gpu;
  if (canvas.previousElementSibling !== source || source._pxDirty) {
    if (!source.parentNode) return false;
    placeGpu(source);
  }
  gl.bindTexture(gl.TEXTURE_2D, gpu.src);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  return true;
}

/** Pasa el cuadro dibujado a la paleta del arcade. */
export function pixelPost(ctx) {
  if (!PIXEL.enabled) {
    if (gpu) gpu.canvas.remove();
    return;
  }
  const { width: w, height: h } = ctx.canvas;
  if (!w || !h) return;
  if (PIXEL.gpu && gpuPost(ctx)) return;
  if (gpu) gpu.canvas.remove();
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
