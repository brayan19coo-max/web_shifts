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
 * - Botón flotante con Swaggy 3D asomándose (abajo a la izquierda), que
 *   cada tanto hace algo y te invita a entrar.
 * - Al abrirlo se carga la escena 3D completa de Swaggy (parche/index.html,
 *   en un iframe): la calle, sus acciones, objetos, palomas, el gato…
 * - Botón 🕹️ Arcade: panel encima del 3D con los mini juegos
 *   (games/index.js). Mientras se juega, el 3D se esconde para no gastar.
 * - Récords guardados en el navegador de cada persona.
 */
const KEY = 'swaggy';
const pick = (list = []) => list[Math.floor(Math.random() * list.length)] || '';
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v) => Math.max(-1, Math.min(1, v));

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
        if (!overlay) lookAt(launcherSvg, lastPointer.x, lastPointer.y);
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

  function open() {
    if (overlay) return;
    returnFocus = document.activeElement;
    overlay = html(`
      <div class="parche parche--3d" role="dialog" aria-modal="true" aria-label="${escapeHtml(SWAGGY.spotName)}">
        <iframe class="parche__world" src="parche/index.html" title="${escapeHtml(SWAGGY.spotName)} en 3D" allow="autoplay; fullscreen"></iframe>
        <div class="parche__loading" data-parche-loading><span class="parche__loading-dot"></span>Cargando el parche…</div>
        <div class="parche__bar">
          <button type="button" class="parche__pill" data-arcade-toggle aria-expanded="false">🕹️ Arcade</button>
          <button type="button" class="parche__pill parche__close" data-parche-close aria-label="Cerrar el parche">✕</button>
        </div>

        <div class="parche__home" hidden>
          <section class="arcade" aria-label="Arcade">
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
    lockScroll('parche', true);
    // la música de fondo del sitio baja: el parche 3D tiene sus propios sonidos
    sound.duckMusic(true);
    document.documentElement.classList.add('is-parche');
    const world = overlay.querySelector('.parche__world');
    world.addEventListener('load', () => {
      overlay?.querySelector('[data-parche-loading]')?.classList.add('is-done');
      // Esc también funciona cuando el foco está dentro del 3D
      try {
        world.contentWindow.document.addEventListener('keydown', (event) => onKey?.(event));
      } catch {
        /* otro origen: no pasa nada */
      }
    });
    launcher.classList.add('is-hidden');
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    sound.play('open');
    overlay.querySelector('[data-parche-close]').focus({ preventScroll: true });

    bindGame();

    // Última visita (la usa el saludo)
    data.lastVisit = Date.now();
    storage.set(KEY, { ...storage.get(KEY, {}), ...data });
  }

  function close() {
    if (!overlay) return;
    game?.stop();
    game = null;
    music?.stop();
    music = null;
    document.removeEventListener('keydown', onKey);
    const el = overlay;
    overlay = null;
    el.classList.remove('is-open');
    lockScroll('parche', false);
    sound.duckMusic(false);
    document.documentElement.classList.remove('is-parche');
    launcher.classList.remove('is-hidden');
    sound.play('close');
    setTimeout(() => el.remove(), 350);
    returnFocus?.focus?.({ preventScroll: true });
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

    const world = overlay.querySelector('.parche__world');
    const toggle = overlay.querySelector('[data-arcade-toggle]');
    // El arcade es un panel encima del 3D
    const setArcade = (open) => {
      home.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('is-on', open);
      if (open) sound.play('open');
    };
    toggle.addEventListener('click', () => {
      if (!view.hidden) showHome();
      else setArcade(home.hidden);
    });
    home.addEventListener('click', (event) => {
      if (event.target === home) setArcade(false);
    });

    const showHome = () => {
      game?.stop();
      game = null;
      stopMusic();
      view.hidden = true;
      setArcade(true);
      overlay.classList.remove('is-playing');
      GAMES.forEach((g) => {
        const best = overlay.querySelector(`[data-best="${g.id}"]`);
        if (best) best.textContent = data.best?.[g.id] || 0;
      });
      world.style.visibility = '';
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
      home.hidden = true;
      view.hidden = false;
      view.dataset.game = g.id;
      world.style.visibility = 'hidden';
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
        else if (!home.hidden) setArcade(false);
        else close();
      }
      if (event.key === 'Tab') trapFocus(event, overlay);
    };
    document.addEventListener('keydown', onKey);
  }
}
