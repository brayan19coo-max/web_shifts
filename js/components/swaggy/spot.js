import { html, escapeHtml, lockScroll, trapFocus } from '../../utils/dom.js';
import { storage } from '../../utils/storage.js';
import { BRAND, SWAGGY } from '../../config.js';
import { sound } from '../../audio/sound-manager.js';
import { swaggySvg } from './art.js';
import { startCatchGame } from './games/catch-can.js';

/**
 * El parche de Swaggy
 * -------------------------------------------------------------
 * - Botón flotante con Swaggy asomándose (abajo a la izquierda).
 * - Al abrirlo: Swaggy reacciona si lo tocas, lo acaricias (pasar el
 *   dedo/mouse por encima) o lo tocas demasiado; se duerme si lo ignoras.
 * - Siempre está vivo: respira, mueve la cola, sigue el cursor con la
 *   cabeza y cada tanto hace algo por su cuenta (bailar, saludar, subirse
 *   los lentes, mirar a los lados, dar una vuelta…).
 * - Arcade con los mini juegos (por ahora "Atrapa la lata").
 * - Récords guardados en el navegador de cada persona.
 */
const KEY = 'swaggy';
const pick = (list = []) => list[Math.floor(Math.random() * list.length)] || '';
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v) => Math.max(-1, Math.min(1, v));

// Cuánto dura cada acción (ms)
const ACTIONS = { look: 2200, glasses: 1900, wave: 1700, dance: 2600, flip: 950, spin: 900, jump: 600, stretch: 1800, purr: 1400 };

/** Hace que Swaggy haga una acción un momento. */
function doAction(svg, name, ms = ACTIONS[name] || 1200) {
  if (!svg) return;
  clearTimeout(svg._actionTimer);
  delete svg.dataset.action;
  void svg.getBoundingClientRect();
  svg.dataset.action = name;
  svg._actionTimer = setTimeout(() => delete svg.dataset.action, ms);
}

/** La cabeza (y los ojos) siguen al puntero. */
function lookAt(svg, x, y) {
  if (!svg || svg.dataset.mood === 'sleepy') return;
  const r = svg.getBoundingClientRect();
  if (!r.width) return;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height * 0.33;
  svg.style.setProperty('--lx', clamp((x - cx) / 320).toFixed(3));
  svg.style.setProperty('--ly', clamp((y - cy) / 320).toFixed(3));
}

export function initSwaggy() {
  const data = storage.get(KEY, { lastVisit: 0, best: {} });
  const phrases = SWAGGY.phrases || {};

  // ---------- Botón flotante ----------
  const launcher = html(`
    <button type="button" class="swaggy-launcher" aria-label="Abrir ${escapeHtml(SWAGGY.spotName)}" data-cursor="Parche">
      <span class="swaggy-launcher__peek">${swaggySvg('chill', { rig: true })}</span>
      <span class="swaggy-launcher__bubble" aria-hidden="true"></span>
    </button>`);
  document.body.append(launcher);
  const launcherBubble = launcher.querySelector('.swaggy-launcher__bubble');
  const launcherSvg = launcher.querySelector('svg');

  // Te sigue con la mirada por toda la página
  let lookFrame = 0;
  let lastPointer = null;
  window.addEventListener(
    'pointermove',
    (event) => {
      lastPointer = { x: event.clientX, y: event.clientY };
      if (lookFrame) return;
      lookFrame = requestAnimationFrame(() => {
        lookFrame = 0;
        if (overlay) lookAt(overlay.querySelector('[data-swaggy] svg'), lastPointer.x, lastPointer.y);
        else lookAt(launcherSvg, lastPointer.x, lastPointer.y);
      });
    },
    { passive: true },
  );

  // Cada tanto hace algo desde su esquina
  const launcherLoop = () => {
    if (!overlay && !document.hidden && document.documentElement.classList.contains('is-entered')) {
      doAction(launcherSvg, pick(['glasses', 'look', 'jump', 'glasses', 'spin']));
    }
    setTimeout(launcherLoop, rand(6000, 11000));
  };
  setTimeout(launcherLoop, 5000);

  // Invitación una vez por visita, un rato después de entrar
  setTimeout(() => {
    if (overlay) return;
    launcherBubble.textContent = pick(phrases.invite);
    launcher.classList.add('is-talking');
    launcherSvg.dataset.mood = 'happy';
    doAction(launcherSvg, 'jump');
    setTimeout(() => {
      launcher.classList.remove('is-talking');
      launcherSvg.dataset.mood = 'chill';
    }, 5000);
  }, 9000);

  launcher.addEventListener('click', () => open());

  // ---------- El parche ----------
  let overlay = null;
  let game = null;
  let onKey = null;
  let returnFocus = null;

  function open() {
    if (overlay) return;
    returnFocus = document.activeElement;
    const best = data.best?.catch || 0;
    overlay = html(`
      <div class="parche" role="dialog" aria-modal="true" aria-label="${escapeHtml(SWAGGY.spotName)}">
        <div class="parche__top">
          <p class="parche__title">${escapeHtml(SWAGGY.spotName).replace(escapeHtml(SWAGGY.name), `<em>${escapeHtml(SWAGGY.name)}</em>`)}</p>
          <button type="button" class="icon-btn parche__close" data-parche-close aria-label="Cerrar">✕</button>
        </div>

        <div class="parche__home">
          <section class="parche__stage">
            <p class="parche__bubble" aria-live="polite"></p>
            <button type="button" class="parche__swaggy" data-swaggy aria-label="Tocar a ${escapeHtml(SWAGGY.name)}" data-cursor="Tócalo">
              ${swaggySvg('chill', { rig: true })}
            </button>
            <p class="parche__hint"><span class="only-mouse">Hazle clic o pásale el mouse</span><span class="only-touch">Tócalo o pásale el dedo</span> 🦦</p>
          </section>

          <section class="arcade" aria-label="Arcade">
            <p class="arcade__title">Arcade</p>
            <ul class="arcade__list">
              <li>
                <button type="button" class="arcade__game" data-game="catch">
                  <span class="arcade__icon" aria-hidden="true">🎨</span>
                  <span class="arcade__info"><strong>Atrapa la lata</strong><small>Récord: <b data-best>${best}</b></small></span>
                  <span class="arcade__play">Jugar →</span>
                </button>
              </li>
              <li class="arcade__game is-soon"><span class="arcade__icon" aria-hidden="true">🏃</span><span class="arcade__info"><strong>Escape del muro</strong><small>Próximamente</small></span></li>
              <li class="arcade__game is-soon"><span class="arcade__icon" aria-hidden="true">🧠</span><span class="arcade__info"><strong>Memoria Saint Mode</strong><small>Próximamente</small></span></li>
            </ul>
          </section>
        </div>

        <div class="game" hidden>
          <div class="game__hud">
            <span>Puntos <b data-score>0</b></span>
            <span class="game__lives" data-lives aria-label="Vidas"></span>
            <button type="button" class="game__exit" data-game-exit>Salir</button>
          </div>
          <canvas class="game__canvas" aria-label="Juego Atrapa la lata"></canvas>
          <div class="game__panel" data-game-intro>
            <p class="game__name">Atrapa la lata</p>
            <p><span class="only-mouse">Mueve el mouse</span><span class="only-touch">Arrastra el dedo</span> (o usa ← →) para mover a Swaggy.</p>
            <ul class="game__rules">
              <li><span class="can can--white"></span> Lata blanca: +1</li>
              <li><span class="can can--gold"></span> Lata dorada: +5</li>
              <li><span class="can can--bad"></span> Lata negra con X: pierdes una vida</li>
            </ul>
            <button type="button" class="btn btn--accent" data-game-start><span>¡Dale!</span><span class="btn__arrow">→</span></button>
          </div>
          <div class="game__panel" data-game-over hidden></div>
        </div>
      </div>`);
    document.body.append(overlay);
    lockScroll('parche', true);
    launcher.classList.add('is-hidden');
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    sound.play('open');
    overlay.querySelector('[data-parche-close]').focus({ preventScroll: true });

    bindStage();
    bindGame();

    // Saludo (distinto si volvió después de 2 días o más)
    const away = Date.now() - (data.lastVisit || 0);
    const firstTime = !data.lastVisit;
    data.lastVisit = Date.now();
    storage.set(KEY, data);
    const isBack = away > 2 * 86400000 && !firstTime;
    setTimeout(() => react(isBack ? 'party' : 'happy', pick(isBack ? phrases.back : phrases.greet), 3200, isBack ? 'dance' : 'wave'), 350);
    scheduleIdleAction();
  }

  function close() {
    if (!overlay) return;
    game?.stop();
    game = null;
    clearTimeout(idleTimer);
    clearTimeout(actionTimer);
    document.removeEventListener('keydown', onKey);
    const el = overlay;
    overlay = null;
    el.classList.remove('is-open');
    lockScroll('parche', false);
    launcher.classList.remove('is-hidden');
    sound.play('close');
    setTimeout(() => el.remove(), 350);
    returnFocus?.focus?.({ preventScroll: true });
  }

  // ---------- Swaggy: reacciones ----------
  let moodTimer = 0;
  let bubbleTimer = 0;
  let idleTimer = 0;
  let actionTimer = 0;
  let busyUntil = 0;

  const stageSvg = () => overlay?.querySelector('[data-swaggy] svg');

  function setMood(mood) {
    const btn = overlay?.querySelector('[data-swaggy]');
    const svg = stageSvg();
    if (!btn || !svg) return;
    svg.dataset.mood = mood;
    btn.dataset.mood = mood;
    if (mood === 'sleepy') {
      svg.style.setProperty('--lx', '0');
      svg.style.setProperty('--ly', '0');
    }
  }

  function act(name, ms) {
    const svg = stageSvg();
    if (!svg) return;
    const time = ms || ACTIONS[name] || 1200;
    busyUntil = Date.now() + time;
    doAction(svg, name, time);
  }

  // Cuando nadie lo toca, hace cosas por su cuenta
  function scheduleIdleAction() {
    clearTimeout(actionTimer);
    actionTimer = setTimeout(() => {
      const svg = stageSvg();
      const home = overlay?.querySelector('.parche__home');
      if (svg && !home?.hidden && svg.dataset.mood === 'chill' && Date.now() > busyUntil && !document.hidden) {
        const name = pick(['look', 'glasses', 'wave', 'dance', 'spin', 'jump', 'stretch', 'look', 'glasses', 'dance']);
        act(name);
        if (Math.random() < 0.45) {
          const own = { glasses: phrases.glasses, dance: phrases.dance, stretch: phrases.stretch };
          say(pick(own[name]?.length && Math.random() < 0.6 ? own[name] : phrases.idle), 2800);
        }
      }
      scheduleIdleAction();
    }, rand(3500, 7000));
  }

  function say(text, ms = 2600) {
    const bubble = overlay?.querySelector('.parche__bubble');
    if (!bubble || !text) return;
    bubble.textContent = text;
    bubble.classList.add('is-visible');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('is-visible'), ms);
  }

  function react(mood, text, ms = 1400, action = '') {
    setMood(mood);
    say(text, Math.max(ms, 2200));
    const btn = overlay?.querySelector('[data-swaggy]');
    if (btn) {
      btn.classList.remove('is-bounce', 'is-shake');
      void btn.offsetWidth;
      if (mood === 'annoyed') btn.classList.add('is-shake');
      else if (!action) btn.classList.add('is-bounce');
    }
    if (action) act(action, Math.max(ACTIONS[action] || 0, action === 'dance' || action === 'wave' ? ms : 0));
    else busyUntil = Date.now() + ms;
    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => setMood('chill'), ms);
    resetIdle();
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      setMood('sleepy');
      say(pick(phrases.sleepy), 4000);
    }, 25000);
  }

  function bindStage() {
    const btn = overlay.querySelector('[data-swaggy]');
    let taps = [];
    let petDistance = 0;
    let lastPoint = null;
    let lastPet = 0;
    let annoyedUntil = 0;

    btn.addEventListener('click', () => {
      const now = Date.now();
      // Si estaba dormido, se despierta estirándose
      if (btn.dataset.mood === 'sleepy') {
        sound.play('whoosh');
        react('happy', pick(phrases.wake), 1800, 'stretch');
        return;
      }
      // Si está molesto, sigue molesto un rato aunque lo sigas tocando
      if (now < annoyedUntil) {
        react('annoyed', pick(phrases.annoyed), 1800);
        annoyedUntil = now + 1500;
        return;
      }
      taps = taps.filter((t) => now - t < 3000);
      taps.push(now);
      if (taps.length >= 6) {
        taps = [];
        annoyedUntil = now + 2000;
        sound.play('error');
        react('annoyed', pick(phrases.annoyed), 1800);
      } else {
        sound.play('note', { index: Math.floor(Math.random() * 8) });
        const party = Math.random() < 0.25;
        react(party ? 'party' : 'happy', pick(phrases.tap), party ? 2200 : 1500, party ? 'dance' : pick(['jump', 'jump', 'flip', 'spin', 'wave']));
      }
    });

    // Acariciar: mover el mouse o el dedo por encima un buen rato
    btn.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'mouse' || event.buttons || event.pressure > 0) {
        if (lastPoint) petDistance += Math.hypot(event.clientX - lastPoint.x, event.clientY - lastPoint.y);
        lastPoint = { x: event.clientX, y: event.clientY };
        if (petDistance > 700 && Date.now() - lastPet > 2500) {
          petDistance = 0;
          lastPet = Date.now();
          sound.play('success');
          react('happy', pick(phrases.pet), 1800, 'purr');
          hearts(btn);
        }
      }
    });
    btn.addEventListener('pointerleave', () => {
      lastPoint = null;
      petDistance = Math.max(0, petDistance - 200);
    });
  }

  function hearts(btn) {
    for (let i = 0; i < 5; i++) {
      const h = document.createElement('span');
      h.className = 'parche__heart';
      h.textContent = '♥';
      h.style.left = `${30 + Math.random() * 40}%`;
      h.style.animationDelay = `${i * 90}ms`;
      btn.append(h);
      setTimeout(() => h.remove(), 1400);
    }
  }

  // ---------- Juego ----------
  function bindGame() {
    const home = overlay.querySelector('.parche__home');
    const view = overlay.querySelector('.game');
    const canvas = overlay.querySelector('.game__canvas');
    const intro = overlay.querySelector('[data-game-intro]');
    const over = overlay.querySelector('[data-game-over]');
    const scoreEl = overlay.querySelector('[data-score]');
    const livesEl = overlay.querySelector('[data-lives]');

    const showHome = () => {
      game?.stop();
      game = null;
      view.hidden = true;
      home.hidden = false;
      overlay.classList.remove('is-playing');
      const best = overlay.querySelector('[data-best]');
      if (best) best.textContent = data.best?.catch || 0;
      react('happy', pick(phrases.home), 1600, 'wave');
    };

    const play = () => {
      intro.hidden = true;
      over.hidden = true;
      game?.stop();
      game = startCatchGame(canvas, {
        onScore: (s) => (scoreEl.textContent = s),
        onLives: (l) => (livesEl.textContent = '❤'.repeat(Math.max(0, l)) + '♡'.repeat(Math.max(0, 3 - l))),
        onEnd: finish,
      });
    };

    function finish(score) {
      game = null;
      const prev = data.best?.catch || 0;
      const record = score > prev;
      if (record) {
        data.best = { ...data.best, catch: score };
        storage.set(KEY, data);
      }
      sound.play(record ? 'unlock' : 'close');
      const prize = SWAGGY.prize && score >= SWAGGY.prize.minScore ? SWAGGY.prize : null;
      const claim = prize && BRAND.whatsapp
        ? `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
            `¡Hola ${BRAND.name}! Swaggy me dio un premio en "Atrapa la lata": hice ${score} puntos 🦦`,
          )}`
        : '';
      over.innerHTML = `
        <div class="game__over-swaggy">${swaggySvg(record ? 'party' : 'annoyed', { rig: true })}</div>
        <p class="game__name">${score} puntos</p>
        <p class="game__msg">${escapeHtml(pick(record ? phrases.record : phrases.gameOver))}</p>
        <p class="game__best">Tu récord: <b>${Math.max(score, prev)}</b></p>
        ${prize ? `<div class="game__prize"><p>🎁 Ganaste: <strong>${escapeHtml(prize.text)}</strong></p>
          ${claim ? `<a class="btn btn--crew" href="${claim}" target="_blank" rel="noopener"><span>Reclamar por WhatsApp</span><span class="btn__arrow">→</span></a>` : ''}</div>` : ''}
        <div class="game__actions">
          <button type="button" class="btn btn--accent" data-game-again><span>Jugar de nuevo</span></button>
          <button type="button" class="btn btn--ghost" data-game-home>Volver al parche</button>
        </div>`;
      over.hidden = false;
    }

    overlay.querySelector('[data-game="catch"]').addEventListener('click', () => {
      sound.play('whoosh');
      clearTimeout(idleTimer);
      home.hidden = true;
      view.hidden = false;
      overlay.classList.add('is-playing');
      intro.hidden = false;
      over.hidden = true;
      scoreEl.textContent = '0';
      livesEl.textContent = '❤❤❤';
      intro.querySelector('[data-game-start]').focus({ preventScroll: true });
    });
    intro.querySelector('[data-game-start]').addEventListener('click', play);
    over.addEventListener('click', (event) => {
      if (event.target.closest('[data-game-again]')) play();
      if (event.target.closest('[data-game-home]')) showHome();
    });
    overlay.querySelector('[data-game-exit]').addEventListener('click', showHome);
    overlay.querySelector('[data-parche-close]').addEventListener('click', close);

    onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        if (!view.hidden) showHome();
        else close();
      }
      if (event.key === 'Tab') trapFocus(event, overlay);
    };
    document.addEventListener('keydown', onKey);
  }
}
