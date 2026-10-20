import { html, escapeHtml, lockScroll, trapFocus } from '../../utils/dom.js';
import { storage } from '../../utils/storage.js';
import { BRAND, SWAGGY } from '../../config.js';
import { sound } from '../../audio/sound-manager.js';
import { talk } from './art.js';
import { swaggy3d, mountSwaggy3d, preloadSwaggy3d, ACTION_TIME } from './sw3d.js';
import { GAMES } from './games/index.js';
import { createMusic } from './games/music.js';

/**
 * El parche de Swaggy
 * -------------------------------------------------------------
 * - Botón flotante con Swaggy asomándose (abajo a la izquierda).
 * - Al abrirlo: Swaggy reacciona si lo tocas, lo acaricias (pasar el
 *   dedo/mouse por encima) o lo tocas demasiado; se duerme si lo ignoras.
 * - Siempre está vivo: respira, mueve la cola, sigue el cursor con la
 *   cabeza y cada tanto hace algo por su cuenta (bailar, saludar, subirse
 *   los lentes, mirar a los lados, dar una vuelta…).
 * - Arcade con los mini juegos, en estilo arcade pixel art (games/pixel.js).
 * - Récords guardados en el navegador de cada persona.
 * - Si el navegador tiene WebGL, el parche es la calle 3D de Swaggy
 *   (swaggy3d.html dentro de un iframe): ahí lo tocas, le das cosas, se
 *   enoja, y en la máquina de arcade de la calle se abren los juegos.
 *   Sin WebGL queda el Swaggy dibujado de siempre.
 */
const STREET_3D = 'swaggy3d.html?embed=1';
const HAS_WEBGL = (() => {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
})();
const KEY = 'swaggy';
const pick = (list = []) => list[Math.floor(Math.random() * list.length)] || '';
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v) => Math.max(-1, Math.min(1, v));

// Cuánto dura cada acción (ms)
// Cuánto dura cada acción (ms): lo que dura su animación en 3D
const ACTIONS = { ...Object.fromEntries(Object.entries(ACTION_TIME).map(([k, v]) => [k, Math.round(v * 1000)])), dance: 2600 };

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
      <span class="swaggy-launcher__peek">${swaggy3d('chill')}</span>
      <span class="swaggy-launcher__bubble" aria-hidden="true"></span>
    </button>`);
  document.body.append(launcher);
  const launcherBubble = launcher.querySelector('.swaggy-launcher__bubble');
  const launcherSvg = mountSwaggy3d(launcher);
  preloadSwaggy3d(['quieto', 'hablar', 'risa', 'saltar', 'gafas']);

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
        if (overlay) lookAt(overlay.querySelector('[data-swaggy] .sw3d'), lastPointer.x, lastPointer.y);
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
    talk(launcherSvg, launcherBubble.textContent);
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
  let music = null;
  let onKey = null;
  let returnFocus = null;
  let onMessage = null;
  let world = null; // iframe de la calle 3D
  const use3d = HAS_WEBGL;

  /** Manda un mensaje a la calle 3D (mismo sitio). */
  const tell3d = (msg) => world?.contentWindow?.postMessage(msg, location.origin);

  function open() {
    if (overlay) return;
    returnFocus = document.activeElement;
    overlay = html(`
      <div class="parche${use3d ? ' is-3d' : ''}" role="dialog" aria-modal="true" aria-label="${escapeHtml(SWAGGY.spotName)}">
        <div class="parche__top">
          <p class="parche__title">${escapeHtml(SWAGGY.spotName).replace(escapeHtml(SWAGGY.name), `<em>${escapeHtml(SWAGGY.name)}</em>`)}</p>
          <span class="parche__top-btns">
            ${use3d ? '<button type="button" class="parche__arcade-btn" data-arcade-open aria-haspopup="dialog">▶ Arcade</button>' : ''}
            <button type="button" class="icon-btn parche__close" data-parche-close aria-label="Cerrar">✕</button>
          </span>
        </div>

        <div class="parche__home">
          ${use3d
            ? `<section class="parche__street">
            <div class="parche__loading" data-parche-loading><span class="parche__loading-dot"></span>Cargando la calle…</div>
            <iframe class="parche__iframe" src="${STREET_3D}" title="La calle de ${escapeHtml(SWAGGY.name)} en 3D: tócalo, pásale cosas y juega en la máquina de arcade" allow="autoplay; fullscreen"></iframe>
          </section>`
            : `<section class="parche__stage">
            <p class="parche__bubble" aria-live="polite"></p>
            <button type="button" class="parche__swaggy" data-swaggy aria-label="Tocar a ${escapeHtml(SWAGGY.name)}" data-cursor="Tócalo">
              ${swaggy3d('chill')}
            </button>
            <p class="parche__hint"><span class="only-mouse">Hazle clic o pásale el mouse</span><span class="only-touch">Tócalo o pásale el dedo</span> 🦦</p>
          </section>`}

          <section class="arcade" aria-label="Arcade">
            ${use3d ? '<button type="button" class="icon-btn arcade__close" data-arcade-close aria-label="Cerrar el arcade">✕</button>' : ''}
            <p class="arcade__title">Arcade</p>
            <ul class="arcade__list">
              ${GAMES.map(
                (g) => g.soon
                  ? `<li class="arcade__game is-soon"><span class="arcade__icon" aria-hidden="true">${g.icon}</span><span class="arcade__info"><strong>${escapeHtml(g.name)}</strong><small>Próximamente</small></span></li>`
                  : `<li>
                <button type="button" class="arcade__game" data-game="${g.id}">
                  <span class="arcade__icon" aria-hidden="true">${g.icon}</span>
                  <span class="arcade__info"><strong>${escapeHtml(g.name)}</strong><small>Récord: <b data-best="${g.id}">${data.best?.[g.id] || 0}</b></small></span>
                  <span class="arcade__play">Jugar →</span>
                </button>
              </li>`,
              ).join('')}
            </ul>
          </section>
        </div>

        <div class="game" hidden>
          <div class="game__hud">
            <span>Puntos <b data-score>0</b></span>
            <span class="game__lives" data-lives></span>
            <span class="game__btns">
              <button type="button" class="game__exit game__music" data-game-music aria-pressed="true" aria-label="Música del juego">♪</button>
              <button type="button" class="game__exit" data-game-exit>Salir</button>
            </span>
          </div>
          <div class="game__stage" data-game-stage></div>
          <div class="game__panel" data-game-intro></div>
          <div class="game__panel" data-game-over hidden></div>
        </div>
      </div>`);
    document.body.append(overlay);
    mountSwaggy3d(overlay);
    // en el parche 2D puede hacer de todo: precargar todas sus animaciones (en 3D no hacen falta)
    if (!use3d) preloadSwaggy3d(['saludar', 'risa', 'carcajada', 'bailar', 'rapear', 'flex', 'chocala', 'bravo', 'pataleta', 'triste', 'dormido', 'bostezo', 'gafas', 'susto', 'mirar', 'girar', 'saltar', 'cadena']);
    lockScroll('parche', true);
    launcher.classList.add('is-hidden');
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    sound.play('open');
    overlay.querySelector('[data-parche-close]').focus({ preventScroll: true });

    if (use3d) {
      bind3d();
      // la música de fondo del sitio baja: la calle 3D tiene sus propios sonidos
      sound.duckMusic(true);
      document.documentElement.classList.add('is-parche');
    } else bindStage();
    bindGame();

    // Saludo (distinto si volvió después de 2 días o más)
    const away = Date.now() - (data.lastVisit || 0);
    const firstTime = !data.lastVisit;
    data.lastVisit = Date.now();
    storage.set(KEY, { ...storage.get(KEY, {}), ...data });
    const isBack = away > 2 * 86400000 && !firstTime;
    if (use3d) return; // en 3D saluda él mismo, y se acuerda de ti
    setTimeout(() => react(isBack ? 'party' : 'happy', pick(isBack ? phrases.back : phrases.greet), 3200, isBack ? 'dance' : 'wave'), 350);
    scheduleIdleAction();
  }

  function close() {
    if (!overlay) return;
    game?.stop();
    game = null;
    music?.stop();
    music = null;
    clearTimeout(idleTimer);
    clearTimeout(actionTimer);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('message', onMessage);
    if (world) {
      sound.duckMusic(false);
      document.documentElement.classList.remove('is-parche');
    }
    world = null;
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

  const stageSvg = () => overlay?.querySelector('[data-swaggy] .sw3d');

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
        const name = pick(['look', 'glasses', 'wave', 'dance', 'rap', 'flex', 'chain', 'spin', 'jump', 'stretch', 'look', 'glasses']);
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
    if (stageSvg()?.dataset.mood !== 'sleepy') talk(stageSvg(), text);
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
        react(party ? 'party' : 'happy', pick(phrases.tap), party ? 2200 : 1500, party ? 'dance' : pick(['jump', 'surprise', 'flip', 'highfive', 'wave', 'flex']));
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

  // ---------- La calle 3D ----------
  function bind3d() {
    world = overlay.querySelector('.parche__iframe');
    world.addEventListener('load', () => {
      overlay?.querySelector('[data-parche-loading]')?.classList.add('is-done');
      // Esc también funciona cuando el foco está dentro del 3D
      try {
        world.contentWindow.document.addEventListener('keydown', (event) => onKey?.(event));
      } catch {
        /* otro origen: no pasa nada */
      }
    });
    onMessage = (event) => {
      if (event.origin !== location.origin || event.source !== world?.contentWindow) return;
      if (event.data?.type === 'swaggy:arcade') openArcade();
    };
    window.addEventListener('message', onMessage);
    overlay.querySelector('[data-arcade-open]').addEventListener('click', openArcade);
    overlay.querySelector('[data-arcade-close]').addEventListener('click', closeArcade);
  }

  function openArcade() {
    if (!overlay || overlay.classList.contains('is-arcade')) return;
    overlay.classList.add('is-arcade');
    tell3d({ type: 'swaggy:pause', paused: true }); // la calle descansa mientras juegas
    sound.play('open');
    overlay.querySelector('.arcade [data-game]')?.focus({ preventScroll: true });
  }

  function closeArcade() {
    if (!overlay?.classList.contains('is-arcade')) return;
    overlay.classList.remove('is-arcade');
    tell3d({ type: 'swaggy:pause', paused: false });
    sound.play('close');
    overlay.querySelector('[data-arcade-open]')?.focus({ preventScroll: true });
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
    const stage = overlay.querySelector('[data-game-stage]');
    const intro = overlay.querySelector('[data-game-intro]');
    const over = overlay.querySelector('[data-game-over]');
    const scoreEl = overlay.querySelector('[data-score]');
    const livesEl = overlay.querySelector('[data-lives]');
    let current = null;

    const hearts = (l) => '❤'.repeat(Math.max(0, l)) + '♡'.repeat(Math.max(0, 3 - l));

    // Prepara el lienzo (canvas) o el tablero (div) del juego
    const mountStage = () => {
      stage.innerHTML =
        current.kind === 'canvas'
          ? `<canvas class="game__canvas" aria-label="Juego ${escapeHtml(current.name)}"></canvas>`
          : '<div class="game__board"></div>';
      return stage.firstElementChild;
    };

    const stopMusic = () => {
      music?.stop();
      music = null;
    };

    const showHome = () => {
      game?.stop();
      game = null;
      stopMusic();
      view.hidden = true;
      home.hidden = false;
      overlay.classList.remove('is-playing');
      GAMES.forEach((g) => {
        const best = overlay.querySelector(`[data-best="${g.id}"]`);
        if (best) best.textContent = data.best?.[g.id] || 0;
      });
      if (use3d) overlay.querySelector('.arcade [data-game]')?.focus({ preventScroll: true });
      else react('happy', pick(phrases.home), 1600, 'wave');
    };

    const play = () => {
      intro.hidden = true;
      over.hidden = true;
      game?.stop();
      const el = mountStage();
      scoreEl.textContent = '0';
      stopMusic();
      music = current.music ? createMusic(current.music) : null;
      music?.start();
      game = current.start(el, {
        music,
        onScore: (s) => (scoreEl.textContent = s),
        onLives: (l) => {
          livesEl.textContent = hearts(l);
          livesEl.classList.remove('is-info');
          livesEl.setAttribute('aria-label', `Vidas: ${l}`);
        },
        onInfo: (text) => {
          livesEl.textContent = text;
          livesEl.classList.add('is-info');
          livesEl.removeAttribute('aria-label');
        },
        onEnd: finish,
      });
    };

    function finish(score) {
      game = null;
      stopMusic();
      const id = current.id;
      const prev = data.best?.[id] || 0;
      const record = score > prev;
      if (record) {
        data.best = { ...data.best, [id]: score };
        storage.set(KEY, { ...storage.get(KEY, {}), ...data });
      }
      // Swaggy reacciona en la calle 3D (lo ves al volver)
      tell3d({ type: 'swaggy:result', game: id, score, record });
      sound.play(record ? 'unlock' : 'close');
      const p = SWAGGY.prize;
      const prize = p && (!p.game || p.game === id) && score >= p.minScore ? p : null;
      const claim = prize && BRAND.whatsapp
        ? `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(
            `¡Hola ${BRAND.name}! Swaggy me dio un premio en "${current.name}": hice ${score} puntos 🦦`,
          )}`
        : '';
      over.innerHTML = `
        <div class="game__over-swaggy">${swaggy3d(record ? 'party' : 'annoyed')}</div>
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
      mountSwaggy3d(over);
      over.querySelector('[data-game-again]').focus({ preventScroll: true });
    }

    const openGame = (g) => {
      current = g;
      sound.play('whoosh');
      clearTimeout(idleTimer);
      home.hidden = true;
      view.hidden = false;
      view.dataset.game = g.id;
      overlay.classList.add('is-playing');
      over.hidden = true;
      scoreEl.textContent = '0';
      livesEl.textContent = g.lives === false ? '' : hearts(3);
      mountStage();
      intro.innerHTML = `
        <p class="game__name">${escapeHtml(g.name)}</p>
        <p><span class="only-mouse">${escapeHtml(g.controls.mouse)}</span><span class="only-touch">${escapeHtml(g.controls.touch)}</span></p>
        <ul class="game__rules">
          ${g.rules.map(([cls, text]) => `<li>${cls === 'rule-icon' ? '' : `<span class="${cls}"></span> `}${escapeHtml(text)}</li>`).join('')}
        </ul>
        <p class="game__best">Tu récord: <b>${data.best?.[g.id] || 0}</b></p>
        <button type="button" class="btn btn--accent" data-game-start><span>¡Dale!</span><span class="btn__arrow">→</span></button>`;
      intro.hidden = false;
      intro.querySelector('[data-game-start]').focus({ preventScroll: true });
    };

    overlay.querySelector('.arcade').addEventListener('click', (event) => {
      const btn = event.target.closest('[data-game]');
      const g = btn && GAMES.find((x) => x.id === btn.dataset.game);
      if (g) openGame(g);
    });
    intro.addEventListener('click', (event) => {
      if (event.target.closest('[data-game-start]')) play();
    });
    over.addEventListener('click', (event) => {
      if (event.target.closest('[data-game-again]')) play();
      if (event.target.closest('[data-game-home]')) showHome();
    });
    overlay.querySelector('[data-game-exit]').addEventListener('click', showHome);
    const musicBtn = overlay.querySelector('[data-game-music]');
    const paintMusic = () => {
      const on = sound.state.gameMusicOn !== false;
      musicBtn.setAttribute('aria-pressed', String(on));
      musicBtn.classList.toggle('is-off', !on);
    };
    paintMusic();
    musicBtn.addEventListener('click', () => {
      sound.setGameMusic(sound.state.gameMusicOn === false);
      paintMusic();
      // si estaba apagada al empezar, arranca ahora
      if (sound.state.gameMusicOn && current?.music && current.music !== 'manual' && game && !music) {
        music = createMusic(current.music);
        music.start();
      }
    });
    overlay.querySelector('[data-parche-close]').addEventListener('click', close);

    onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        if (!view.hidden) showHome();
        else if (overlay.classList.contains('is-arcade')) closeArcade();
        else close();
      }
      if (event.key === 'Tab') trapFocus(event, overlay);
    };
    document.addEventListener('keydown', onKey);
  }
}
