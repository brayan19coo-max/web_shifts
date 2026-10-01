import { swaggyImage } from '../art.js';
import { sound } from '../../../audio/sound-manager.js';
import { createKit, bigText, createParticles, createPopups, createShake, COLORS } from './kit.js';

/**
 * Mini juego "Stack Drop"
 * -------------------------------------------------------------
 * Una prenda doblada va de lado a lado; toca para soltarla sobre la pila.
 * Lo que sobresale se corta y se cae, así que la pila se va angostando.
 *   - +1 por prenda apilada
 *   - Caída PERFECTA (casi exacta): +2 extra y combo; con 3 perfectas
 *     seguidas la prenda vuelve a crecer un poco.
 *   - Si la sueltas por fuera de la pila, se acaba.
 *   - Cada vez se mueve más rápido.
 * Devuelve { stop() }.
 */
const STYLES = [
  { kind: 'tee', fill: '#f4f4f4', ink: '#0a0a0a', print: '#e3151a' },
  { kind: 'hoodie', fill: '#1b1b1b', ink: '#f4f4f4', print: '#f4f4f4' },
  { kind: 'jean', fill: '#2f4a7a', ink: '#1a2b48', print: '#c9d6ee' },
  { kind: 'tee', fill: '#e3151a', ink: '#0a0a0a', print: '#f4f4f4' },
  { kind: 'hoodie', fill: '#8a8a8a', ink: '#0a0a0a', print: '#0a0a0a' },
  { kind: 'tee', fill: '#0a0a0a', ink: '#f4f4f4', print: '#e3151a' },
];
const GOLD = { kind: 'hoodie', fill: '#f2c14e', ink: '#0a0a0a', print: '#0a0a0a' };

export function startStackGame(canvas, { onScore, onInfo, onEnd } = {}) {
  const kit = createKit(canvas);
  const { ctx, view } = kit;
  const sprites = { happy: swaggyImage('happy'), party: swaggyImage('party'), annoyed: swaggyImage('annoyed') };
  const particles = createParticles();
  const popups = createPopups();
  const shake = createShake();

  const bh = () => Math.max(22, Math.min(38, view.H * 0.07));
  const stack = []; // { x, w, style } (x = borde izquierdo)
  const debris = [];
  let current = null;
  let dir = 1;
  let score = 0;
  let combo = 0;
  let cam = 0;
  let state = 'play';
  let mood = 'happy';
  let moodT = 0;
  let dropping = null;
  let endT = 0;

  const baseW = () => Math.min(view.W * 0.5, 260);
  stack.push({ x: view.W / 2 - baseW() / 2, w: baseW(), style: null });

  const styleFor = (n) => (n % 10 === 0 ? GOLD : STYLES[n % STYLES.length]);
  const speed = () => Math.min(view.W * 1.1, view.W * 0.32 + stack.length * view.W * 0.018);

  const spawn = () => {
    const top = stack[stack.length - 1];
    dir = Math.random() < 0.5 ? 1 : -1;
    current = { x: dir === 1 ? 0 : view.W - top.w, w: top.w, style: styleFor(stack.length) };
  };
  spawn();

  // y (en pantalla) de la prenda número i, contando desde la base
  const yOf = (i) => view.H * 0.86 - (i + 1) * bh() + cam;

  const drop = () => {
    if (state !== 'play' || dropping) return;
    dropping = { ...current, t: 0 };
    current = null;
  };

  const land = (block) => {
    const top = stack[stack.length - 1];
    const left = Math.max(block.x, top.x);
    const right = Math.min(block.x + block.w, top.x + top.w);
    const overlap = right - left;
    const y = yOf(stack.length);

    if (overlap <= 0) {
      debris.push({ ...block, y, vy: 0, vx: (block.x < top.x ? -1 : 1) * 60, rot: 0, vr: (block.x < top.x ? -1 : 1) * 3 });
      state = 'over';
      mood = 'annoyed';
      shake.hit(12);
      sound.play('error');
      return;
    }

    const diff = Math.abs(block.x - top.x);
    let placed;
    if (diff <= Math.max(4, view.W * 0.008)) {
      // ¡perfecta!
      combo += 1;
      let w = top.w;
      if (combo >= 3) w = Math.min(baseW(), w + baseW() * 0.06);
      placed = { x: top.x - (w - top.w) / 2, w, style: block.style };
      score += 3;
      popups.add(combo >= 3 ? `¡PERFECTO x${combo}!` : '¡PERFECTO!', view.W / 2, y - 20, { color: COLORS.gold, size: 24 });
      sound.play('note', { index: Math.min(7, combo) });
      particles.burst(top.x + top.w / 2, y + bh() / 2, COLORS.gold, 16, 240, 4);
      mood = 'party';
    } else {
      combo = 0;
      placed = { x: left, w: overlap, style: block.style };
      // pedazo que sobra y se cae
      const cutLeft = block.x < top.x;
      const cut = cutLeft ? { x: block.x, w: left - block.x } : { x: right, w: block.x + block.w - right };
      debris.push({ ...cut, style: block.style, y, vy: 0, vx: (cutLeft ? -1 : 1) * 80, rot: 0, vr: (cutLeft ? -1 : 1) * (2 + Math.random() * 2) });
      score += 1;
      sound.play('add');
      mood = 'happy';
    }
    moodT = 0.6;
    stack.push(placed);
    onScore?.(score);
    onInfo?.(`${stack.length - 1} prendas${combo > 1 ? ` · Combo x${combo}` : ''}`);
    if ((stack.length - 1) % 10 === 0) {
      popups.add(`¡${stack.length - 1} PRENDAS!`, view.W / 2, view.H * 0.25, { color: COLORS.red, size: 30, life: 1.3 });
      sound.play('unlock');
    }
    spawn();
  };

  kit.on(canvas, 'pointerdown', (e) => {
    e.preventDefault();
    drop();
  });
  kit.on(window, 'keydown', (e) => {
    if ((e.key === ' ' || e.key === 'ArrowDown' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      drop();
    }
  });

  // ---------- Dibujo de una prenda doblada ----------
  const drawGarment = (x, y, w, h, style) => {
    if (!style) {
      // base: caja de la marca
      ctx.fillStyle = '#2a2a2a';
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 3;
      ctx.fillRect(x, y, w, h * 1.6);
      ctx.strokeRect(x, y, w, h * 1.6);
      bigText(ctx, "SHIFT'S", x + w / 2, y + h * 0.8, Math.min(h * 0.75, w * 0.14), { fill: COLORS.white });
      return;
    }
    ctx.save();
    ctx.lineWidth = 2.5;
    // las prendas oscuras llevan borde claro para que se vean sobre el fondo
    ctx.strokeStyle = style.fill === '#1b1b1b' || style.fill === '#0a0a0a' ? 'rgba(244,244,244,0.85)' : COLORS.ink;
    ctx.fillStyle = style.fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(8, h * 0.25));
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    // pliegue
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(x, y + h * 0.72, w, h * 0.28);
    if (style.kind === 'tee') {
      // cuello y estampado
      ctx.strokeStyle = style.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w / 2, y, h * 0.34, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = style.print;
      ctx.font = `900 ${h * 0.42}px "Arial Black", Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (w > h * 1.6) ctx.fillText('S', x + w / 2, y + h * 0.52);
    } else if (style.kind === 'hoodie') {
      // capucha y cordones
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h * 0.1, Math.min(w * 0.3, h * 0.9), h * 0.42, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = style.print;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - h * 0.25, y + h * 0.35);
      ctx.lineTo(x + w / 2 - h * 0.25, y + h * 0.8);
      ctx.moveTo(x + w / 2 + h * 0.25, y + h * 0.35);
      ctx.lineTo(x + w / 2 + h * 0.25, y + h * 0.8);
      ctx.stroke();
    } else {
      // jean: costuras y bolsillo
      ctx.strokeStyle = style.print;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + h * 0.22);
      ctx.lineTo(x + w - 4, y + h * 0.22);
      ctx.stroke();
      ctx.strokeRect(x + w * 0.62, y + h * 0.35, Math.min(w * 0.22, h), h * 0.45);
      ctx.setLineDash([]);
    }
    ctx.restore();
  };

  kit.loop((dt, now) => {
    const { W, H } = view;
    const h = bh();

    if (current && state === 'play') {
      current.x += dir * speed() * dt;
      if (current.x + current.w > W) dir = -1;
      if (current.x < 0) dir = 1;
    }
    if (dropping) {
      dropping.t += dt;
      if (dropping.t >= 0.09) {
        const d = dropping;
        dropping = null;
        land(d);
      }
    }
    // cámara: sube con la pila
    const targetCam = Math.max(0, stack.length * h - H * 0.5);
    cam += (targetCam - cam) * Math.min(1, dt * 6);

    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.vy += 1400 * dt;
      d.y += d.vy * dt;
      d.x += d.vx * dt;
      d.rot += d.vr * dt;
      if (d.y > H + 200) debris.splice(i, 1);
    }
    particles.update(dt, 500);
    popups.update(dt);
    moodT -= dt;
    if (moodT <= 0 && state === 'play') mood = 'happy';

    if (state === 'over') {
      endT += dt;
      if (endT > 1.2) {
        kit.stop();
        onEnd?.(score);
        return;
      }
    }

    // ---------- Dibujo ----------
    ctx.save();
    shake.apply(ctx, dt);
    // cielo de noche que se va aclarando con la altura
    const k = Math.min(1, stack.length / 40);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgb(${12 + k * 40}, ${12 + k * 8}, ${14 + k * 12})`);
    g.addColorStop(1, '#0b0b0b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // marcas de altura
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = `700 12px Arial`;
    ctx.textAlign = 'left';
    for (let i = 10; i < stack.length + 20; i += 10) {
      const y = yOf(i) + h;
      if (y < -10 || y > H) continue;
      ctx.fillRect(0, y, W, 1);
      ctx.fillText(`${i}`, 8, y - 4);
    }
    // piso
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, H * 0.86 + cam, W, H);
    // pila
    stack.forEach((b, i) => {
      const y = yOf(i);
      if (y > H + 50 || y < -h * 2) return;
      drawGarment(b.x, y, b.w, h, b.style);
    });
    // la que se mueve (flota encima de donde va a caer)
    const landY = yOf(stack.length);
    if (current) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(current.x, landY - h * 0.9);
      ctx.lineTo(current.x, landY + h);
      ctx.moveTo(current.x + current.w, landY - h * 0.9);
      ctx.lineTo(current.x + current.w, landY + h);
      ctx.stroke();
      ctx.setLineDash([]);
      drawGarment(current.x, landY - h * 1.6, current.w, h, current.style);
    }
    if (dropping) drawGarment(dropping.x, landY - h * 1.6 * (1 - dropping.t / 0.09), dropping.w, h, dropping.style);
    debris.forEach((d) => {
      ctx.save();
      ctx.translate(d.x + d.w / 2, d.y + h / 2);
      ctx.rotate(d.rot);
      drawGarment(-d.w / 2, -h / 2, d.w, h, d.style);
      ctx.restore();
    });
    // Swaggy animando desde abajo
    const img = sprites[mood];
    if (img.complete) {
      const sw = Math.min(110, H * 0.22, W * 0.24);
      const hop = mood === 'party' ? Math.abs(Math.sin(now / 110)) * 12 : Math.sin(now / 400) * 2;
      const sy = H * 0.86 + cam - sw * 1.2 - hop;
      if (sy < H) ctx.drawImage(img, 6, sy, sw, sw * 1.2);
    }
    particles.draw(ctx);
    popups.draw(ctx);
    bigText(ctx, String(score), W / 2, H * 0.1, Math.min(56, H * 0.1));
    ctx.restore();
  });

  onScore?.(0);
  onInfo?.('0 prendas');
  return { stop: () => kit.stop() };
}
