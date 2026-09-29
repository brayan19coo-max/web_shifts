import { swaggyImage } from '../art.js';
import { sound } from '../../../audio/sound-manager.js';

/**
 * Mini juego "Atrapa la lata"
 * -------------------------------------------------------------
 * Swaggy se mueve de lado a lado (arrastrando con el dedo/mouse o con
 * las flechas) y atrapa latas de spray:
 *   - Lata blanca: +1
 *   - Lata dorada: +5
 *   - Lata negra con X roja: pierdes una vida (hay 3)
 * Cada vez caen más rápido. Devuelve { stop() }.
 */
const LIVES = 3;

export function startCatchGame(canvas, { onScore, onLives, onEnd } = {}) {
  const ctx = canvas.getContext('2d');
  const sprites = { happy: swaggyImage('happy'), annoyed: swaggyImage('annoyed'), party: swaggyImage('party') };

  let W = 0;
  let H = 0;
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const player = { x: W / 2, target: W / 2, w: 0, h: 0, mood: 'happy', moodUntil: 0 };
  const items = [];
  let score = 0;
  let lives = LIVES;
  let elapsed = 0;
  let spawnIn = 0.6;
  let last = performance.now();
  let running = true;
  let raf = 0;
  let flash = 0;
  const keys = { left: false, right: false };

  const size = () => {
    player.w = Math.min(150, Math.max(80, W * 0.16));
    player.h = player.w * 1.2;
  };
  size();

  // ---------- Controles ----------
  const toCanvasX = (clientX) => clientX - canvas.getBoundingClientRect().left;
  const onPointer = (event) => {
    player.target = toCanvasX(event.clientX);
  };
  const onKey = (event, down) => {
    if (event.key === 'ArrowLeft') keys.left = down;
    if (event.key === 'ArrowRight') keys.right = down;
  };
  const keyDown = (e) => onKey(e, true);
  const keyUp = (e) => onKey(e, false);
  canvas.addEventListener('pointerdown', onPointer);
  canvas.addEventListener('pointermove', onPointer);
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  // ---------- Latas ----------
  const spawn = () => {
    const r = Math.random();
    const type = r < 0.08 ? 'gold' : r < 0.3 ? 'bad' : 'can';
    const w = Math.max(22, Math.min(34, W * 0.06));
    items.push({
      type,
      x: w / 2 + Math.random() * (W - w),
      y: -w * 2,
      w,
      h: w * 1.9,
      rot: (Math.random() - 0.5) * 0.6,
      spin: (Math.random() - 0.5) * 2,
    });
  };

  const drawCan = ({ type, x, y, w, h, rot }) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const body = type === 'gold' ? '#f2c14e' : type === 'bad' ? '#141414' : '#f4f4f4';
    // cuerpo
    ctx.fillStyle = body;
    ctx.strokeStyle = type === 'bad' ? '#e3151a' : '#0a0a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2 + h * 0.18, w, h * 0.82, w * 0.25);
    ctx.fill();
    ctx.stroke();
    // franja
    ctx.fillStyle = type === 'bad' ? '#e3151a' : type === 'gold' ? '#0a0a0a' : '#e3151a';
    ctx.fillRect(-w / 2 + 2, -h / 2 + h * 0.45, w - 4, h * 0.14);
    // tapa y boquilla
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath();
    ctx.roundRect(-w * 0.35, -h / 2 + h * 0.04, w * 0.7, h * 0.16, 4);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-w * 0.1, -h / 2 - h * 0.02, w * 0.2, h * 0.08);
    // X roja en las malas
    if (type === 'bad') {
      ctx.strokeStyle = '#e3151a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, h * 0.05);
      ctx.lineTo(w * 0.3, h * 0.38);
      ctx.moveTo(w * 0.3, h * 0.05);
      ctx.lineTo(-w * 0.3, h * 0.38);
      ctx.stroke();
    }
    // brillo en la dorada
    if (type === 'gold') {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(-w * 0.3, -h * 0.2, w * 0.12, h * 0.5);
    }
    ctx.restore();
  };

  const setMood = (mood, ms = 500) => {
    player.mood = mood;
    player.moodUntil = performance.now() + ms;
  };

  // ---------- Bucle ----------
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;
    size(); // por si cambió el tamaño de la pantalla

    if (keys.left) player.target -= 520 * dt;
    if (keys.right) player.target += 520 * dt;
    player.target = Math.max(player.w / 2, Math.min(W - player.w / 2, player.target));
    player.x += (player.target - player.x) * Math.min(1, dt * 14);
    if (now > player.moodUntil) player.mood = 'happy';

    // Dificultad: más rápido y más seguido con el tiempo y el puntaje
    const level = 1 + elapsed / 25 + score / 80;
    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawn();
      spawnIn = Math.max(0.28, 0.95 / level) * (0.7 + Math.random() * 0.6);
    }
    const speed = 170 * level;

    const py = H - player.h - 8;
    const catchBox = { x1: player.x - player.w * 0.42, x2: player.x + player.w * 0.42, y1: py, y2: py + player.h * 0.5 };

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += speed * dt;
      it.rot += it.spin * dt;
      const hit = it.x > catchBox.x1 && it.x < catchBox.x2 && it.y + it.h / 2 > catchBox.y1 && it.y - it.h / 2 < catchBox.y2;
      if (hit) {
        items.splice(i, 1);
        if (it.type === 'bad') {
          lives -= 1;
          flash = 1;
          setMood('annoyed', 700);
          sound.play('error');
          onLives?.(lives);
          if (lives <= 0) return end();
        } else {
          score += it.type === 'gold' ? 5 : 1;
          setMood(it.type === 'gold' ? 'party' : 'happy', 400);
          sound.play(it.type === 'gold' ? 'success' : 'tick');
          onScore?.(score);
        }
      } else if (it.y - it.h > H) {
        items.splice(i, 1);
      }
    }

    // ---------- Dibujo ----------
    ctx.clearRect(0, 0, W, H);
    // piso
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, H - 10, W, 10);
    items.forEach(drawCan);
    const img = sprites[player.mood];
    if (img.complete) ctx.drawImage(img, player.x - player.w / 2, py, player.w, player.h);
    if (flash > 0) {
      ctx.fillStyle = `rgba(227, 21, 26, ${flash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
      flash = Math.max(0, flash - dt * 3);
    }
    raf = requestAnimationFrame(frame);
  };

  const cleanup = () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    canvas.removeEventListener('pointerdown', onPointer);
    canvas.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', onVisibility);
  };

  function end() {
    cleanup();
    onEnd?.(score);
  }

  // Pausa si la pestaña se oculta
  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (lives > 0 && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  onScore?.(0);
  onLives?.(lives);
  raf = requestAnimationFrame(frame);

  return {
    stop: cleanup,
  };
}
