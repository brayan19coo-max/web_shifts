import { sound } from '../../../audio/sound-manager.js';
import { createKit, drawCan, bigText, createParticles, createPopups, createShake, COLORS } from './kit.js';

/**
 * Mini juego "Combo Spray"
 * -------------------------------------------------------------
 * Tablero de latas de colores. Desliza (o toca una y luego la vecina)
 * para intercambiar dos latas y hacer filas de 3 o más iguales.
 *   - Cada lata que explota: +10 × nivel de cadena (las cascadas suman)
 *   - Fila de 4: +2 s · fila de 5 o más: +3 s y explota toda la fila
 *   - Cadenas de 2 o más: +1 s
 *   - Tienes 60 s. ¡Haz la mayor cantidad de puntos!
 * Devuelve { stop() }.
 */
const N = 7;
const TIME = 60;
const TYPES = [
  { color: COLORS.white, band: COLORS.red },
  { color: COLORS.red, band: COLORS.white },
  { color: COLORS.gold, band: COLORS.ink },
  { color: '#3f64a8', band: COLORS.white },
  { color: '#1d1d1d', band: COLORS.red, outline: '#f4f4f4' },
];

export function startComboGame(canvas, { onScore, onInfo, onEnd, music } = {}) {
  const kit = createKit(canvas);
  const { ctx, view } = kit;
  const particles = createParticles();
  const popups = createPopups();
  const shake = createShake();

  let grid = [];
  let score = 0;
  let timeLeft = TIME;
  let state = 'idle'; // idle → swap → clear → fall → (clear | idle)
  let stateT = 0;
  let chain = 0;
  let selected = null;
  let swap = null;
  let clearing = new Set();
  let idleT = 0;
  let hint = null;
  let ended = false;
  let lastSecond = TIME;

  const rnd = () => Math.floor(Math.random() * TYPES.length);
  const tile = (type, r) => ({ type, y: r, scale: 1 });

  // tablero inicial sin filas armadas
  for (let r = 0; r < N; r++) {
    grid[r] = [];
    for (let c = 0; c < N; c++) {
      let t;
      do t = rnd();
      while ((c >= 2 && grid[r][c - 1].type === t && grid[r][c - 2].type === t) || (r >= 2 && grid[r - 1][c].type === t && grid[r - 2][c].type === t));
      grid[r][c] = tile(t, r - N - 1); // caen desde arriba al empezar
    }
  }
  state = 'fall';

  const layout = () => {
    const cell = Math.floor(Math.min((view.W * 0.96) / N, (view.H * 0.86) / N));
    return { cell, ox: (view.W - cell * N) / 2, oy: view.H * 0.11 + (view.H * 0.88 - cell * N) / 2 };
  };

  const findMatches = () => {
    const found = new Set();
    const runs = [];
    for (let r = 0; r < N; r++) {
      let start = 0;
      for (let c = 1; c <= N; c++) {
        if (c < N && grid[r][c].type === grid[r][start].type) continue;
        if (c - start >= 3) {
          runs.push({ len: c - start, row: r });
          for (let k = start; k < c; k++) found.add(`${r},${k}`);
        }
        start = c;
      }
    }
    for (let c = 0; c < N; c++) {
      let start = 0;
      for (let r = 1; r <= N; r++) {
        if (r < N && grid[r][c].type === grid[start][c].type) continue;
        if (r - start >= 3) {
          runs.push({ len: r - start, col: c });
          for (let k = start; k < r; k++) found.add(`${k},${c}`);
        }
        start = r;
      }
    }
    return { found, runs };
  };

  const swapCells = (a, b) => {
    const t = grid[a.r][a.c];
    grid[a.r][a.c] = grid[b.r][b.c];
    grid[b.r][b.c] = t;
  };

  const findMove = () => {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const b = { r: r + dr, c: c + dc };
          if (b.r >= N || b.c >= N) continue;
          swapCells({ r, c }, b);
          const ok = findMatches().found.size > 0;
          swapCells({ r, c }, b);
          if (ok) return [{ r, c }, b];
        }
      }
    }
    return null;
  };

  const shuffleBoard = () => {
    const types = grid.flat().map((t) => t.type).sort(() => Math.random() - 0.5);
    let i = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) grid[r][c] = tile(types[i++], r - N - 1);
    popups.add('¡A REVOLVER!', view.W / 2, view.H * 0.5, { color: COLORS.gold, size: 28 });
    state = 'fall';
  };

  const startClear = (found, runs) => {
    clearing = found;
    chain += 1;
    const pts = found.size * 10 * chain;
    score += pts;
    onScore?.(score);
    let bonus = chain >= 2 ? 1 : 0;
    const { cell, ox, oy } = layout();
    runs.forEach((run) => {
      if (run.len >= 5) {
        bonus += 3;
        // la fila (o columna) completa explota
        for (let k = 0; k < N; k++) found.add(run.row != null ? `${run.row},${k}` : `${k},${run.col}`);
        shake.hit(10);
        popups.add('¡BOMBA DE PINTURA!', view.W / 2, oy + cell * N * 0.5, { color: COLORS.red, size: 26, life: 1.1 });
      } else if (run.len === 4) bonus += 2;
    });
    if (bonus) {
      timeLeft += bonus;
      popups.add(`+${bonus} s`, view.W - 50, oy - 10, { color: COLORS.gold, size: 20 });
    }
    // salpicaduras y texto de puntos
    let sx = 0;
    let sy = 0;
    found.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      const x = ox + c * cell + cell / 2;
      const y = oy + r * cell + cell / 2;
      sx += x;
      sy += y;
      particles.burst(x, y, TYPES[grid[r][c].type].color, 7, 200, cell * 0.08);
    });
    popups.add(`+${pts}`, sx / found.size, sy / found.size, { color: chain > 1 ? COLORS.gold : COLORS.white, size: 18 + Math.min(14, chain * 3) });
    if (chain >= 2) popups.add(`CADENA x${chain}`, view.W / 2, oy - 4, { color: COLORS.red, size: 22 });
    sound.play('note', { index: Math.min(7, chain + 1) });
    if (chain >= 3) sound.play('success');
    state = 'clear';
    stateT = 0;
  };

  const collapse = () => {
    for (let c = 0; c < N; c++) {
      const col = [];
      for (let r = N - 1; r >= 0; r--) if (!clearing.has(`${r},${c}`)) col.push(grid[r][c]);
      let missing = N - col.length;
      for (let r = N - 1, i = 0; r >= 0; r--, i++) {
        if (i < col.length) grid[r][c] = col[i];
        else grid[r][c] = tile(rnd(), -missing--);
      }
    }
    clearing = new Set();
    state = 'fall';
  };

  const trySwap = (a, b) => {
    if (state !== 'idle' || ended) return;
    if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) !== 1) return;
    selected = null;
    hint = null;
    idleT = 0;
    swap = { a, b, t: 0, back: false };
    swapCells(a, b);
    state = 'swap';
    sound.play('tick');
  };

  // ---------- Controles: tocar y deslizar ----------
  let press = null;
  const cellAt = (p) => {
    const { cell, ox, oy } = layout();
    const c = Math.floor((p.x - ox) / cell);
    const r = Math.floor((p.y - oy) / cell);
    return r >= 0 && r < N && c >= 0 && c < N ? { r, c } : null;
  };
  kit.on(canvas, 'pointerdown', (e) => {
    e.preventDefault();
    const p = kit.point(e);
    const at = cellAt(p);
    if (!at) return;
    if (selected && Math.abs(selected.r - at.r) + Math.abs(selected.c - at.c) === 1) return trySwap(selected, at);
    selected = at;
    press = { ...p, at };
    sound.play('click');
  });
  kit.on(canvas, 'pointermove', (e) => {
    if (!press) return;
    const p = kit.point(e);
    const dx = p.x - press.x;
    const dy = p.y - press.y;
    const { cell } = layout();
    if (Math.max(Math.abs(dx), Math.abs(dy)) < cell * 0.35) return;
    const to = Math.abs(dx) > Math.abs(dy) ? { r: press.at.r, c: press.at.c + Math.sign(dx) } : { r: press.at.r + Math.sign(dy), c: press.at.c };
    const from = press.at;
    press = null;
    if (to.r >= 0 && to.r < N && to.c >= 0 && to.c < N) trySwap(from, to);
  });
  kit.on(window, 'pointerup', () => (press = null));

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.ceil(s) % 60).padStart(2, '0')}`;

  kit.loop((dt, now) => {
    const { W, H } = view;
    const { cell, ox, oy } = layout();
    stateT += dt;

    if (!ended) {
      timeLeft -= dt;
      const sec = Math.ceil(timeLeft);
      if (sec !== lastSecond) {
        lastSecond = sec;
        onInfo?.(`⏱ ${fmt(Math.max(0, timeLeft))}`);
        if (sec <= 5 && sec > 0) sound.play('tick');
        music?.setLevel(sec <= 10 ? 3 : 2);
      }
      if (timeLeft <= 0) {
        ended = true;
        timeLeft = 0;
        popups.add('¡TIEMPO!', W / 2, H * 0.5, { color: COLORS.red, size: 44, life: 1.4 });
        sound.play('unlock');
        setTimeout(() => {
          kit.stop();
          onEnd?.(score);
        }, 1400);
      }
    }

    if (state === 'swap') {
      swap.t += dt / 0.16;
      if (swap.t >= 1) {
        const { found, runs } = findMatches();
        if (found.size) {
          swap = null;
          chain = 0;
          startClear(found, runs);
        } else if (!swap.back) {
          swapCells(swap.a, swap.b);
          swap = { ...swap, t: 0, back: true };
          sound.play('remove');
        } else {
          swap = null;
          state = 'idle';
        }
      }
    } else if (state === 'clear') {
      if (stateT > 0.22) collapse();
    } else if (state === 'fall') {
      let moving = false;
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const t = grid[r][c];
          if (t.y < r) {
            t.vy = (t.vy || 0) + 40 * dt;
            t.y = Math.min(r, t.y + t.vy * dt);
            moving = true;
          } else {
            t.y = r;
            t.vy = 0;
          }
        }
      }
      if (!moving) {
        const { found, runs } = findMatches();
        if (found.size && !ended) startClear(found, runs);
        else {
          state = 'idle';
          chain = 0;
          if (!ended && !findMove()) shuffleBoard();
        }
      }
    } else if (state === 'idle' && !ended) {
      idleT += dt;
      if (idleT > 5 && !hint) hint = findMove();
    }

    particles.update(dt, 400);
    popups.update(dt);

    // ---------- Dibujo ----------
    ctx.save();
    shake.apply(ctx, dt);
    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(0, 0, W, H);
    // tablero
    ctx.fillStyle = '#171717';
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ox - 6, oy - 6, cell * N + 12, cell * N + 12, 14);
    ctx.fill();
    ctx.stroke();
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if ((r + c) % 2) {
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
        }
      }
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox - 6, oy - 6, cell * N + 12, cell * N + 12);
    ctx.clip();
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const t = grid[r][c];
        let x = ox + c * cell + cell / 2;
        let y = oy + t.y * cell + cell / 2;
        // animación de intercambio
        if (swap) {
          const k = Math.min(1, swap.t);
          const e = k * k * (3 - 2 * k);
          const isA = r === swap.a.r && c === swap.a.c;
          const isB = r === swap.b.r && c === swap.b.c;
          if (isA || isB) {
            const from = isA ? swap.b : swap.a;
            x = ox + (from.c + ((isA ? swap.a.c : swap.b.c) - from.c) * e) * cell + cell / 2;
            y = oy + (from.r + ((isA ? swap.a.r : swap.b.r) - from.r) * e) * cell + cell / 2;
          }
        }
        let scale = 1;
        if (clearing.has(`${r},${c}`)) scale = Math.max(0, 1 + stateT * 2 - (stateT / 0.22) * 2.2);
        const sel = selected && selected.r === r && selected.c === c;
        const hinted = hint && hint.some((h) => h.r === r && h.c === c);
        if (sel) {
          ctx.fillStyle = 'rgba(227,21,26,0.25)';
          ctx.fillRect(ox + c * cell + 2, oy + r * cell + 2, cell - 4, cell - 4);
        }
        const wob = hinted ? Math.sin(now / 90) * 0.15 : sel ? Math.sin(now / 120) * 0.08 : 0;
        const T = TYPES[t.type];
        if (scale > 0.02) drawCan(ctx, x, y + cell * 0.02, cell * 0.4 * scale, T.color, { band: T.band, rot: wob, outline: T.outline || COLORS.ink });
      }
    }
    ctx.restore();
    particles.draw(ctx);
    popups.draw(ctx);
    // tiempo como barra arriba
    const k = Math.max(0, Math.min(1, timeLeft / TIME));
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(ox, oy - 22, cell * N, 8);
    ctx.fillStyle = timeLeft < 10 ? COLORS.red : COLORS.white;
    ctx.fillRect(ox, oy - 22, cell * N * k, 8);
    ctx.restore();
  });

  onScore?.(0);
  onInfo?.(`⏱ ${fmt(TIME)}`);
  return { stop: () => kit.stop() };
}
