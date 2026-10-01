import { swaggyImage } from '../art.js';
import { sound } from '../../../audio/sound-manager.js';
import { createKit, drawCan, drawBrickWall, bigText, createParticles, createPopups, createShake, COLORS } from './kit.js';

/**
 * Mini juego "Esquiva al guardia"
 * -------------------------------------------------------------
 * Mantén presionado (dedo, clic o espacio) para pintar el muro. Cuando el
 * guardia se voltea, ¡suelta! Si te ve pintando, pierdes una vida.
 *   - Antes de voltear hace "¿?" (a veces es amague y no se voltea).
 *   - +1 por cada 1 % pintado · muro terminado: +50 × nivel
 *   - Soltar justo antes de que te vea: ¡UFF! +15
 *   - 3 vidas. Cada muro el guardia es más rápido y más tramposo.
 * Devuelve { stop() }.
 */
const WORDS = ["SHIFT'S", 'SWAGGY', 'CREW', 'B&C', 'DROP 02', 'STYLE', 'LEY', 'PARCHE'];

export function startGuardGame(canvas, { onScore, onLives, onInfo, onEnd } = {}) {
  const kit = createKit(canvas);
  const { ctx, view } = kit;
  const sprites = { chill: swaggyImage('chill'), happy: swaggyImage('happy'), annoyed: swaggyImage('annoyed'), party: swaggyImage('party') };
  const particles = createParticles();
  const popups = createPopups();
  const shake = createShake();

  let level = 1;
  let lives = 3;
  let score = 0;
  let progress = 0; // 0..1 del muro actual
  let painted = 0; // % ya contado en puntos
  let spraying = false;
  let releasedAt = -1;
  let word = WORDS[0];
  let over = false;
  let celebrate = 0;
  let caughtT = 0;
  let mood = 'chill';
  let t = 0;

  // guardia: away → warn → look → away (o warn → away si es amague)
  const guard = { state: 'away', timer: 2.4, lookStart: 0, fake: false };
  const lvl = () => Math.min(level, 10);
  const nextAway = () => 1.1 + Math.random() * (3.2 - lvl() * 0.15);
  const warnTime = () => Math.max(0.28, 0.75 - lvl() * 0.05);
  const lookTime = () => 1.0 + Math.random() * 1.2;

  const setGuard = (state) => {
    guard.state = state;
    if (state === 'away') guard.timer = nextAway();
    if (state === 'warn') {
      guard.timer = warnTime();
      guard.fake = level >= 2 && Math.random() < Math.min(0.35, 0.1 + level * 0.04);
      sound.play('tick');
    }
    if (state === 'look') {
      guard.timer = lookTime();
      guard.lookStart = t;
      if (t - releasedAt < 0.3 && releasedAt > 0 && !spraying) {
        score += 15;
        onScore?.(score);
        popups.add('¡UFF! +15', view.W * 0.3, view.H * 0.3, { color: COLORS.gold, size: 24 });
        sound.play('success');
      }
    }
  };

  const down = () => {
    if (over) return;
    spraying = true;
  };
  const up = () => {
    if (spraying) releasedAt = t;
    spraying = false;
  };
  kit.on(canvas, 'pointerdown', (e) => {
    e.preventDefault();
    down();
  });
  kit.on(window, 'pointerup', up);
  kit.on(window, 'pointercancel', up);
  kit.on(window, 'keydown', (e) => {
    if (e.key === ' ' && !e.repeat) {
      e.preventDefault();
      down();
    }
  });
  kit.on(window, 'keyup', (e) => {
    if (e.key === ' ') up();
  });

  const caught = () => {
    lives -= 1;
    onLives?.(lives);
    caughtT = 1.1;
    spraying = false;
    progress = Math.max(0, progress - 0.1);
    shake.hit(14);
    sound.play('error');
    popups.add('¡EY, TÚ!', view.W * 0.78, view.H * 0.18, { color: COLORS.red, size: 30, life: 1.1 });
    guard.timer = Math.max(guard.timer, 1);
    if (lives <= 0) {
      over = true;
      setTimeout(() => {
        kit.stop();
        onEnd?.(score);
      }, 1200);
    }
  };

  const finishWall = () => {
    const bonus = 50 * level;
    score += bonus;
    onScore?.(score);
    popups.add(`¡MURO LISTO! +${bonus}`, view.W / 2, view.H * 0.22, { color: COLORS.gold, size: 26, life: 1.4 });
    sound.play('unlock');
    for (let i = 0; i < 5; i++) particles.burst(view.W * (0.2 + i * 0.15), view.H * 0.35, [COLORS.red, COLORS.white, COLORS.gold][i % 3], 14, 300, 5);
    celebrate = 1.4;
    level += 1;
    word = WORDS[(level - 1) % WORDS.length];
    progress = 0;
    painted = 0;
    spraying = false;
    setGuard('away');
    guard.timer += 1;
  };

  // ---------- Dibujo ----------
  const drawMural = (x, y, w, h) => {
    const size = Math.min(h * 0.85, (w / Math.max(4, word.length)) * 1.55);
    ctx.save();
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const cx = x + w / 2;
    const cy = y + h / 2;
    const tw = ctx.measureText(word).width;
    // boceto
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeText(word, cx, cy);
    ctx.setLineDash([]);
    // parte pintada (de izquierda a derecha)
    ctx.beginPath();
    ctx.rect(cx - tw / 2 - 10, y - 20, (tw + 20) * progress, h + 60);
    ctx.clip();
    const grad = ctx.createLinearGradient(cx - tw / 2, cy - size / 2, cx + tw / 2, cy + size / 2);
    grad.addColorStop(0, COLORS.red);
    grad.addColorStop(0.5, '#ff5a5f');
    grad.addColorStop(1, COLORS.white);
    ctx.lineWidth = Math.max(6, size * 0.14);
    ctx.strokeStyle = COLORS.ink;
    ctx.strokeText(word, cx, cy);
    ctx.fillStyle = grad;
    ctx.fillText(word, cx, cy);
    // chorreados
    ctx.fillStyle = COLORS.red;
    for (let i = 0; i < 8; i++) {
      const dx = cx - tw / 2 + (tw * (i + 0.5)) / 8;
      ctx.fillRect(dx, cy + size * 0.32, 4, size * (0.12 + ((i * 37) % 10) / 40));
    }
    ctx.restore();
    return { tipX: cx - tw / 2 + tw * progress, cy };
  };

  const drawGuard = (gx, gy, s) => {
    const looking = guard.state === 'look';
    const warn = guard.state === 'warn';
    // cono de linterna
    if (looking) {
      ctx.save();
      const grd = ctx.createLinearGradient(gx, gy, gx - view.W * 0.6, gy);
      grd.addColorStop(0, 'rgba(255,240,180,0.45)');
      grd.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(gx - s * 0.3, gy - s * 0.2);
      ctx.lineTo(gx - view.W * 0.75, gy - s * 1.6);
      ctx.lineTo(gx - view.W * 0.75, gy + s * 1.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(gx, gy);
    const turn = looking ? -1 : 1; // -1 = mira a Swaggy
    const shake2 = warn ? Math.sin(t * 40) * 2 : 0;
    ctx.translate(shake2, 0);
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.ink;
    // cuerpo
    ctx.fillStyle = '#1f2b44';
    ctx.beginPath();
    ctx.roundRect(-s * 0.32, -s * 0.2, s * 0.64, s * 0.95, s * 0.16);
    ctx.fill();
    ctx.stroke();
    // piernas
    ctx.fillStyle = '#151d2e';
    ctx.fillRect(-s * 0.26, s * 0.7, s * 0.2, s * 0.35);
    ctx.fillRect(s * 0.06, s * 0.7, s * 0.2, s * 0.35);
    // placa
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(turn * -0.12 * s, s * 0.05, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // cabeza
    ctx.fillStyle = '#c99a72';
    ctx.beginPath();
    ctx.arc(0, -s * 0.42, s * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // gorra
    ctx.fillStyle = '#1f2b44';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.55, s * 0.26, s * 0.12, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(turn * s * 0.05 - (turn < 0 ? s * 0.3 : 0), -s * 0.56, s * 0.3, s * 0.06);
    if (looking || warn) {
      // ojos (de frente o de reojo)
      ctx.fillStyle = COLORS.ink;
      const ex = looking ? -s * 0.08 : s * 0.02;
      ctx.beginPath();
      ctx.arc(ex - s * 0.06, -s * 0.42, s * 0.03, 0, Math.PI * 2);
      ctx.arc(ex + s * 0.06, -s * 0.42, s * 0.03, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // de espaldas: nuca
      ctx.fillStyle = '#3a2a20';
      ctx.beginPath();
      ctx.arc(0, -s * 0.36, s * 0.2, 0.1, Math.PI - 0.1);
      ctx.fill();
    }
    // linterna
    ctx.fillStyle = '#444';
    ctx.fillRect(turn * s * 0.3 - (turn < 0 ? s * 0.18 : 0), s * 0.05, s * 0.18, s * 0.08);
    ctx.restore();
    if (warn) bigText(ctx, '¿?', gx, gy - s * 0.95, s * 0.35, { fill: COLORS.gold });
    if (looking) bigText(ctx, '👀', gx - s * 0.05, gy - s * 0.95, s * 0.3, { stroke: 'transparent' });
  };

  kit.loop((dt) => {
    const { W, H } = view;
    t += dt;
    const u = Math.min(H, W * 1.1);

    if (!over) {
      // guardia
      guard.timer -= dt;
      if (guard.timer <= 0) {
        if (guard.state === 'away') setGuard('warn');
        else if (guard.state === 'warn') setGuard(guard.fake ? 'away' : 'look');
        else setGuard('away');
      }
      // ¿te vio?
      if (guard.state === 'look' && spraying && caughtT <= 0 && t - guard.lookStart > 0.1) caught();
      caughtT -= dt;
      // pintar
      if (spraying && caughtT <= 0 && celebrate <= 0) {
        progress = Math.min(1, progress + dt * Math.max(0.09, 0.16 - level * 0.006));
        const pct = Math.floor(progress * 100);
        if (pct > painted) {
          score += pct - painted;
          painted = pct;
          onScore?.(score);
        }
        if (Math.random() < 0.5) sound.play('tick');
        if (progress >= 1) finishWall();
      }
      onInfo?.(`Muro ${level} · ${Math.floor(progress * 100)}%`);
    }
    celebrate -= dt;
    mood = caughtT > 0 ? 'annoyed' : celebrate > 0 ? 'party' : spraying ? 'happy' : 'chill';

    particles.update(dt, 150);
    popups.update(dt);

    // ---------- Dibujo ----------
    ctx.save();
    shake.apply(ctx, dt);
    drawBrickWall(ctx, W, H, 0, Math.max(16, u * 0.055));
    // luz de la calle
    const lamp = ctx.createRadialGradient(W * 0.45, -20, 10, W * 0.45, -20, H);
    lamp.addColorStop(0, 'rgba(255,230,170,0.12)');
    lamp.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, W, H);
    // piso
    const floor = H * 0.86;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, floor, W, H - floor);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(0, floor, W, 2);

    // en pantalla vertical (celular) el muro usa todo el ancho, arriba
    const portrait = H > W * 1.15;
    const { tipX, cy } = portrait ? drawMural(W * 0.04, H * 0.1, W * 0.92, H * 0.28) : drawMural(W * 0.04, H * 0.12, W * 0.62, H * 0.42);

    // Swaggy pintando
    const sw = Math.min(130, u * 0.3);
    const sh = sw * 1.2;
    const sx = Math.min(Math.max(tipX - sw * 0.2, sw * 0.6), portrait ? W * 0.5 : W * 0.55);
    const img = sprites[mood];
    const bob = spraying ? Math.sin(t * 30) * 1.5 : Math.sin(t * 2) * 2;
    if (img.complete) ctx.drawImage(img, sx - sw / 2, floor - sh + bob, sw, sh);
    const canX = sx + sw * 0.38;
    const canY = floor - sh * 0.62;
    drawCan(ctx, canX, canY, sw * 0.12, COLORS.white, { rot: spraying ? -0.9 : -0.2 });
    if (spraying && caughtT <= 0) {
      for (let i = 0; i < 3; i++) particles.spray(canX, canY - sw * 0.1, Math.random() < 0.6 ? COLORS.red : COLORS.white, 1, 1);
      // nube de pintura hacia el muro
      ctx.fillStyle = 'rgba(227,21,26,0.18)';
      ctx.beginPath();
      ctx.ellipse(canX + sw * 0.25, Math.min(canY, cy) - 4, sw * 0.25, sw * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!spraying && guard.state === 'look' && caughtT <= 0) bigText(ctx, '♪ fiu fiu', sx, floor - sh - 14, Math.min(18, sw * 0.16), { fill: COLORS.white });

    // guardia a la derecha
    const gs = portrait ? Math.min(110, W * 0.28) : Math.min(150, u * 0.34);
    drawGuard(W * 0.86, floor - gs * 1.05, gs);

    particles.draw(ctx);
    popups.draw(ctx);
    if (!spraying && t < 4 && level === 1 && progress === 0) {
      bigText(ctx, 'MANTÉN PRESIONADO PARA PINTAR', W / 2, H * 0.07, Math.min(20, W * 0.045), { fill: COLORS.white });
    }
    ctx.restore();
  });

  onScore?.(0);
  onLives?.(lives);
  return { stop: () => kit.stop() };
}
