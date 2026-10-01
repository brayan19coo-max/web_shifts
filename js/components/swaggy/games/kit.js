/**
 * Kit para los mini juegos de canvas
 * -------------------------------------------------------------
 * - Lienzo nítido en pantallas retina y que se adapta al tamaño.
 * - Bucle de animación con dt (segundos) que se pausa si la pestaña
 *   se oculta.
 * - Registro de eventos para limpiarlos todos al salir.
 * - Dibujos compartidos: lata de spray, texto con contorno, partículas.
 */
export function createKit(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { W: 0, H: 0 };
  const listeners = [];
  let raf = 0;
  let running = false;
  let paused = false;
  let last = 0;
  let tick = null;

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    view.W = rect.width;
    view.H = rect.height;
    canvas.width = Math.round(view.W * dpr);
    canvas.height = Math.round(view.H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    listeners.push(() => target.removeEventListener(type, fn, opts));
  };

  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick?.(dt, now);
    if (running) raf = requestAnimationFrame(frame);
  };

  on(window, 'resize', resize);
  on(document, 'visibilitychange', () => {
    if (document.hidden && running) {
      paused = true;
      running = false;
      cancelAnimationFrame(raf);
    } else if (!document.hidden && paused) {
      paused = false;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });

  return {
    ctx,
    view,
    on,
    /** Arranca el bucle: fn(dt, now) se llama en cada cuadro. */
    loop(fn) {
      tick = fn;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      paused = false;
      cancelAnimationFrame(raf);
      listeners.splice(0).forEach((off) => off());
    },
    /** Posición del puntero dentro del lienzo. */
    point(event) {
      const r = canvas.getBoundingClientRect();
      return { x: event.clientX - r.left, y: event.clientY - r.top };
    },
  };
}

export const COLORS = {
  ink: '#0a0a0a',
  white: '#f4f4f4',
  red: '#e3151a',
  gold: '#f2c14e',
  gray: '#8a8a8a',
  denim: '#2f4a7a',
};

/** Lata de spray centrada en (x, y). */
export function drawCan(ctx, x, y, w, color = COLORS.white, { band = COLORS.red, rot = 0, glow = false, outline = COLORS.ink } = {}) {
  const h = w * 1.9;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = w * 0.6;
  }
  ctx.fillStyle = color;
  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(1.5, w * 0.08);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2 + h * 0.18, w, h * 0.82, w * 0.25);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = band;
  ctx.fillRect(-w / 2 + ctx.lineWidth, -h / 2 + h * 0.45, w - ctx.lineWidth * 2, h * 0.14);
  ctx.fillStyle = COLORS.gray;
  ctx.beginPath();
  ctx.roundRect(-w * 0.35, -h / 2 + h * 0.04, w * 0.7, h * 0.16, 3);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(-w * 0.1, -h / 2 - h * 0.02, w * 0.2, h * 0.08);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(-w * 0.32, -h / 2 + h * 0.24, w * 0.1, h * 0.5);
  ctx.restore();
}

/** Texto grande con contorno (estilo graffiti). */
export function bigText(ctx, text, x, y, size, { fill = COLORS.white, stroke = COLORS.ink, align = 'center', font = '"Arial Black", Arial, sans-serif', alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `900 ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.16);
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Sistema simple de partículas (salpicaduras de pintura, chispas). */
export function createParticles() {
  const list = [];
  return {
    burst(x, y, color, n = 14, speed = 220, size = 5) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.35 + Math.random() * 0.8);
        list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.25, life: 0.5 + Math.random() * 0.5, t: 0, color, r: size * (0.5 + Math.random()) });
      }
    },
    spray(x, y, color, dirX = 1, n = 3) {
      for (let i = 0; i < n; i++) {
        list.push({ x, y, vx: dirX * (120 + Math.random() * 160), vy: (Math.random() - 0.5) * 120, life: 0.35 + Math.random() * 0.25, t: 0, color, r: 2 + Math.random() * 4 });
      }
    },
    update(dt, gravity = 500) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.t += dt;
        if (p.t > p.life) {
          list.splice(i, 1);
          continue;
        }
        p.vy += gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    },
    draw(ctx) {
      list.forEach((p) => {
        ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
  };
}

/** Textos flotantes ("+10", "¡PERFECTO!"). */
export function createPopups() {
  const list = [];
  return {
    add(text, x, y, { color = COLORS.white, size = 22, life = 0.9 } = {}) {
      list.push({ text, x, y, color, size, life, t: 0 });
    },
    update(dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        list[i].t += dt;
        if (list[i].t > list[i].life) list.splice(i, 1);
      }
    },
    draw(ctx) {
      list.forEach((p) => {
        const k = p.t / p.life;
        const scale = k < 0.15 ? 0.6 + (k / 0.15) * 0.5 : 1.1 - Math.min(0.1, k * 0.2);
        bigText(ctx, p.text, p.x, p.y - k * 40, p.size * scale, { fill: p.color, alpha: 1 - Math.max(0, (k - 0.6) / 0.4) });
      });
    },
  };
}

/** Sacudida de cámara. */
export function createShake() {
  let amount = 0;
  return {
    hit(a = 8) {
      amount = Math.max(amount, a);
    },
    apply(ctx, dt) {
      if (amount <= 0.1) return;
      ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
      amount *= Math.pow(0.0005, dt);
    },
  };
}

/** Fondo de muro de ladrillo con tags de graffiti. */
export function drawBrickWall(ctx, W, H, offset = 0, unit = 24) {
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, 0, W, H);
  const bh = unit;
  const bw = bh * 2.4;
  ctx.strokeStyle = 'rgba(255,255,255,0.055)';
  ctx.lineWidth = 1;
  const off = ((offset % (bw * 2)) + bw * 2) % (bw * 2);
  for (let row = 0, y = H; y > -bh; row++, y -= bh) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    const shift = row % 2 ? bw / 2 : 0;
    for (let x = -off + shift; x < W + bw; x += bw) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - bh);
      ctx.stroke();
    }
  }
}
