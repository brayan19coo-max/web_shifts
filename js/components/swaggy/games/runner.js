import { swaggyImage } from '../art.js';
import { sound } from '../../../audio/sound-manager.js';

/**
 * Mini juego "Escape del muro"
 * -------------------------------------------------------------
 * Swaggy corre por la calle frente a un muro de graffiti y tiene que
 * saltar conos, vallas y canecas. Toca la pantalla (o espacio / ↑)
 * para saltar; mantén presionado para saltar más alto y toca otra vez
 * en el aire para un doble salto.
 *   - Puntos por distancia recorrida.
 *   - Lata de spray: +5 · Lata dorada: +15.
 *   - 3 vidas; cada golpe quita una. Cada vez va más rápido.
 * Devuelve { stop() }.
 */
const LIVES = 3;
const TAGS = ["SHIFT'S", 'SAINT', 'B&C', 'CREW', 'SWAGGY', 'DROP 02', '★', 'FUERA DE LA LEY'];

export function startRunnerGame(canvas, { onScore, onLives, onEnd } = {}) {
  const ctx = canvas.getContext('2d');
  const sprites = { run: swaggyImage('happy'), air: swaggyImage('party'), hit: swaggyImage('annoyed') };

  let W = 0;
  let H = 0;
  let ground = 0;
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ground = H * 0.82;
  };
  resize();
  window.addEventListener('resize', resize);

  // Tamaños y física proporcionales a la altura del juego
  const unit = () => Math.min(H, W * 1.2);
  const player = { y: 0, vy: 0, jumps: 0, holding: false, w: 0, h: 0, hitUntil: 0, step: 0 };
  const obstacles = [];
  const pickups = [];
  const tags = [];
  let distance = 0;
  let bonus = 0;
  let score = 0;
  let lives = LIVES;
  let elapsed = 0;
  let nextObstacle = 0;
  let wallOffset = 0;
  let last = performance.now();
  let running = true;
  let raf = 0;
  let flash = 0;
  const popups = [];

  const size = () => {
    player.w = Math.max(64, Math.min(124, unit() * 0.25));
    player.h = player.w * 1.2;
  };
  size();

  // ---------- Saltar ----------
  const jump = () => {
    if (!running) return;
    const u = unit();
    if (player.y === 0) {
      player.vy = -u * 2.35;
      player.jumps = 1;
      sound.play('whoosh');
    } else if (player.jumps < 2) {
      player.vy = -u * 1.95;
      player.jumps = 2;
      sound.play('tick');
    }
    player.holding = true;
  };
  const release = () => {
    player.holding = false;
  };
  const onDown = (event) => {
    event.preventDefault();
    jump();
  };
  const onKeyDown = (event) => {
    if ((event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w') && !event.repeat) {
      event.preventDefault();
      jump();
    }
  };
  const onKeyUp = (event) => {
    if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w') release();
  };
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', release);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // ---------- Obstáculos y latas ----------
  // En pantallas angostas (celular vertical) va más despacio para que dé tiempo de reaccionar
  const speed = () => Math.min(unit(), W * 0.75) * Math.min(2.6, 1.05 + elapsed * 0.035);

  const spawnObstacle = () => {
    const u = unit();
    const r = Math.random();
    const type = elapsed > 12 && r < 0.25 ? 'valla' : r < 0.6 ? 'cono' : 'caneca';
    const dims = { cono: [0.09, 0.14], caneca: [0.12, 0.16], valla: [0.2, 0.2] }[type];
    obstacles.push({ type, x: W + 20, w: u * dims[0], h: u * dims[1] });
    // A veces una lata encima o en el aire
    if (Math.random() < 0.55) {
      const gold = Math.random() < 0.12;
      pickups.push({ gold, x: W + 20 + u * dims[0] / 2, y: ground - u * (0.38 + Math.random() * 0.22), r: u * 0.035, t: 0 });
    }
    const gapTime = Math.max(0.62, 1.35 - elapsed * 0.012) * (0.85 + Math.random() * 0.7);
    nextObstacle = gapTime;
  };

  const spawnTag = () => {
    tags.push({
      text: TAGS[Math.floor(Math.random() * TAGS.length)],
      x: W + Math.random() * W * 0.5,
      y: ground * (0.25 + Math.random() * 0.45),
      size: unit() * (0.06 + Math.random() * 0.06),
      rot: (Math.random() - 0.5) * 0.3,
      red: Math.random() < 0.35,
    });
  };
  for (let i = 0; i < 3; i++) {
    spawnTag();
    tags[i].x = Math.random() * W;
  }

  // ---------- Dibujo ----------
  const drawWall = () => {
    // muro de ladrillo
    ctx.fillStyle = '#151515';
    ctx.fillRect(0, 0, W, ground);
    const bh = unit() * 0.06;
    const bw = bh * 2.4;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const off = wallOffset % (bw * 2);
    for (let row = 0, y = ground; y > -bh; row++, y -= bh) {
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
    // tags de graffiti
    tags.forEach((t) => {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rot);
      ctx.font = `900 ${t.size}px "Arial Black", Arial, sans-serif`;
      ctx.fillStyle = t.red ? 'rgba(227,21,26,0.55)' : 'rgba(255,255,255,0.13)';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, 0, 0);
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    });
    // calle
    ctx.fillStyle = '#0c0c0c';
    ctx.fillRect(0, ground, W, H - ground);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(0, ground, W, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    const dash = unit() * 0.12;
    for (let x = -(wallOffset * 2.5) % (dash * 2); x < W; x += dash * 2) {
      ctx.fillRect(x, ground + (H - ground) * 0.55, dash, 3);
    }
  };

  const drawObstacle = (o) => {
    const { x, w, h, type } = o;
    const y = ground - h;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0a0a0a';
    if (type === 'cono') {
      ctx.fillStyle = '#f4f4f4';
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, ground);
      ctx.lineTo(x, ground);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e3151a';
      ctx.fillRect(x + w * 0.28, y + h * 0.4, w * 0.44, h * 0.16);
      ctx.fillRect(x - w * 0.1, ground - h * 0.08, w * 1.2, h * 0.08);
    } else if (type === 'caneca') {
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.roundRect(x, y + h * 0.1, w, h * 0.9, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#555';
      ctx.fillRect(x - w * 0.06, y, w * 1.12, h * 0.14);
      ctx.strokeRect(x - w * 0.06, y, w * 1.12, h * 0.14);
      ctx.fillStyle = '#e3151a';
      ctx.font = `900 ${h * 0.3}px "Arial Black", Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('S', x + w / 2, y + h * 0.7);
      ctx.textAlign = 'start';
    } else {
      // valla de obra a rayas
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(x + w * 0.08, y + h * 0.4, w * 0.08, h * 0.6);
      ctx.fillRect(x + w * 0.84, y + h * 0.4, w * 0.08, h * 0.6);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h * 0.42);
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = '#e3151a';
      for (let i = -h; i < w + h; i += h * 0.3) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + h * 0.15, y);
        ctx.lineTo(x + i + h * 0.15 - h * 0.42, y + h * 0.42);
        ctx.lineTo(x + i - h * 0.42, y + h * 0.42);
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeRect(x, y, w, h * 0.42);
    }
  };

  const drawPickup = (p) => {
    const bob = Math.sin(p.t * 5) * p.r * 0.4;
    const w = p.r * 1.3;
    const h = p.r * 2.6;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.rotate(Math.sin(p.t * 3) * 0.2);
    if (p.gold) {
      ctx.shadowColor = 'rgba(242,193,78,0.8)';
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = p.gold ? '#f2c14e' : '#f4f4f4';
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2 + h * 0.15, w, h * 0.85, w * 0.25);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = p.gold ? '#0a0a0a' : '#e3151a';
    ctx.fillRect(-w / 2 + 2, -h / 2 + h * 0.45, w - 4, h * 0.14);
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(-w * 0.32, -h / 2, w * 0.64, h * 0.16);
    ctx.restore();
  };

  const drawPlayer = (now) => {
    const hit = now < player.hitUntil;
    if (hit && Math.floor(now / 90) % 2) return; // parpadea cuando lo golpean
    const img = hit ? sprites.hit : player.y < 0 ? sprites.air : sprites.run;
    if (!img.complete) return;
    const px = W * 0.16;
    const onGround = player.y === 0;
    const bob = onGround ? Math.abs(Math.sin(player.step)) * player.h * 0.06 : 0;
    const tilt = onGround ? 0.1 + Math.sin(player.step * 2) * 0.04 : Math.max(-0.3, Math.min(0.3, player.vy / (unit() * 8)));
    // sombra
    const shadow = Math.max(0.3, 1 + player.y / (unit() * 0.8));
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(px, ground + 2, player.w * 0.4 * shadow, player.w * 0.08 * shadow, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(px, ground + player.y - bob);
    ctx.rotate(tilt);
    const squash = onGround ? 1 - Math.abs(Math.sin(player.step)) * 0.04 : 1.05;
    ctx.scale(1 / squash, squash);
    ctx.drawImage(img, -player.w / 2, -player.h, player.w, player.h);
    ctx.restore();
  };

  // ---------- Bucle ----------
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;
    size();
    const u = unit();
    const v = speed();

    // física del salto (mantener = más alto)
    const gravity = u * (player.holding && player.vy < 0 ? 5.2 : 9);
    player.vy += gravity * dt;
    player.y += player.vy * dt;
    if (player.y >= 0) {
      if (player.jumps) player.step = 0;
      player.y = 0;
      player.vy = 0;
      player.jumps = 0;
    }
    if (player.y === 0) player.step += dt * v * 0.045;

    // mundo
    wallOffset += v * 0.35 * dt;
    distance += v * dt;
    nextObstacle -= dt;
    if (nextObstacle <= 0) spawnObstacle();
    tags.forEach((t) => (t.x -= v * 0.35 * dt));
    for (let i = tags.length - 1; i >= 0; i--) if (tags[i].x < -W) tags.splice(i, 1);
    if (tags.length < 4) spawnTag();

    // caja de Swaggy (más pequeña que el dibujo, para ser justos)
    const px = W * 0.16;
    const box = { x1: px - player.w * 0.28, x2: px + player.w * 0.28, y1: ground + player.y - player.h * 0.8, y2: ground + player.y - player.h * 0.05 };

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= v * dt;
      if (o.x + o.w < -20) {
        obstacles.splice(i, 1);
        continue;
      }
      const hitBox = o.x + o.w * 0.15 < box.x2 && o.x + o.w * 0.85 > box.x1 && ground - o.h * 0.85 < box.y2;
      if (hitBox && now > player.hitUntil && !o.hit) {
        o.hit = true;
        lives -= 1;
        flash = 1;
        player.hitUntil = now + 1300;
        sound.play('error');
        onLives?.(lives);
        if (lives <= 0) return end();
      }
    }

    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.x -= v * dt;
      p.t += dt;
      if (p.x < -40) {
        pickups.splice(i, 1);
        continue;
      }
      if (p.x > box.x1 && p.x < box.x2 && p.y > box.y1 - p.r && p.y < box.y2) {
        pickups.splice(i, 1);
        const pts = p.gold ? 15 : 5;
        bonus += pts;
        sound.play(p.gold ? 'success' : 'tick');
        popups.push({ text: `+${pts}`, x: p.x, y: p.y, t: 0, gold: p.gold });
      }
    }

    const nextScore = Math.floor(distance / (u * 0.25)) + bonus;
    if (nextScore !== score) {
      score = nextScore;
      onScore?.(score);
    }

    // dibujo
    ctx.clearRect(0, 0, W, H);
    drawWall();
    obstacles.forEach(drawObstacle);
    pickups.forEach(drawPickup);
    drawPlayer(now);
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.t += dt;
      ctx.globalAlpha = Math.max(0, 1 - p.t);
      ctx.fillStyle = p.gold ? '#f2c14e' : '#f4f4f4';
      ctx.font = `900 ${u * 0.06}px "Arial Black", Arial`;
      ctx.fillText(p.text, p.x, p.y - p.t * 50);
      ctx.globalAlpha = 1;
      if (p.t > 1) popups.splice(i, 1);
    }
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
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', release);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('visibilitychange', onVisibility);
  };

  function end() {
    cleanup();
    onEnd?.(score);
  }

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

  nextObstacle = 1.4;
  onScore?.(0);
  onLives?.(lives);
  raf = requestAnimationFrame(frame);

  return { stop: cleanup };
}
