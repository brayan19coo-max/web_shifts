import { sound } from '../../../audio/sound-manager.js';

/**
 * Música de los mini juegos (hecha con código, sin archivos)
 * -------------------------------------------------------------
 * Un secuenciador de 16 pasos con batería, bajo, acordes y melodía
 * sintetizados. Cada estilo tiene su tempo y sus patrones, y la música
 * se va llenando con el nivel (setLevel): 0 = solo batería y bajo,
 * 1 = + acordes, 2 = + melodía, 3 = + percusión extra.
 *
 * Estilos:  'calle' (boom bap relajado) · 'rapido' (electro/trap) ·
 *           'tension' (sigiloso) · 'manual' (lo maneja el juego: Ritmo)
 *
 * Cuando estén los archivos de música (assets/sounds/juegos/), se pueden
 * usar en vez de esto.
 */
const STYLES = {
  calle: {
    bpm: 90,
    swing: 0.14,
    kick: 'x.....x...x.....',
    snare: '....x.......x...',
    hat: 'x.x.x.x.x.x.x.x.',
    hat2: '.x.x.x.x.x.x.x.x',
    bass: [0, null, null, null, null, null, 0, null, null, null, 7, null, null, null, 5, null],
    chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], // Am F C G
    root: [45, 41, 36, 43],
    lead: 'soft',
  },
  rapido: {
    bpm: 128,
    swing: 0,
    kick: 'x...x...x...x...',
    snare: '....x.......x..x',
    hat: '..x...x...x...x.',
    hat2: 'xxxxxxxxxxxxxxxx',
    bass: [0, null, 0, null, 0, null, 0, 12, 0, null, 0, null, 0, null, 10, 12],
    chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]], // Am G F Em
    root: [45, 43, 41, 40],
    lead: 'pluck',
  },
  tension: {
    bpm: 100,
    swing: 0.06,
    kick: 'x.......x.x.....',
    snare: '........x.......',
    hat: '..x...x...x...x.',
    hat2: 'x.xxx.xxx.xxx.xx',
    bass: [0, null, null, 0, null, null, 1, null, 0, null, null, 0, null, null, 3, null],
    chords: [[57, 60, 64], [57, 60, 65], [56, 59, 64], [57, 60, 64]], // Am Am(b6) E Am
    root: [45, 45, 44, 45],
    lead: 'none',
  },
};
const PENTA = [0, 3, 5, 7, 10, 12, 15];
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

let noiseBuf = null;
function noise(ctx) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

// ---------- Instrumentos ----------
function env(ctx, out, t, peak, attack, decay) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(out);
  return g;
}

const INST = {
  kick(ctx, out, t, v = 1) {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    o.connect(env(ctx, out, t, 0.9 * v, 0.004, 0.28));
    o.start(t);
    o.stop(t + 0.32);
  },
  snare(ctx, out, t, v = 1) {
    const n = ctx.createBufferSource();
    n.buffer = noise(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1500;
    n.connect(f).connect(env(ctx, out, t, 0.45 * v, 0.002, 0.16));
    n.start(t);
    n.stop(t + 0.2);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    o.connect(env(ctx, out, t, 0.25 * v, 0.002, 0.08));
    o.start(t);
    o.stop(t + 0.1);
  },
  hat(ctx, out, t, v = 1, open = false) {
    const n = ctx.createBufferSource();
    n.buffer = noise(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7500;
    n.connect(f).connect(env(ctx, out, t, 0.13 * v, 0.001, open ? 0.18 : 0.04));
    n.start(t);
    n.stop(t + 0.22);
  },
  bass(ctx, out, t, midi, dur, v = 1) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = hz(midi);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(160, t + dur);
    o.connect(f).connect(env(ctx, out, t, 0.32 * v, 0.008, dur));
    o.start(t);
    o.stop(t + dur + 0.05);
  },
  chord(ctx, out, t, notes, dur, v = 1) {
    notes.forEach((m) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = hz(m);
      o.detune.value = (Math.random() - 0.5) * 8;
      o.connect(env(ctx, out, t, 0.07 * v, 0.02, dur));
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  },
  lead(ctx, out, t, midi, dur, kind = 'pluck', v = 1) {
    const o = ctx.createOscillator();
    o.type = kind === 'soft' ? 'sine' : 'square';
    o.frequency.value = hz(midi);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = kind === 'soft' ? 2400 : 3200;
    o.connect(f).connect(env(ctx, out, t, (kind === 'soft' ? 0.12 : 0.06) * v, 0.005, dur));
    o.start(t);
    o.stop(t + dur + 0.05);
  },
};

/**
 * Crea la música de un juego.
 * @returns {{ start(), stop(), setLevel(n), setBpm(b), scheduleBeat(t, i, len), get ctx(), now() }}
 */
export function createMusic(styleName = 'calle', { level = 1 } = {}) {
  const style = STYLES[styleName] || STYLES.calle;
  let audio = null;
  let out = null;
  let timer = 0;
  let step = 0;
  let nextTime = 0;
  let bpm = style.bpm;
  let lvl = level;
  // melodía de 2 compases que se repite (cambia en cada partida)
  const phrase = Array.from({ length: 32 }, (_, i) => (Math.random() < (i % 4 === 0 ? 0.7 : 0.3) ? PENTA[Math.floor(Math.random() * PENTA.length)] : null));

  const hit = (pattern, i) => pattern && pattern[i % 16] === 'x';

  // programa un paso de 16avo en el tiempo t
  const playStep = (i, t, stepLen) => {
    const ctx = audio.ctx;
    const bar = Math.floor(i / 16) % 4;
    const s = i % 16;
    if (hit(style.kick, s)) INST.kick(ctx, out, t);
    if (lvl >= 1 && hit(style.snare, s)) INST.snare(ctx, out, t);
    if (hit(style.hat, s)) INST.hat(ctx, out, t, 1, styleName === 'calle' && s === 14);
    if (lvl >= 3 && hit(style.hat2, s)) INST.hat(ctx, out, t, 0.55);
    const b = style.bass[s];
    if (b != null) INST.bass(ctx, out, t, style.root[bar] + b, stepLen * 1.8);
    if (lvl >= 1 && (s === 0 || (styleName === 'rapido' && s === 8))) INST.chord(ctx, out, t, style.chords[bar], stepLen * (styleName === 'rapido' ? 7 : 14));
    if (lvl >= 2 && style.lead !== 'none') {
      const n = phrase[i % 32];
      if (n != null && s % 2 === 0) INST.lead(ctx, out, t, 69 + n, stepLen * 1.6, style.lead);
    }
  };

  const tick = () => {
    if (!audio) return;
    const stepLen = 60 / bpm / 4;
    while (nextTime < audio.ctx.currentTime + 0.14) {
      const swing = step % 2 ? style.swing * stepLen : 0;
      playStep(step, nextTime + swing, stepLen);
      nextTime += stepLen;
      step += 1;
    }
  };

  const connect = () => {
    audio = sound.gameAudio();
    if (!audio) return false;
    out = audio.ctx.createGain();
    out.gain.value = 1;
    out.connect(audio.out);
    sound.duckMusic(true);
    return true;
  };

  return {
    get ctx() {
      return audio?.ctx || null;
    },
    start() {
      if (audio || !connect()) return;
      if (styleName === 'manual') return; // el juego programa cada tiempo
      nextTime = audio.ctx.currentTime + 0.06;
      step = 0;
      timer = setInterval(tick, 25);
    },
    stop() {
      clearInterval(timer);
      if (out && audio) {
        const t = audio.ctx.currentTime;
        out.gain.setTargetAtTime(0.0001, t, 0.08);
        const o = out;
        setTimeout(() => o.disconnect(), 400);
      }
      audio = null;
      out = null;
      sound.duckMusic(false);
    },
    setLevel(n) {
      lvl = Math.max(0, Math.min(3, n));
    },
    setBpm(b) {
      bpm = b;
    },
    /** Modo manual (Ritmo): programa un tiempo en el reloj de audio. */
    scheduleBeat(t, i, beatLen) {
      if (!audio) return;
      const ctx = audio.ctx;
      const q = beatLen / 4;
      const bar = Math.floor(i / 4) % 4;
      const st = STYLES.rapido;
      INST.kick(ctx, out, t);
      if (i % 2 === 1) INST.snare(ctx, out, t);
      INST.hat(ctx, out, t + q * 2, 1);
      if (lvl >= 3) [1, 3].forEach((k) => INST.hat(ctx, out, t + q * k, 0.5));
      INST.bass(ctx, out, t, st.root[bar] + (i % 4 === 3 ? 12 : 0), beatLen * 0.45);
      INST.bass(ctx, out, t + q * 2, st.root[bar], beatLen * 0.4, 0.8);
      if (lvl >= 1 && i % 4 === 0) INST.chord(ctx, out, t, st.chords[bar], beatLen * 3.6);
      if (lvl >= 2) {
        const n = phrase[(i * 2) % 32];
        if (n != null) INST.lead(ctx, out, t, 69 + n, beatLen * 0.5, 'pluck');
      }
    },
    now() {
      return audio ? audio.ctx.currentTime : performance.now() / 1000;
    },
  };
}
