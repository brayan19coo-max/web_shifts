import { swaggyImage } from '../art.js';
import { sound } from '../../../audio/sound-manager.js';
import { createKit, bigText, createParticles, createShake, COLORS } from './kit.js';

/**
 * Mini juego "Tap the Drop"
 * -------------------------------------------------------------
 * Un contador baja hacia el lanzamiento. Hay que pararlo lo más cerca
 * posible de 00.000 (toque, clic o espacio).
 *   - ≤ 15 ms PERFECTO +100 (y recuperas una vida)
 *   - ≤ 40 ms EXCELENTE +60 · ≤ 80 ms BIEN +30 · ≤ 150 ms CASI +10
 *   - Más de 150 ms (o dejarlo pasar): pierdes una vida (hay 3)
 *   - Combo: aciertos seguidos (BIEN o mejor) multiplican los puntos.
 *   - Cada ronda va más rápido y desde la ronda 4 los números se
 *     esconden antes de llegar a cero ("a ciegas").
 * Devuelve { stop() }.
 */
const GRADES = [
  { max: 15, label: '¡PERFECTO!', pts: 100, color: COLORS.gold },
  { max: 40, label: 'EXCELENTE', pts: 60, color: COLORS.white },
  { max: 80, label: 'BIEN', pts: 30, color: COLORS.white },
  { max: 150, label: 'CASI…', pts: 10, color: COLORS.gray },
];

export function startTapDropGame(canvas, { onScore, onLives, onInfo, onEnd } = {}) {
  const kit = createKit(canvas);
  const { ctx, view } = kit;
  const sprites = { chill: swaggyImage('chill'), party: swaggyImage('party'), annoyed: swaggyImage('annoyed'), happy: swaggyImage('happy') };
  const particles = createParticles();
  const shake = createShake();

  let lives = 3;
  let score = 0;
  let round = 0;
  let combo = 0;
  let state = 'intro'; // intro → run → result → (run | over)
  let value = 0; // segundos que faltan
  let rate = 1;
  let hideBelow = 0;
  let stateT = 0;
  let result = null;
  let mood = 'chill';
  let lastBeep = 0;

  const fmt = (t) => {
    const neg = t < 0;
    const ms = Math.round(Math.abs(t) * 1000);
    const s = Math.floor(ms / 1000);
    return `${neg ? '−' : ''}${String(s).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
  };

  const nextRound = () => {
    round += 1;
    value = 2.4 + Math.random() * 1.6;
    rate = Math.min(1.9, 1 + (round - 1) * 0.07);
    hideBelow = round >= 7 ? 1.8 : round >= 4 ? 1.1 : 0;
    state = 'run';
    stateT = 0;
    mood = 'chill';
    lastBeep = Math.ceil(value);
    onInfo?.(`Ronda ${round}${combo > 1 ? ` · Combo x${combo}` : ''}`);
    sound.play('whoosh');
  };

  const judge = (diffMs, slept = false) => {
    const grade = slept ? null : GRADES.find((g) => diffMs <= g.max);
    if (grade) {
      if (grade.max <= 80) combo += 1;
      else combo = 0;
      const mult = 1 + Math.max(0, combo - 1) * 0.25;
      const pts = Math.round(grade.pts * mult);
      score += pts;
      onScore?.(score);
      if (grade.max === 15 && lives < 3) {
        lives += 1;
        onLives?.(lives);
      }
      result = { label: grade.label, color: grade.color, sub: `${diffMs} ms · +${pts}${mult > 1 ? ` (x${mult.toFixed(2).replace(/0$/, '')})` : ''}`, good: true, perfect: grade.max === 15 };
      mood = grade.max <= 40 ? 'party' : 'happy';
      sound.play(grade.max <= 40 ? 'unlock' : 'success');
      if (grade.max <= 40) {
        for (let i = 0; i < 4; i++) particles.burst(view.W * (0.2 + Math.random() * 0.6), view.H * 0.35, [COLORS.red, COLORS.white, COLORS.gold][i % 3], 14, 320, 5);
      }
    } else {
      combo = 0;
      lives -= 1;
      onLives?.(lives);
      result = { label: slept ? '¡TE DORMISTE!' : 'FALLASTE', color: COLORS.red, sub: slept ? 'el drop salió sin ti' : `${diffMs} ms`, good: false };
      mood = 'annoyed';
      shake.hit(12);
      sound.play('error');
    }
    state = 'result';
    stateT = 0;
  };

  const press = () => {
    if (state === 'intro') return nextRound();
    if (state === 'run') {
      sound.play('click');
      return judge(Math.round(Math.abs(value) * 1000));
    }
    if (state === 'result' && stateT > 0.45) advance();
  };

  const advance = () => {
    if (lives <= 0) {
      state = 'over';
      kit.stop();
      onEnd?.(score);
      return;
    }
    nextRound();
  };

  kit.on(canvas, 'pointerdown', (e) => {
    e.preventDefault();
    press();
  });
  kit.on(window, 'keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      press();
    }
  });

  const drawDigits = (text, cx, cy, size, color, hidden) => {
    const chars = text.split('');
    const boxW = size * 0.68;
    const sepW = size * 0.3;
    const total = chars.reduce((w, c) => w + (/\d/.test(c) ? boxW + 6 : sepW), 0);
    let x = cx - total / 2;
    chars.forEach((c, i) => {
      if (/\d/.test(c)) {
        ctx.fillStyle = '#f4f4f4';
        ctx.beginPath();
        ctx.roundRect(x, cy - size * 0.62, boxW, size * 1.24, size * 0.12);
        ctx.fill();
        ctx.fillStyle = '#d9d9d9';
        ctx.fillRect(x, cy, boxW, size * 0.62 - size * 0.12);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x, cy - 1, boxW, 2);
        const shown = hidden ? ['?', '#', '?', '%'][(i + Math.floor(performance.now() / 90)) % 4] : c;
        ctx.fillStyle = hidden ? COLORS.red : color;
        ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shown, x + boxW / 2, cy + size * 0.04);
        x += boxW + 6;
      } else {
        bigText(ctx, c, x + sepW / 2, cy, size * 0.8, { fill: color === COLORS.ink ? COLORS.white : color });
        x += sepW;
      }
    });
  };

  kit.loop((dt, now) => {
    const { W, H } = view;
    stateT += dt;
    if (state === 'run') {
      value -= dt * rate;
      // pitidos del contador en cada segundo
      const sec = Math.ceil(value);
      if (sec < lastBeep && value > 0) {
        lastBeep = sec;
        sound.play('tick');
      }
      if (value < -0.45) judge(450, true);
    }
    if (state === 'result' && stateT > 1.35) advance();
    if (state === 'over') return;
    particles.update(dt, 600);

    // ---------- Dibujo ----------
    ctx.save();
    shake.apply(ctx, dt);
    const bg = ctx.createRadialGradient(W / 2, H * 0.4, 10, W / 2, H * 0.4, Math.max(W, H) * 0.7);
    bg.addColorStop(0, state === 'result' && result?.good ? '#2a1414' : '#1a1a1a');
    bg.addColorStop(1, '#0b0b0b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // rayas
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 18;
    for (let x = -H; x < W; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + H, 0);
      ctx.stroke();
    }

    const size = Math.min(W / 7.5, H * 0.16, 92);
    const cy = H * 0.36;
    bigText(ctx, state === 'intro' ? 'PARA EL CONTADOR EN' : 'LANZAMIENTO EN', W / 2, cy - size * 1.25, Math.min(20, W * 0.045), { fill: COLORS.gray, stroke: 'transparent' });

    if (state === 'intro') {
      drawDigits('00.000', W / 2, cy, size, COLORS.ink, false);
      bigText(ctx, 'TOCA PARA EMPEZAR', W / 2, cy + size * 1.35, Math.min(28, W * 0.06), { fill: COLORS.white });
    } else {
      const v = state === 'run' ? value : result ? value : 0;
      const hidden = state === 'run' && hideBelow && value < hideBelow;
      const color = v < 0 ? COLORS.red : COLORS.ink;
      drawDigits(fmt(v), W / 2, cy, size, color, hidden);
      if (state === 'run' && hidden) bigText(ctx, 'A CIEGAS 👀', W / 2, cy + size * 1.2, Math.min(22, W * 0.05), { fill: COLORS.red });
      if (state === 'run' && !hidden && value < 1) {
        // barra de tensión
        ctx.fillStyle = COLORS.red;
        ctx.fillRect(W / 2 - size * 2, cy + size * 0.85, size * 4 * Math.max(0, value), 4);
      }
      if (state === 'result' && result) {
        const pop = Math.min(1, stateT / 0.15);
        bigText(ctx, result.label, W / 2, cy + size * 1.35, Math.min(44, W * 0.085) * (0.6 + pop * 0.4), { fill: result.color });
        bigText(ctx, result.sub, W / 2, cy + size * 1.35 + Math.min(34, W * 0.07), Math.min(16, W * 0.038), { fill: COLORS.gray, stroke: 'transparent' });
      }
    }

    // Swaggy mirando el contador
    const img = sprites[mood];
    if (img.complete) {
      const sw = Math.min(140, H * 0.28, W * 0.3);
      const sh = sw * 1.2;
      const hop = mood === 'party' ? Math.abs(Math.sin(now / 120)) * 14 : mood === 'annoyed' ? (Math.random() - 0.5) * 4 : Math.sin(now / 500) * 3;
      ctx.drawImage(img, W / 2 - sw / 2, H - sh - 6 - hop, sw, sh);
    }
    particles.draw(ctx);
    ctx.restore();
  });

  onScore?.(0);
  onLives?.(lives);
  return { stop: () => kit.stop() };
}
