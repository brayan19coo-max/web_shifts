import { swaggyImage } from '../art.js';
import { sound } from '../../../audio/sound-manager.js';
import { createKit, drawCan, bigText, createParticles, createPopups, createShake, COLORS } from './kit.js';
import { drawSceneBanner, rnd } from './scenes.js';

// Tarimas: cambian cada 2 subidas de velocidad (cada 32 tiempos)
const STAGES = ['El garaje', 'Block party', 'La disco', 'La tarima', 'El festival'];

/**
 * Mini juego "Ritmo Shift's"
 * -------------------------------------------------------------
 * Caen latas por 3 carriles al ritmo del beat. Toca el carril (o usa
 * ← ↓ → / A S D) justo cuando la lata llega a la línea roja.
 *   - PERFECTO +100 · BIEN +60 · OK +30, multiplicado por el combo
 *     (cada 10 seguidas sube el multiplicador, hasta x4)
 *   - Cada lata que se te pasa baja tu energía; si llega a 0, se acaba.
 *   - Cada 16 tiempos el beat va más rápido y caen más latas.
 *   - Cada acierto suena una nota: entre mejor lo hagas, mejor suena.
 *   - La tarima cambia con la velocidad: garaje → block party → disco →
 *     tarima → festival (con público, luces y láseres al ritmo).
 * Devuelve { stop() }.
 */
const LANES = 3;
const LANE_COLORS = [COLORS.white, COLORS.red, COLORS.gold];
const MELODY = [0, 2, 4, 2, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 4, 0];
const WINDOWS = [
  { max: 0.05, label: 'PERFECTO', pts: 100, energy: 4, color: COLORS.gold },
  { max: 0.1, label: 'BIEN', pts: 60, energy: 2, color: COLORS.white },
  { max: 0.16, label: 'OK', pts: 30, energy: 0, color: COLORS.gray },
];

export function startRhythmGame(canvas, { onScore, onInfo, onEnd } = {}) {
  const kit = createKit(canvas);
  const { ctx, view } = kit;
  const dance = [swaggyImage('party'), swaggyImage('happy')];
  const sad = swaggyImage('annoyed');
  const particles = createParticles();
  const popups = createPopups();
  const shake = createShake();

  let t = -2.4; // tiempo de la canción (negativo = cuenta regresiva)
  let bpm = 96;
  let beatLen = 60 / bpm;
  let nextBeatAt = 0; // tiempo del próximo tiempo a programar
  let beatCount = 0;
  let spawnedUntil = -1;
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let energy = 100;
  let melodyI = 0;
  let over = false;
  let lastMiss = -10;
  let lastCount = 4;
  const notes = [];
  const pressed = new Array(LANES).fill(0);
  let stage = 0;
  let stageAge = 10;
  let hype = 0; // el público se prende con los combos

  // ---------- Escenario ----------
  const drawStage = (W, H, hitY, pulse, beatPhase) => {
    const k = stage;
    // fondo
    const bgs = [['#121010', '#1d1612'], ['#0b0f1c', '#1b1430'], ['#0a0612', '#22082a'], ['#05050a', '#1a0505'], ['#020208', '#120a24']];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bgs[k][0]);
    g.addColorStop(1, bgs[k][1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (k === 0) {
      // garaje: ladrillo y un bombillo que se mece
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      for (let y = 0; y < H; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      const sw = Math.sin(t * 1.4) * 0.25;
      const bx = W / 2 + Math.sin(sw) * H * 0.25;
      const by = Math.cos(sw) * H * 0.25;
      ctx.strokeStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(bx, by);
      ctx.stroke();
      const lg = ctx.createRadialGradient(bx, by, 4, bx, by, H * 0.8);
      lg.addColorStop(0, `rgba(255,214,140,${0.25 + pulse * 0.1})`);
      lg.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffd68c';
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    if (k === 1) {
      // block party: guirnaldas de bombillos
      for (let row = 0; row < 2; row++) {
        const y0 = H * (0.1 + row * 0.12);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.quadraticCurveTo(W / 2, y0 + H * 0.08, W, y0);
        ctx.stroke();
        for (let i = 0; i <= 14; i++) {
          const x = (W * i) / 14;
          const y = y0 + Math.sin((Math.PI * i) / 14) * H * 0.04;
          const on = (i + Math.floor(beatCount / 1)) % 3 !== row;
          ctx.fillStyle = on ? ['#ffd68c', '#e3151a', '#f4f4f4'][(i + row) % 3] : '#333';
          ctx.beginPath();
          ctx.arc(x, y + 6, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    if (k === 2) {
      // disco: bola de espejos y puntos de luz que giran
      const bx = W / 2;
      const by = H * 0.12;
      for (let i = 0; i < 40; i++) {
        const a = rnd(i) * Math.PI * 2 + t * 0.6;
        const d = (0.2 + rnd(i * 3) * 0.8) * Math.max(W, H) * 0.6;
        ctx.fillStyle = `rgba(${i % 3 ? '255,255,255' : '227,21,26'},${0.15 + pulse * 0.25})`;
        ctx.fillRect(bx + Math.cos(a) * d, by + Math.abs(Math.sin(a)) * d, 4, 4);
      }
      ctx.fillStyle = '#c9c9c9';
      ctx.beginPath();
      ctx.arc(bx, by, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#777';
      for (let i = -18; i < 18; i += 6) {
        ctx.beginPath();
        ctx.moveTo(bx - 18, by + i);
        ctx.lineTo(bx + 18, by + i);
        ctx.stroke();
      }
    }
    if (k >= 3) {
      // tarima / festival: reflectores que barren
      for (let i = 0; i < 4; i++) {
        const x = W * (0.12 + i * 0.25);
        const a = Math.PI / 2 + Math.sin(t * (0.8 + i * 0.2) + i) * 0.5;
        ctx.fillStyle = i % 2 ? `rgba(227,21,26,${0.12 + pulse * 0.1})` : `rgba(255,255,255,${0.08 + pulse * 0.08})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + Math.cos(a - 0.12) * H * 1.2, Math.sin(a - 0.12) * H * 1.2);
        ctx.lineTo(x + Math.cos(a + 0.12) * H * 1.2, Math.sin(a + 0.12) * H * 1.2);
        ctx.fill();
      }
      // pantalla gigante con el logo
      bigText(ctx, "SHIFT'S", W / 2, H * 0.12, Math.min(60, W * 0.12), { fill: `rgba(244,244,244,${0.12 + pulse * 0.2})`, stroke: 'transparent' });
    }
    if (k === 4) {
      // láseres
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = Math.sin(t * 1.3 + i) * 0.9;
        ctx.strokeStyle = i % 2 ? 'rgba(227,21,26,0.6)' : 'rgba(160,255,200,0.45)';
        ctx.beginPath();
        ctx.moveTo(W / 2, H);
        ctx.lineTo(W / 2 + Math.sin(a) * H * 1.5, H - Math.cos(a) * H * 1.5);
        ctx.stroke();
      }
    }
    // público: cabezas y brazos que saltan al beat
    if (k >= 1) {
      const n = Math.floor(W / 26);
      const jump = Math.max(0, Math.sin(beatPhase * Math.PI)) ;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * (W / n);
        const hop = jump * (6 + rnd(i) * 10) * (0.5 + hype);
        const y = H - 18 - hop - rnd(i * 3) * 12;
        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 13, y + 8, 26, 30);
        if (rnd(i * 7) < 0.3 + hype * 0.5) {
          ctx.fillRect(x + 6, y - 22 - hop * 0.3, 4, 22);
        }
      }
    }
  };

  const travel = () => Math.max(0.95, 1.5 - (bpm - 96) * 0.008); // segundos que tarda en caer
  const mult = () => Math.min(4, 1 + Math.floor(combo / 10) * 0.5);

  // Programa las latas de los próximos tiempos
  const schedule = () => {
    const level = Math.floor(beatCount / 16);
    while (spawnedUntil < t + travel() + 0.1) {
      const at = nextBeatAt;
      beatCount += 1;
      if (beatCount % 16 === 0) {
        bpm = Math.min(156, bpm + 6);
        beatLen = 60 / bpm;
      }
      // la tarima cambia cuando esos tiempos llegan a sonar
      if (beatCount % 32 === 0 && stage < STAGES.length - 1) {
        const at2 = at;
        setTimeout(() => {
          if (over) return;
          stage += 1;
          stageAge = 0;
          sound.play('unlock');
        }, Math.max(0, (at2 - t) * 1000));
      }
      // el primer compás de cada 4 es más tranquilo
      const density = Math.min(0.92, 0.55 + level * 0.07);
      if (Math.random() < density) {
        const lane = Math.floor(Math.random() * LANES);
        notes.push({ lane, at, hit: false, missed: false });
        if (level >= 2 && Math.random() < Math.min(0.3, level * 0.05)) {
          notes.push({ lane: (lane + 1 + Math.floor(Math.random() * 2)) % LANES, at, hit: false, missed: false });
        }
      }
      // corcheas a partir del nivel 1
      if (level >= 1 && Math.random() < Math.min(0.35, level * 0.08)) {
        notes.push({ lane: Math.floor(Math.random() * LANES), at: at + beatLen / 2, hit: false, missed: false });
      }
      nextBeatAt += beatLen;
      spawnedUntil = at;
    }
  };

  const hitLane = (lane) => {
    if (over) return;
    pressed[lane] = 0.12;
    if (t < -0.2) return;
    let best = null;
    notes.forEach((n) => {
      if (n.lane !== lane || n.hit || n.missed) return;
      const d = Math.abs(n.at - t);
      if (d <= 0.16 && (!best || d < Math.abs(best.at - t))) best = n;
    });
    const { lx, lw, hitY } = layout();
    const x = lx + lane * lw + lw / 2;
    if (!best) {
      // toque al aire: corta el combo pero no quita energía
      if (combo > 4) popups.add('¡A DESTIEMPO!', x, hitY - 60, { color: COLORS.gray, size: 16 });
      combo = 0;
      return;
    }
    best.hit = true;
    const d = Math.abs(best.at - t);
    const w = WINDOWS.find((win) => d <= win.max);
    combo += 1;
    maxCombo = Math.max(maxCombo, combo);
    const pts = Math.round(w.pts * mult());
    score += pts;
    energy = Math.min(100, energy + w.energy);
    onScore?.(score);
    sound.play('note', { index: MELODY[melodyI++ % MELODY.length] });
    particles.burst(x, hitY, LANE_COLORS[lane], w.max === 0.05 ? 16 : 9, 260, 4);
    popups.add(w.label, x, hitY - 50, { color: w.color, size: w.max === 0.05 ? 22 : 18, life: 0.6 });
    if (combo > 0 && combo % 25 === 0) {
      popups.add(`¡COMBO ${combo}!`, view.W / 2, view.H * 0.3, { color: COLORS.red, size: 30, life: 1.1 });
      sound.play('success');
    }
  };

  const KEYS = { ArrowLeft: 0, a: 0, j: 0, ArrowDown: 1, s: 1, k: 1, ArrowRight: 2, d: 2, l: 2 };
  kit.on(window, 'keydown', (e) => {
    const lane = KEYS[e.key];
    if (lane == null || e.repeat) return;
    e.preventDefault();
    hitLane(lane);
  });
  kit.on(canvas, 'pointerdown', (e) => {
    e.preventDefault();
    const { lx, lw } = layout();
    const p = kit.point(e);
    const lane = Math.floor((p.x - lx) / lw);
    if (lane >= 0 && lane < LANES) hitLane(lane);
  });

  const layout = () => {
    const width = Math.min(view.W, Math.max(240, view.H * 0.75), 460);
    const lx = (view.W - width) / 2;
    return { lx, lw: width / LANES, width, hitY: view.H * 0.84 };
  };

  kit.loop((dt) => {
    const { W, H } = view;
    if (!over) t += dt;
    stageAge += dt;
    hype = Math.max(0, Math.min(1, hype + (combo >= 10 ? 0.3 : -0.4) * dt));
    const { lx, lw, width, hitY } = layout();

    // cuenta regresiva con el metrónomo
    if (t < 0) {
      const c = Math.ceil(-t / 0.6);
      if (c < lastCount) {
        lastCount = c;
        sound.play('tick');
      }
    }
    if (!over) schedule();

    // latas que se pasaron
    notes.forEach((n) => {
      if (!n.hit && !n.missed && t - n.at > 0.16) {
        n.missed = true;
        combo = 0;
        energy -= 12;
        lastMiss = t;
        shake.hit(5);
        sound.play('remove');
        popups.add('FALLO', lx + n.lane * lw + lw / 2, hitY - 40, { color: COLORS.red, size: 16, life: 0.5 });
      }
    });
    for (let i = notes.length - 1; i >= 0; i--) if (t - notes[i].at > 1) notes.splice(i, 1);

    if (!over && energy <= 0) {
      over = true;
      energy = 0;
      popups.add('¡SE ACABÓ EL BEAT!', W / 2, H * 0.4, { color: COLORS.red, size: 30, life: 1.4 });
      sound.play('error');
      setTimeout(() => {
        kit.stop();
        onEnd?.(score);
      }, 1400);
    }
    onInfo?.(`Combo ${combo}${mult() > 1 ? ` · x${mult()}` : ''}`);

    particles.update(dt, 300);
    popups.update(dt);
    for (let i = 0; i < LANES; i++) pressed[i] = Math.max(0, pressed[i] - dt);

    // ---------- Dibujo ----------
    const beatPhase = t > 0 ? ((t % beatLen) / beatLen) : 0;
    const pulse = 1 - beatPhase;
    ctx.save();
    shake.apply(ctx, dt);
    drawStage(W, H, hitY, pulse, beatPhase);
    // luces al ritmo
    const glow = ctx.createRadialGradient(W / 2, hitY, 10, W / 2, hitY, H);
    glow.addColorStop(0, `rgba(227,21,26,${0.05 + pulse * 0.12})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // carriles
    for (let i = 0; i < LANES; i++) {
      const x = lx + i * lw;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, pressed[i] > 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)');
      ctx.fillStyle = g;
      ctx.fillRect(x + 3, 0, lw - 6, H);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= LANES; i++) {
      ctx.beginPath();
      ctx.moveTo(lx + i * lw, 0);
      ctx.lineTo(lx + i * lw, H);
      ctx.stroke();
    }
    // línea de golpe
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(lx, hitY - 2, width, 4);
    for (let i = 0; i < LANES; i++) {
      const x = lx + i * lw + lw / 2;
      ctx.strokeStyle = pressed[i] > 0 ? COLORS.white : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, hitY, Math.min(lw * 0.3, 30) * (1 + (pressed[i] > 0 ? 0.15 : 0)), 0, Math.PI * 2);
      ctx.stroke();
      const keys = ['←', '↓', '→'];
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '700 13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(keys[i], x, hitY + Math.min(lw * 0.3, 30) + 18);
    }
    // latas cayendo
    const tr = travel();
    notes.forEach((n) => {
      if (n.hit) return;
      const k = 1 - (n.at - t) / tr;
      if (k < -0.05) return;
      const y = k * hitY;
      const x = lx + n.lane * lw + lw / 2;
      ctx.globalAlpha = n.missed ? 0.3 : 1;
      drawCan(ctx, x, y, Math.min(lw * 0.26, 26), LANE_COLORS[n.lane], { band: n.lane === 1 ? COLORS.white : COLORS.red });
      ctx.globalAlpha = 1;
    });

    // Swaggy bailando al lado (si hay espacio) o pequeño arriba
    const roomy = W - width > 260;
    const sw = roomy ? Math.min(150, H * 0.32) : Math.min(70, W * 0.18);
    const img = t - lastMiss < 0.5 ? sad : dance[Math.floor(Math.max(0, t) / beatLen) % 2];
    if (img.complete) {
      const sx = roomy ? lx - sw - 30 : W - sw - 6;
      const sy = roomy ? hitY - sw * 1.2 : 34;
      ctx.save();
      ctx.translate(sx + sw / 2, sy + sw * 1.2);
      ctx.rotate(Math.sin(beatPhase * Math.PI * 2) * 0.12);
      ctx.scale(1 + pulse * 0.04, 1 - pulse * 0.05);
      ctx.drawImage(img, -sw / 2, -sw * 1.2, sw, sw * 1.2);
      ctx.restore();
      if (roomy) ctx.drawImage(img, W - (lx - sw - 30) - sw, sy, sw, sw * 1.2);
    }

    particles.draw(ctx);
    popups.draw(ctx);

    // energía
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(lx, 10, width, 8);
    ctx.fillStyle = energy < 30 ? COLORS.red : COLORS.white;
    ctx.fillRect(lx, 10, (width * Math.max(0, energy)) / 100, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '700 11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('ENERGÍA', lx, 32);
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(bpm)} BPM`, lx + width, 32);

    if (stage > 0) drawSceneBanner(ctx, W, H, STAGES[stage], stageAge);
    if (t < 0) {
      const c = Math.ceil(-t / 0.6);
      bigText(ctx, c > 3 ? '¿LISTO?' : String(c), W / 2, H * 0.42, Math.min(80, W * 0.18), { fill: COLORS.white });
    }
    ctx.restore();
  });

  onScore?.(0);
  return { stop: () => kit.stop() };
}
