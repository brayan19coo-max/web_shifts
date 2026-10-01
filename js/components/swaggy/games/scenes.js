/**
 * Escenarios de los juegos (fondos por capas dibujados con código)
 * -------------------------------------------------------------
 * Cada escenario tiene cielo, una capa lejana (skyline), una capa media y
 * detalles (lluvia, rayos, estrellas, neón…). Se mueven a distinta
 * velocidad para dar profundidad (paralaje).
 *
 * Cuando estén los fondos dibujados (ver assets/images/juegos/LEEME.md),
 * se reemplaza el dibujo de cada capa por su imagen.
 */
import { bigText } from './kit.js';

// Aleatorio "fijo": el mismo número siempre da el mismo resultado,
// así los edificios no cambian de forma mientras se mueven.
export const rnd = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const TAGS = ["SHIFT'S", 'SWAGGY', 'CREW', 'B&C', 'DROP 02', 'STYLE', '★', 'LEY'];

export const SCENES = {
  barrio: { name: 'Barrio de noche', sky: ['#07080f', '#1b1622'] },
  puente: { name: 'El puente', sky: ['#0d1630', '#3a2f55'] },
  azoteas: { name: 'Azoteas al atardecer', sky: ['#2a1035', '#ff6a3d'] },
  metro: { name: 'El metro', sky: ['#0d1013', '#14181c'] },
  neon: { name: 'Ciudad neón', sky: ['#05050a', '#16081a'] },
  tormenta: { name: 'Tormenta', sky: ['#05080e', '#1a2232'] },
};

/** Edificios en silueta con ventanas. */
export function skyline(ctx, { W, base, offset, seed, slot, minH, maxH, color, windows = 0, winColor = '#ffd27a', tanks = false, antennas = false }) {
  const first = Math.floor(offset / slot) - 1;
  for (let i = first; i < first + W / slot + 3; i++) {
    const x = i * slot - offset;
    const w = slot * (0.75 + rnd(i * 3 + seed) * 0.45);
    const h = minH + rnd(i * 7 + seed) * (maxH - minH);
    ctx.fillStyle = color;
    ctx.fillRect(x, base - h, w, h + 2);
    if (tanks && rnd(i + seed * 2) < 0.45) {
      // tanque de agua en la azotea
      const tx = x + w * 0.3;
      ctx.fillRect(tx, base - h - slot * 0.32, slot * 0.28, slot * 0.22);
      ctx.fillRect(tx + slot * 0.03, base - h - slot * 0.1, slot * 0.04, slot * 0.1);
      ctx.fillRect(tx + slot * 0.21, base - h - slot * 0.1, slot * 0.04, slot * 0.1);
    }
    if (antennas && rnd(i * 5 + seed) < 0.5) {
      ctx.fillRect(x + w * 0.7, base - h - slot * 0.5, 2, slot * 0.5);
      ctx.fillRect(x + w * 0.7 - 6, base - h - slot * 0.4, 14, 2);
    }
    if (windows) {
      const cw = Math.max(5, slot * 0.09);
      for (let wy = base - h + cw * 1.4; wy < base - cw; wy += cw * 2) {
        for (let wx = x + cw; wx < x + w - cw; wx += cw * 1.9) {
          const k = rnd(Math.floor(wx * 0.37) + Math.floor(wy * 1.3) + i * 13);
          if (k < windows) {
            ctx.fillStyle = k < windows * 0.25 ? 'rgba(227,21,26,0.55)' : winColor;
            ctx.fillRect(wx, wy, cw, cw * 1.2);
          }
        }
      }
    }
  }
}

function sky(ctx, W, H, [top, bottom]) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function stars(ctx, W, H, n, seed = 1, t = 0) {
  for (let i = 0; i < n; i++) {
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + rnd(i + seed)) + i));
    ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.5 * tw * rnd(i * 2 + seed)})`;
    ctx.fillRect(rnd(i * 3 + seed) * W, rnd(i * 5 + seed) * H, 1.6, 1.6);
  }
}

function rain(ctx, W, H, t, amount = 90) {
  ctx.strokeStyle = 'rgba(180,200,255,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < amount; i++) {
    const speed = 700 + rnd(i) * 500;
    const x = (rnd(i * 3) * (W + 200) - ((t * speed * 0.3) % (W + 200)) + W + 200) % (W + 200) - 100;
    const y = (rnd(i * 7) * H + t * speed) % (H + 40) - 20;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 6, y + 16);
  }
  ctx.stroke();
}

/** Muro de ladrillo con tags (capa media del barrio). */
function brickBand(ctx, W, top, bottom, offset, unit, seed = 0) {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, top, W, bottom - top);
  const bh = unit;
  const bw = bh * 2.4;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  const off = ((offset % (bw * 2)) + bw * 2) % (bw * 2);
  for (let row = 0, y = bottom; y > top; row++, y -= bh) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    const shift = row % 2 ? bw / 2 : 0;
    for (let x = -off + shift; x < W + bw; x += bw) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, Math.max(top, y - bh));
      ctx.stroke();
    }
  }
  // tags de graffiti, fijos en el muro
  const slot = unit * 9;
  const first = Math.floor(offset / slot) - 1;
  for (let i = first; i < first + W / slot + 3; i++) {
    if (rnd(i + seed) < 0.35) continue;
    const x = i * slot - offset + rnd(i * 2 + seed) * slot * 0.4;
    const y = top + (bottom - top) * (0.3 + rnd(i * 4 + seed) * 0.45);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rnd(i * 9 + seed) - 0.5) * 0.3);
    const red = rnd(i * 11 + seed) < 0.35;
    bigText(ctx, TAGS[Math.floor(rnd(i * 13 + seed) * TAGS.length)], 0, 0, unit * (1.6 + rnd(i * 17) * 1.4), {
      fill: red ? 'rgba(227,21,26,0.6)' : 'rgba(255,255,255,0.14)',
      stroke: 'rgba(0,0,0,0.5)',
      align: 'left',
    });
    ctx.restore();
  }
}

/**
 * Dibuja un escenario de fondo.
 * @param {object} o { W, H, ground (y del piso), scroll (px recorridos), t (segundos), unit }
 */
export function drawScene(ctx, id, { W, H, ground, scroll = 0, t = 0, unit = 300 }) {
  const s = SCENES[id] || SCENES.barrio;
  const slot = Math.max(50, unit * 0.32);
  sky(ctx, W, ground, s.sky);

  if (id === 'barrio') {
    stars(ctx, W, ground * 0.6, 60, 3, t);
    ctx.fillStyle = '#f2ead0';
    ctx.beginPath();
    ctx.arc(W * 0.8 - (scroll * 0.02) % W, ground * 0.2, unit * 0.07, 0, Math.PI * 2);
    ctx.fill();
    skyline(ctx, { W, base: ground * 0.78, offset: scroll * 0.12, seed: 11, slot, minH: ground * 0.25, maxH: ground * 0.55, color: '#11121b', windows: 0.25 });
    brickBand(ctx, W, ground * 0.5, ground, scroll * 0.35, Math.max(12, unit * 0.045), 5);
    // postes de luz
    const lamp = unit * 1.6;
    const first = Math.floor((scroll * 0.6) / lamp) - 1;
    for (let i = first; i < first + W / lamp + 3; i++) {
      const x = i * lamp - scroll * 0.6;
      ctx.fillStyle = '#0c0c0c';
      ctx.fillRect(x, ground - unit * 0.62, 5, unit * 0.62);
      ctx.fillRect(x, ground - unit * 0.62, unit * 0.12, 5);
      const g = ctx.createRadialGradient(x + unit * 0.1, ground - unit * 0.58, 2, x + unit * 0.1, ground - unit * 0.3, unit * 0.45);
      g.addColorStop(0, 'rgba(255,214,140,0.35)');
      g.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - unit * 0.4, ground - unit * 0.65, unit * 0.9, unit * 0.65);
    }
  } else if (id === 'puente') {
    stars(ctx, W, ground * 0.5, 40, 7, t);
    skyline(ctx, { W, base: ground * 0.72, offset: scroll * 0.08, seed: 21, slot: slot * 0.8, minH: ground * 0.15, maxH: ground * 0.4, color: '#1d1a33', windows: 0.3, winColor: '#ffe3a3' });
    // agua
    ctx.fillStyle = '#0f1426';
    ctx.fillRect(0, ground * 0.72, W, ground * 0.28);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = 'rgba(255,227,163,0.12)';
      ctx.fillRect(((rnd(i) * W - scroll * 0.15) % W + W) % W, ground * (0.76 + rnd(i * 3) * 0.2), 20 + rnd(i * 5) * 30, 2);
    }
    // arcos y cables del puente
    const span = unit * 2.4;
    const first = Math.floor((scroll * 0.45) / span) - 1;
    ctx.strokeStyle = '#4a4570';
    ctx.lineWidth = Math.max(4, unit * 0.025);
    for (let i = first; i < first + W / span + 3; i++) {
      const x = i * span - scroll * 0.45;
      ctx.fillStyle = '#3a3658';
      ctx.fillRect(x - unit * 0.04, ground * 0.25, unit * 0.08, ground * 0.75);
      ctx.beginPath();
      ctx.moveTo(x, ground * 0.27);
      ctx.quadraticCurveTo(x + span / 2, ground * 0.62, x + span, ground * 0.27);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      for (let k = 1; k < 8; k++) {
        const cx = x + (span * k) / 8;
        const cy = ground * 0.27 + Math.sin((Math.PI * k) / 8) * ground * 0.175;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, ground * 0.86);
        ctx.stroke();
      }
      ctx.lineWidth = Math.max(4, unit * 0.025);
    }
    ctx.fillStyle = '#1b1a2a';
    ctx.fillRect(0, ground * 0.86, W, ground * 0.14);
    ctx.fillStyle = COLORS_RED;
    for (let x = -((scroll * 0.9) % 60); x < W; x += 60) ctx.fillRect(x, ground * 0.88, 30, 3);
  } else if (id === 'azoteas') {
    // sol grande del atardecer
    const sunY = ground * 0.62;
    const g = ctx.createRadialGradient(W * 0.3, sunY, 4, W * 0.3, sunY, unit * 0.5);
    g.addColorStop(0, 'rgba(255,220,150,1)');
    g.addColorStop(0.35, 'rgba(255,150,80,0.9)');
    g.addColorStop(1, 'rgba(255,120,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, ground);
    skyline(ctx, { W, base: ground * 0.8, offset: scroll * 0.1, seed: 31, slot, minH: ground * 0.2, maxH: ground * 0.45, color: '#4a1f45', windows: 0.08, winColor: '#ffb27a' });
    skyline(ctx, { W, base: ground, offset: scroll * 0.35, seed: 37, slot: slot * 1.4, minH: ground * 0.12, maxH: ground * 0.3, color: '#1a0c1d', tanks: true, antennas: true });
  } else if (id === 'metro') {
    // pared de baldosas
    ctx.fillStyle = '#1b2024';
    ctx.fillRect(0, ground * 0.2, W, ground * 0.8);
    const tile = Math.max(14, unit * 0.06);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const off = (scroll * 0.4) % tile;
    for (let x = -off; x < W; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, ground * 0.2);
      ctx.lineTo(x, ground);
      ctx.stroke();
    }
    for (let y = ground * 0.2; y < ground; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // franja roja con letreros de la línea
    ctx.fillStyle = '#e3151a';
    ctx.fillRect(0, ground * 0.42, W, tile * 0.8);
    const sign = unit * 2;
    const first = Math.floor((scroll * 0.4) / sign) - 1;
    for (let i = first; i < first + W / sign + 3; i++) {
      const x = i * sign - scroll * 0.4;
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(x, ground * 0.27, unit * 0.55, unit * 0.12);
      bigText(ctx, i % 2 ? 'LÍNEA S' : "SHIFT'S", x + unit * 0.275, ground * 0.27 + unit * 0.06, unit * 0.065, { fill: '#0a0a0a', stroke: 'transparent' });
    }
    // techo con luces que pasan
    ctx.fillStyle = '#090b0d';
    ctx.fillRect(0, 0, W, ground * 0.2);
    const light = unit * 0.9;
    const lf = Math.floor((scroll * 0.8) / light) - 1;
    for (let i = lf; i < lf + W / light + 3; i++) {
      const x = i * light - scroll * 0.8;
      ctx.fillStyle = 'rgba(220,240,255,0.85)';
      ctx.fillRect(x, ground * 0.17, unit * 0.3, 4);
      const g = ctx.createLinearGradient(0, ground * 0.17, 0, ground * 0.6);
      g.addColorStop(0, 'rgba(220,240,255,0.12)');
      g.addColorStop(1, 'rgba(220,240,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - unit * 0.1, ground * 0.17, unit * 0.5, ground * 0.43);
    }
    // columnas
    const col = unit * 1.7;
    const cf = Math.floor((scroll * 0.7) / col) - 1;
    for (let i = cf; i < cf + W / col + 3; i++) {
      const x = i * col - scroll * 0.7;
      ctx.fillStyle = '#121518';
      ctx.fillRect(x, ground * 0.2, unit * 0.14, ground * 0.8);
      ctx.fillStyle = '#e3151a';
      ctx.fillRect(x, ground * 0.6, unit * 0.14, 4);
    }
  } else if (id === 'neon') {
    stars(ctx, W, ground * 0.4, 30, 9, t);
    skyline(ctx, { W, base: ground * 0.85, offset: scroll * 0.12, seed: 41, slot, minH: ground * 0.3, maxH: ground * 0.7, color: '#0c0b12', windows: 0.18, winColor: 'rgba(160,220,255,0.6)' });
    // letreros de neón que titilan
    const slotN = unit * 0.65;
    const first = Math.floor((scroll * 0.3) / slotN) - 1;
    const words = ["SHIFT'S", '24H', 'B&C', 'CREW', 'OPEN', 'DROP'];
    for (let i = first; i < first + W / slotN + 3; i++) {
      const x = i * slotN - scroll * 0.3;
      const y = ground * (0.3 + rnd(i * 3) * 0.3);
      const on = Math.sin(t * (3 + rnd(i) * 5) + i) > -0.85;
      const red = rnd(i * 7) < 0.6;
      ctx.save();
      ctx.shadowColor = red ? '#ff2a3a' : '#bfefff';
      ctx.shadowBlur = on ? 18 : 0;
      bigText(ctx, words[Math.floor(rnd(i * 11) * words.length)], x, y, unit * 0.09, {
        fill: on ? (red ? '#ff4b58' : '#e9fbff') : 'rgba(80,80,90,0.6)',
        stroke: 'transparent',
        align: 'left',
      });
      ctx.restore();
    }
    // reflejo mojado del piso
    const g = ctx.createLinearGradient(0, ground * 0.85, 0, ground);
    g.addColorStop(0, 'rgba(255,42,58,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, ground * 0.85, W, ground * 0.15);
  } else if (id === 'tormenta') {
    skyline(ctx, { W, base: ground * 0.85, offset: scroll * 0.12, seed: 51, slot, minH: ground * 0.25, maxH: ground * 0.55, color: '#0b0f17', windows: 0.12, winColor: 'rgba(255,230,160,0.5)' });
    brickBand(ctx, W, ground * 0.62, ground, scroll * 0.35, Math.max(12, unit * 0.045), 9);
    ctx.fillStyle = 'rgba(10,20,40,0.35)';
    ctx.fillRect(0, 0, W, ground);
    rain(ctx, W, H, t, 110);
    // rayos cada tanto
    const cycle = Math.floor(t / 5.5);
    const ph = t - cycle * 5.5;
    if (rnd(cycle) < 0.7 && ph < 0.22) {
      const x0 = W * (0.2 + rnd(cycle * 3) * 0.6);
      ctx.fillStyle = `rgba(220,230,255,${0.35 * (1 - ph / 0.22)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#f4f8ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      let x = x0;
      ctx.moveTo(x, 0);
      for (let y = 0; y < ground * 0.6; y += ground * 0.08) {
        x += (rnd(cycle + y) - 0.5) * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

const COLORS_RED = '#e3151a';

/**
 * Cartel de "nuevo escenario" que aparece y se va.
 * Devuelve true mientras se está mostrando.
 */
export function drawSceneBanner(ctx, W, H, name, age) {
  if (age > 2.2) return false;
  const k = age < 0.3 ? age / 0.3 : age > 1.8 ? 1 - (age - 1.8) / 0.4 : 1;
  const y = H * 0.24;
  ctx.save();
  ctx.globalAlpha = Math.max(0, k);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, y - 34, W, 68);
  ctx.fillStyle = COLORS_RED;
  ctx.fillRect(0, y - 34, W * k, 3);
  ctx.fillRect(W * (1 - k), y + 31, W * k, 3);
  bigText(ctx, 'NUEVO ESCENARIO', W / 2, y - 12, Math.min(14, W * 0.035), { fill: '#bdbdbd', stroke: 'transparent' });
  bigText(ctx, name.toUpperCase(), W / 2 + (1 - k) * 60, y + 11, Math.min(30, W * 0.065), { fill: '#f4f4f4' });
  ctx.restore();
  return true;
}
