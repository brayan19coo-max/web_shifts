import { swaggyImage } from '../art.js';
import { sound } from '../../../audio/sound-manager.js';
import { createKit, drawCan, bigText, createParticles, createPopups, createShake, COLORS } from './kit.js';
import { drawScene, drawSceneBanner, SCENES } from './scenes.js';

const SCENE_ORDER = ['barrio', 'azoteas', 'metro', 'neon', 'tormenta'];
// estilo de los muros en cada escenario
const WALL_STYLE = {
  barrio: { body: '#2b2b2b', lines: 'rgba(255,255,255,0.08)', edge: '#e3151a' },
  azoteas: { body: '#3a1f33', lines: 'rgba(255,170,120,0.12)', edge: '#ff8a4d' },
  metro: { body: '#3a3f45', lines: 'rgba(255,255,255,0.12)', edge: '#f2c14e' },
  neon: { body: '#111018', lines: 'rgba(191,239,255,0.08)', edge: '#ff3b4b', glow: true },
  tormenta: { body: '#1c2230', lines: 'rgba(180,200,255,0.1)', edge: '#9fb4ff' },
};

/**
 * Mini juego "Swaggy Flap"
 * -------------------------------------------------------------
 * Swaggy vuela con una lata de spray de propulsor. Cada toque es un
 * impulso hacia arriba; hay que pasar entre los muros sin tocarlos.
 *   - +1 por cada muro que pasas · lata dorada en el hueco: +3
 *   - Un solo golpe y se acaba (como debe ser).
 *   - Cada 10 muros cambia el escenario (barrio → azoteas → metro → neón →
 *     tormenta), el hueco se cierra un poco y todo va más rápido.
 *   - Desde el metro, algunos muros suben y bajan.
 * Devuelve { stop() }.
 */
export function startFlapGame(canvas, { onScore, onInfo, onEnd } = {}) {
  const kit = createKit(canvas);
  const { ctx, view } = kit;
  const sprites = { up: swaggyImage('party'), down: swaggyImage('happy'), dead: swaggyImage('annoyed') };
  const particles = createParticles();
  const popups = createPopups();
  const shake = createShake();

  const u = () => Math.min(view.H, view.W * 1.3);
  const bird = { x: 0, y: 0, vy: 0, r: 0, flapT: 0 };
  const walls = [];
  let state = 'ready'; // ready → play → dead
  let score = 0;
  let passed = 0; // muros pasados (define el nivel)
  let prevScene = null;
  let sceneAge = 10;
  let t = 0;
  let scroll = 0;
  let spawnIn = 0;
  let deadT = 0;
  let readyT = 0;

  const reset = () => {
    bird.x = view.W * 0.28;
    bird.y = view.H * 0.45;
    bird.vy = 0;
  };
  reset();

  const level = () => Math.floor(passed / 10);
  const sceneId = () => SCENE_ORDER[level() % SCENE_ORDER.length];
  const gapSize = () => u() * Math.max(0.27, 0.36 - level() * 0.018);
  const speed = () => Math.min(view.W * 0.55, u() * 0.62) * (1 + Math.min(0.6, level() * 0.08));

  const flap = () => {
    if (state === 'dead') return;
    if (state === 'ready') {
      state = 'play';
      spawnIn = 0.6;
    }
    bird.vy = -u() * 1.05;
    bird.flapT = 0.18;
    sound.play('whoosh');
    for (let i = 0; i < 3; i++) particles.spray(bird.x - bird.r * 0.6, bird.y + bird.r * 0.6, Math.random() < 0.5 ? COLORS.red : COLORS.white, -1, 2);
  };
  kit.on(canvas, 'pointerdown', (e) => {
    e.preventDefault();
    flap();
  });
  kit.on(window, 'keydown', (e) => {
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && !e.repeat) {
      e.preventDefault();
      flap();
    }
  });

  const spawnWall = () => {
    const gap = gapSize();
    const margin = view.H * 0.12;
    const gy = margin + gap / 2 + Math.random() * (view.H * 0.88 - margin * 1.2 - gap);
    const w = Math.max(48, u() * 0.15);
    const gold = Math.random() < 0.3;
    // desde el metro (nivel 3) algunos muros se mueven
    const moving = level() >= 2 && Math.random() < Math.min(0.6, 0.25 + level() * 0.08);
    const amp = moving ? Math.min(gap * 0.45, gy - margin - gap / 2, view.H * 0.88 - margin * 0.2 - gap / 2 - gy) : 0;
    walls.push({ x: view.W + w, w, gy, baseGy: gy, amp: Math.max(0, amp), phase: Math.random() * 6, gap, passed: false, gold, goldTaken: false, tag: Math.random() < 0.5 });
  };

  const die = () => {
    if (state === 'dead') return;
    state = 'dead';
    deadT = 0;
    bird.vy = -u() * 0.6;
    shake.hit(14);
    sound.play('error');
    particles.burst(bird.x, bird.y, COLORS.red, 22, 260, 5);
  };

  const drawWall = (wl) => {
    const { x, w, gy, gap } = wl;
    const top = gy - gap / 2;
    const bot = gy + gap / 2;
    ctx.fillStyle = '#2a2a2a';
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    // columnas de ladrillo
    const st = WALL_STYLE[sceneId()];
    [[0, top], [bot, view.H - bot]].forEach(([y, h]) => {
      ctx.fillStyle = st.body;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = st.lines;
      ctx.lineWidth = 1;
      for (let yy = y; yy < y + h; yy += 14) {
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + w, yy);
        ctx.stroke();
      }
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    });
    // bordes con pintura escurrida
    ctx.save();
    if (st.glow) {
      ctx.shadowColor = st.edge;
      ctx.shadowBlur = 16;
    }
    ctx.fillStyle = st.edge;
    ctx.fillRect(x - 4, top - 14, w + 8, 14);
    ctx.fillRect(x - 4, bot, w + 8, 14);
    for (let i = 0; i < 3; i++) {
      const dx = x + w * (0.2 + i * 0.3);
      ctx.fillRect(dx, bot + 14, 4, 8 + ((i * 7) % 12));
    }
    ctx.restore();
    ctx.strokeRect(x - 4, top - 14, w + 8, 14);
    ctx.strokeRect(x - 4, bot, w + 8, 14);
    if (wl.amp) {
      // flechas que avisan que este muro se mueve
      bigText(ctx, '↕', x + w / 2, top - 30, 18, { fill: st.edge, stroke: 'transparent' });
    }
    if (wl.tag) {
      ctx.save();
      ctx.translate(x + w / 2, bot + (view.H - bot) / 2);
      ctx.rotate(-Math.PI / 2);
      bigText(ctx, "SHIFT'S", 0, 0, Math.min(w * 0.55, 26), { fill: 'rgba(244,244,244,0.25)', stroke: 'transparent' });
      ctx.restore();
    }
    if (wl.gold && !wl.goldTaken) drawCan(ctx, x + w / 2, gy, u() * 0.04, COLORS.gold, { band: COLORS.ink, glow: true, rot: Math.sin(scroll * 0.02) * 0.3 });
  };

  const drawBird = (now) => {
    const img = state === 'dead' ? sprites.dead : bird.flapT > 0 ? sprites.up : sprites.down;
    if (!img.complete) return;
    const w = bird.r * 2.4;
    const h = w * 1.2;
    const rot = state === 'ready' ? Math.sin(now / 300) * 0.08 : Math.max(-0.45, Math.min(1.1, bird.vy / (u() * 1.6)));
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(rot);
    // lata propulsora en la espalda
    drawCan(ctx, -w * 0.3, h * 0.12, w * 0.18, COLORS.white, { rot: 0.5 });
    if (bird.flapT > 0 || state === 'ready') {
      ctx.fillStyle = 'rgba(227,21,26,0.85)';
      ctx.beginPath();
      ctx.ellipse(-w * 0.42, h * 0.32, w * 0.06, w * (0.1 + Math.random() * 0.08), 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  kit.loop((dt, now) => {
    t += dt;
    sceneAge += dt;
    const { W, H } = view;
    bird.r = Math.max(18, u() * 0.07);
    bird.x = W * 0.28;
    const v = speed();

    if (state === 'ready') {
      readyT += dt;
      bird.y = H * 0.45 + Math.sin(readyT * 3) * 10;
    } else {
      bird.vy += u() * 3.1 * dt;
      bird.y += bird.vy * dt;
      bird.flapT = Math.max(0, bird.flapT - dt);
    }

    if (state === 'play') {
      scroll += v * dt;
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnWall();
        spawnIn = Math.max(1.0, (u() * 0.85) / v);
      }
      if (bird.y - bird.r < 0) {
        bird.y = bird.r;
        bird.vy = 0;
      }
      if (bird.y + bird.r > H * 0.92) die();
      for (let i = walls.length - 1; i >= 0; i--) {
        const wl = walls[i];
        wl.x -= v * dt;
        if (wl.amp) wl.gy = wl.baseGy + Math.sin(t * 1.6 + wl.phase) * wl.amp;
        if (wl.x + wl.w < -20) walls.splice(i, 1);
        const inX = bird.x + bird.r * 0.75 > wl.x - 4 && bird.x - bird.r * 0.75 < wl.x + wl.w + 4;
        if (inX && (bird.y - bird.r * 0.75 < wl.gy - wl.gap / 2 || bird.y + bird.r * 0.75 > wl.gy + wl.gap / 2)) die();
        if (wl.gold && !wl.goldTaken && Math.abs(bird.x - (wl.x + wl.w / 2)) < bird.r && Math.abs(bird.y - wl.gy) < bird.r * 1.3) {
          wl.goldTaken = true;
          score += 3;
          onScore?.(score);
          sound.play('success');
          popups.add('+3', wl.x + wl.w / 2, wl.gy - 20, { color: COLORS.gold });
          particles.burst(wl.x + wl.w / 2, wl.gy, COLORS.gold, 12, 180, 4);
        }
        if (!wl.passed && wl.x + wl.w < bird.x) {
          wl.passed = true;
          score += 1;
          passed += 1;
          onScore?.(score);
          sound.play('tick');
          if (passed % 10 === 0) {
            prevScene = SCENE_ORDER[(level() - 1) % SCENE_ORDER.length];
            sceneAge = 0;
            sound.play('unlock');
          }
        }
      }
      onInfo?.(`Nivel ${level() + 1} · ${SCENES[sceneId()].name}`);
    }

    if (state === 'dead') {
      deadT += dt;
      if (bird.y > H + 80 || deadT > 1.4) {
        kit.stop();
        onEnd?.(score);
        return;
      }
    }

    particles.update(dt, 300);
    popups.update(dt);

    // ---------- Dibujo ----------
    ctx.save();
    shake.apply(ctx, dt);
    const sceneOpts = { W, H, ground: H * 0.92, scroll, t, unit: u() };
    if (prevScene && sceneAge < 1.2) {
      drawScene(ctx, prevScene, sceneOpts);
      ctx.save();
      ctx.globalAlpha = sceneAge / 1.2;
      drawScene(ctx, sceneId(), sceneOpts);
      ctx.restore();
    } else drawScene(ctx, sceneId(), sceneOpts);
    walls.forEach(drawWall);
    // piso
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(0, H * 0.92, W, H * 0.08);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(0, H * 0.92, W, 3);
    particles.draw(ctx);
    drawBird(now);
    popups.draw(ctx);
    if (prevScene) drawSceneBanner(ctx, W, H, SCENES[sceneId()].name, sceneAge);
    if (state === 'play' || state === 'dead') bigText(ctx, String(score), W / 2, H * 0.12, Math.min(64, u() * 0.13));
    if (state === 'ready') {
      bigText(ctx, '¡TOCA PARA VOLAR!', W / 2, H * 0.22, Math.min(36, W * 0.07), { fill: COLORS.white });
      bigText(ctx, 'un toque = un impulso', W / 2, H * 0.22 + Math.min(36, W * 0.07), Math.min(16, W * 0.04), { fill: COLORS.gray, stroke: 'transparent' });
    }
    ctx.restore();
  });

  onScore?.(0);
  onInfo?.(`Nivel 1 · ${SCENES.barrio.name}`);
  return { stop: () => kit.stop() };
}
