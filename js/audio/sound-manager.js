import { SOUNDS, AUDIO } from '../config.js';
import { RECIPES, startAmbientPad } from './synth.js';
import { storage } from '../utils/storage.js';
import { bus } from '../core/bus.js';

/**
 * Gestor de sonido
 * -------------------------------------------------------------
 * - Carga los archivos definidos en config.js (o usa el sintetizador).
 * - Dos canales con volumen independiente: efectos (sfx) y música.
 * - Activa el audio tras la primera interacción (requisito del navegador).
 * - Sonidos declarativos en el HTML:
 *     data-sfx="click"          → suena al hacer clic
 *     data-sfx-hover="hover"    → suena al pasar el mouse
 */

let ctx = null;
let sfxBus = null;
let musicBus = null;
const buffers = new Map();
const lastPlayed = new Map();
let stopAmbient = null;
let ambientSource = null;

const state = {
  sfxOn: storage.get('sfxOn', true),
  musicOn: storage.get('musicOn', false),
};

const MIN_GAP = { hover: 45, tick: 30 };

function ensureContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();

  const compressor = ctx.createDynamicsCompressor();
  compressor.connect(ctx.destination);

  sfxBus = ctx.createGain();
  musicBus = ctx.createGain();
  sfxBus.gain.value = state.sfxOn ? AUDIO.sfxVolume : 0;
  musicBus.gain.value = AUDIO.musicVolume;
  sfxBus.connect(compressor);
  musicBus.connect(compressor);

  preload();
  return ctx;
}

async function loadBuffer(name, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.arrayBuffer();
    buffers.set(name, await ctx.decodeAudioData(data));
  } catch (err) {
    console.warn(`[sonido] No se pudo cargar "${url}", se usará el sintetizador.`, err);
  }
}

function preload() {
  Object.entries(SOUNDS).forEach(([name, url]) => {
    if (url && name !== 'ambient') loadBuffer(name, url);
  });
}

function playBuffer(buffer, out, { rate = 1, volume = 1, loop = false } = {}) {
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  src.loop = loop;
  src.playbackRate.value = rate;
  gain.gain.value = volume;
  src.connect(gain).connect(out);
  src.start();
  return src;
}

function emitState() {
  bus.emit('sound:change', { ...state });
}

export const sound = {
  /** Debe llamarse desde un gesto del usuario (clic/tecla). */
  async unlock() {
    if (!ensureContext()) return;
    if (ctx.state === 'suspended') await ctx.resume();
    if (state.musicOn) this.startMusic();
  },

  play(name, options = {}) {
    if (!ctx || !state.sfxOn || ctx.state !== 'running') return;

    const now = performance.now();
    if (MIN_GAP[name] && now - (lastPlayed.get(name) || 0) < MIN_GAP[name]) return;
    lastPlayed.set(name, now);

    const buffer = buffers.get(name);
    if (buffer) {
      // Afinación por índice para las notas del logo cuando se usa archivo
      const rate = options.index != null ? 2 ** ((options.index * 2) / 12) : options.rate ?? 1;
      playBuffer(buffer, sfxBus, { rate });
      return;
    }
    RECIPES[name]?.(ctx, sfxBus, options);
  },

  get state() {
    return { ...state };
  },

  setSfx(on) {
    state.sfxOn = on;
    storage.set('sfxOn', on);
    if (sfxBus) sfxBus.gain.setTargetAtTime(on ? AUDIO.sfxVolume : 0, ctx.currentTime, 0.05);
    emitState();
  },

  toggleSfx() {
    this.setSfx(!state.sfxOn);
  },

  async startMusic() {
    if (!ensureContext() || stopAmbient) return;
    state.musicOn = true;
    storage.set('musicOn', true);
    emitState();

    if (SOUNDS.ambient) {
      if (!buffers.has('ambient')) await loadBuffer('ambient', SOUNDS.ambient);
      const buffer = buffers.get('ambient');
      if (buffer && state.musicOn && !stopAmbient) {
        const fade = ctx.createGain();
        fade.gain.setValueAtTime(0.0001, ctx.currentTime);
        fade.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 2);
        fade.connect(musicBus);
        ambientSource = playBuffer(buffer, fade, { loop: true });
        stopAmbient = () => {
          const t = ctx.currentTime;
          fade.gain.setValueAtTime(fade.gain.value, t);
          fade.gain.exponentialRampToValueAtTime(0.0001, t + 1);
          const src = ambientSource;
          setTimeout(() => src.stop(), 1100);
        };
        return;
      }
    }
    stopAmbient = startAmbientPad(ctx, musicBus);
  },

  stopMusic() {
    state.musicOn = false;
    storage.set('musicOn', false);
    stopAmbient?.();
    stopAmbient = null;
    emitState();
  },

  toggleMusic() {
    if (state.musicOn) this.stopMusic();
    else this.unlock().then(() => this.startMusic());
  },

  /** Conecta los atributos data-sfx / data-sfx-hover de todo el documento. */
  bindDeclarative(root = document) {
    root.addEventListener('click', (event) => {
      const el = event.target.closest('[data-sfx]');
      if (el) this.play(el.dataset.sfx);
    });
    root.addEventListener('pointerover', (event) => {
      if (event.pointerType !== 'mouse') return;
      const el = event.target.closest('[data-sfx-hover]');
      if (!el || el.contains(event.relatedTarget)) return;
      this.play(el.dataset.sfxHover, { rate: 0.9 + Math.random() * 0.2 });
    });
  },
};
