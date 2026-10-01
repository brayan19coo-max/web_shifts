import { swaggyImage } from '../art.js';
import { sound } from '../../../audio/sound-manager.js';
import { createKit, drawCan, drawBrickWall, bigText, createParticles, createPopups, createShake, COLORS } from './kit.js';
import { drawScene, drawSceneBanner } from './scenes.js';

// escenario cada 2 muros
const SCENE_ORDER = ['barrio', 'puente', 'metro', 'azoteas', 'neon', 'tormenta'];
const SCENE_NAMES = { barrio: 'El callejón', puente: 'Debajo del puente', metro: 'Estación del metro', azoteas: 'La azotea', neon: 'Avenida neón', tormenta: 'Noche de tormenta' };
const DOG_FROM = 3; // nivel desde el que aparece el perro
const CAM_FROM = 5; // nivel desde el que aparece la cámara

/**
 * Mini juego "Esquiva al guardia"
 * -------------------------------------------------------------
 * Mantén presionado (dedo, clic o espacio) para pintar el muro. Cuando el
 * guardia se voltea, ¡suelta! Si te ve pintando, pierdes una vida.
 *   - Antes de voltear hace "¿?" (a veces es amague y no se voltea).
 *   - +1 por cada 1 % pintado · muro terminado: +50 × nivel
 *   - Soltar justo antes de que te vea: ¡UFF! +15
 *   - 3 vidas. Cada muro el guardia es más rápido y más tramposo.
 *   - Cada 2 muros cambia el escenario (callejón → puente → metro →
 *     azotea → neón → tormenta).
 *   - Desde el muro 3: un PERRO dormido. Si pintas mucho rato seguido hace
 *     ruido, se despierta, ladra ¡y el guardia voltea de una!
 *   - Desde el muro 5: una CÁMARA de seguridad que barre el muro; si te
 *     enfoca mientras pintas, te pillan.
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
  let sceneAge = 10;
  let prevScene = null;
  let noise = 0; // ruido acumulado (despierta al perro)
  let barkT = 0;
  let camAngle = 0;
  let camOnYou = false;
  let warnT = 10; // cartel de enemigo nuevo
  let warnText = '';
  const sceneId = () => SCENE_ORDER[Math.floor((level - 1) / 2) % SCENE_ORDER.length];
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

  const caught = (who = '¡EY, TÚ!') => {
    lives -= 1;
    onLives?.(lives);
    caughtT = 1.1;
    spraying = false;
    progress = Math.max(0, progress - 0.1);
    shake.hit(14);
    sound.play('error');
    popups.add(who, view.W * 0.7, view.H * 0.18, { color: COLORS.red, size: 30, life: 1.1 });
    noise = 0;
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
    const oldScene = sceneId();
    level += 1;
    word = WORDS[(level - 1) % WORDS.length];
    if (sceneId() !== oldScene) {
      prevScene = oldScene;
      sceneAge = 0;
    }
    if (level === DOG_FROM) {
      warnText = '¡OJO! Hay un perro dormido: no hagas mucho ruido';
      warnT = 0;
    }
    if (level === CAM_FROM) {
      warnText = '¡OJO! Cámara de seguridad: que no te enfoque';
      warnT = 0;
    }
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

  // Perro guardián: duerme; con ruido abre los ojos; al ladrar se para
  const drawDog = (x, floor, s) => {
    const awake = barkT > 0;
    const alert = noise > 0.65;
    const y = floor - s * 0.42;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = COLORS.ink;
    ctx.fillStyle = '#b07a45';
    // cuerpo
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * (awake ? 0.12 : 0.24), s * 0.42, s * (awake ? 0.24 : 0.17), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // cabeza
    const hx = s * 0.95;
    const hy = awake ? -s * 0.12 : s * 0.2;
    ctx.beginPath();
    ctx.ellipse(hx, hy, s * 0.2, s * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // oreja
    ctx.fillStyle = '#7a4f2a';
    ctx.beginPath();
    ctx.ellipse(hx - s * 0.08, hy - s * (alert || awake ? 0.17 : 0.08), s * 0.06, s * (alert || awake ? 0.11 : 0.07), alert || awake ? -0.3 : 0.6, 0, Math.PI * 2);
    ctx.fill();
    // hocico y ojo
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(hx + s * 0.18, hy + s * 0.02, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
    if (alert || awake) {
      ctx.beginPath();
      ctx.arc(hx + s * 0.04, hy - s * 0.05, s * 0.03, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(hx, hy - s * 0.05, s * 0.07, 2);
    }
    // collar rojo
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(hx - s * 0.16, hy + s * 0.08, s * 0.1, s * 0.06);
    ctx.restore();
    if (!awake && !alert) bigText(ctx, 'z', x + hx + s * 0.1, y - s * 0.05 - (t * 12) % 14, s * 0.18, { fill: '#cfd8ff', stroke: 'transparent' });
    if (alert && !awake) bigText(ctx, '!', x + hx, y - s * 0.3, s * 0.3, { fill: COLORS.gold });
    // medidor de ruido
    const bw = s * 0.9;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + s * 0.3, y - s * 0.5, bw, 6);
    ctx.fillStyle = noise > 0.65 ? COLORS.red : COLORS.white;
    ctx.fillRect(x + s * 0.3, y - s * 0.5, bw * Math.min(1, noise), 6);
    bigText(ctx, 'RUIDO', x + s * 0.3 + bw / 2, y - s * 0.62, 10, { fill: '#cfcfcf', stroke: 'transparent' });
  };

  // Cámara de seguridad: devuelve true si está enfocando a Swaggy
  const drawCamera = (cx, cy, s, targetX, targetY) => {
    const dir = Math.PI / 2 + camAngle; // hacia abajo, barriendo
    const reach = view.H * 0.95;
    const spread = 0.17;
    const ang = Math.atan2(targetY - cy, targetX - cx);
    const onYou = Math.abs(ang - dir) < spread;
    ctx.save();
    ctx.fillStyle = onYou ? 'rgba(227,21,26,0.28)' : 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(dir - spread) * reach, cy + Math.sin(dir - spread) * reach);
    ctx.lineTo(cx + Math.cos(dir + spread) * reach, cy + Math.sin(dir + spread) * reach);
    ctx.closePath();
    ctx.fill();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#d9d9d9';
    ctx.fillRect(-s * 0.1, -s * 0.6, s * 0.2, s * 0.6);
    ctx.rotate(dir);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-s * 0.2, -s * 0.28, s * 0.9, s * 0.56, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(s * 0.62, -s * 0.18, s * 0.16, s * 0.36);
    ctx.fillStyle = Math.sin(t * 8) > 0 ? COLORS.red : '#5a0a0c';
    ctx.beginPath();
    ctx.arc(0, -s * 0.12, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return onYou;
  };

  kit.loop((dt) => {
    const { W, H } = view;
    t += dt;
    sceneAge += dt;
    warnT += dt;
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
      // perro: el ruido sube mientras pintas y baja cuando paras
      if (level >= DOG_FROM) {
        noise = Math.max(0, noise + (spraying && caughtT <= 0 ? 0.42 + level * 0.02 : -0.55) * dt);
        if (noise >= 1 && barkT <= 0) {
          barkT = 1.2;
          noise = 0.4;
          sound.play('error');
          popups.add('¡GUAU GUAU!', view.W * 0.6, view.H * 0.55, { color: COLORS.gold, size: 26, life: 1 });
          // el ladrido hace voltear al guardia de una
          setGuard('look');
        }
        barkT -= dt;
      }
      // cámara: barre de lado a lado
      if (level >= CAM_FROM) {
        const camSpeed = 0.7 + (level - CAM_FROM) * 0.08;
        camAngle = Math.sin(t * camSpeed) * 0.9;
        if (camOnYou && spraying && caughtT <= 0) caught('¡CÁMARA! 📸');
      }
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
    const floor = H * 0.86;
    const sOpts = { W, H, ground: floor, scroll: 0, t, unit: u };
    if (prevScene && sceneAge < 1.2) {
      drawScene(ctx, prevScene, sOpts);
      ctx.save();
      ctx.globalAlpha = sceneAge / 1.2;
      drawScene(ctx, sceneId(), sOpts);
      ctx.restore();
    } else drawScene(ctx, sceneId(), sOpts);
    // piso
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, floor, W, H - floor);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(0, floor, W, 2);

    // en pantalla vertical (celular) el muro usa todo el ancho, arriba
    const portrait = H > W * 1.15;
    const box = portrait ? [W * 0.04, H * 0.1, W * 0.92, H * 0.28] : [W * 0.04, H * 0.12, W * 0.62, H * 0.42];
    // el muro donde se pinta (ladrillo, sobre el escenario)
    ctx.save();
    ctx.beginPath();
    ctx.rect(box[0] - 10, box[1] - 14, box[2] + 20, box[3] + 30);
    ctx.clip();
    drawBrickWall(ctx, W, H, 0, Math.max(14, u * 0.045));
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 4;
    ctx.strokeRect(box[0] - 10, box[1] - 14, box[2] + 20, box[3] + 30);
    const { tipX, cy } = drawMural(...box);

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

    // perro dormido junto al guardia
    if (level >= DOG_FROM) drawDog(W * 0.86 - gs * 0.45 - sw * 0.95, floor, sw * 0.75);
    // cámara de seguridad arriba
    camOnYou = false;
    if (level >= CAM_FROM) {
      const cx = portrait ? W * 0.5 : W * 0.5;
      const cyc = portrait ? H * 0.46 : H * 0.06;
      camOnYou = drawCamera(cx, cyc, u * 0.07, sx, floor - sh * 0.5);
    }

    particles.draw(ctx);
    popups.draw(ctx);
    if (prevScene) drawSceneBanner(ctx, W, H, SCENE_NAMES[sceneId()], sceneAge);
    if (warnT < 3) {
      const a = Math.min(1, warnT / 0.2, (3 - warnT) / 0.4);
      bigText(ctx, warnText, W / 2, H * 0.94, Math.min(18, W * 0.04), { fill: COLORS.gold, alpha: a });
    }
    if (!spraying && t < 4 && level === 1 && progress === 0) {
      bigText(ctx, 'MANTÉN PRESIONADO PARA PINTAR', W / 2, H * 0.07, Math.min(20, W * 0.045), { fill: COLORS.white });
    }
    ctx.restore();
  });

  onScore?.(0);
  onLives?.(lives);
  return { stop: () => kit.stop() };
}
