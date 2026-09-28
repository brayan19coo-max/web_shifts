/**
 * Sonidos sintetizados con Web Audio API.
 * Se usan cuando no hay archivo configurado en config.js → SOUNDS.
 * Cada receta recibe (ctx, destino, opciones) y agenda sus nodos.
 */

// Escala pentatónica menor (La) para las notas del logo
const PENTATONIC = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];

function tone(ctx, out, { type = 'sine', from, to = from, start = 0, duration = 0.1, volume = 0.2, attack = 0.005 }) {
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

let noiseBuffer;
function noise(ctx, out, { start = 0, duration = 0.3, volume = 0.2, filterFrom = 400, filterTo = 3000, q = 1 }) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + start;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = noiseBuffer;
  filter.type = 'bandpass';
  filter.Q.value = q;
  filter.frequency.setValueAtTime(filterFrom, t);
  filter.frequency.exponentialRampToValueAtTime(filterTo, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + duration * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(gain).connect(out);
  src.start(t);
  src.stop(t + duration + 0.02);
}

export const RECIPES = {
  hover: (ctx, out, { rate = 1 } = {}) =>
    tone(ctx, out, { from: 1400 * rate, to: 1000 * rate, duration: 0.05, volume: 0.04 }),

  click: (ctx, out) => {
    tone(ctx, out, { type: 'triangle', from: 700, to: 260, duration: 0.08, volume: 0.18 });
    noise(ctx, out, { duration: 0.03, volume: 0.05, filterFrom: 3000, filterTo: 5000 });
  },

  open: (ctx, out) => {
    tone(ctx, out, { from: 280, to: 880, duration: 0.2, volume: 0.1 });
    noise(ctx, out, { duration: 0.22, volume: 0.04, filterFrom: 500, filterTo: 4000 });
  },

  close: (ctx, out) => {
    tone(ctx, out, { from: 880, to: 260, duration: 0.18, volume: 0.09 });
    noise(ctx, out, { duration: 0.2, volume: 0.03, filterFrom: 4000, filterTo: 500 });
  },

  add: (ctx, out) => {
    tone(ctx, out, { type: 'square', from: 659.25, duration: 0.09, volume: 0.06 });
    tone(ctx, out, { type: 'square', from: 987.77, start: 0.08, duration: 0.16, volume: 0.06 });
    tone(ctx, out, { from: 1318.5, start: 0.08, duration: 0.25, volume: 0.05 });
  },

  remove: (ctx, out) =>
    tone(ctx, out, { type: 'sawtooth', from: 380, to: 140, duration: 0.18, volume: 0.06 }),

  success: (ctx, out) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(ctx, out, { type: 'triangle', from: f, start: i * 0.08, duration: 0.35, volume: 0.12 }),
    );
  },

  error: (ctx, out) => {
    tone(ctx, out, { type: 'square', from: 160, duration: 0.09, volume: 0.07 });
    tone(ctx, out, { type: 'square', from: 130, start: 0.11, duration: 0.12, volume: 0.07 });
  },

  whoosh: (ctx, out) =>
    noise(ctx, out, { duration: 0.45, volume: 0.09, filterFrom: 250, filterTo: 3500, q: 0.8 }),

  tick: (ctx, out) => tone(ctx, out, { from: 2200, duration: 0.025, volume: 0.05 }),

  note: (ctx, out, { index = 0 } = {}) => {
    const f = PENTATONIC[index % PENTATONIC.length];
    tone(ctx, out, { type: 'triangle', from: f, duration: 0.6, volume: 0.12, attack: 0.01 });
    tone(ctx, out, { from: f * 2, duration: 0.3, volume: 0.03 });
  },
};

/**
 * Pad ambiental generativo: acordes lentos con filtro que "respira".
 * Devuelve una función stop().
 */
export function startAmbientPad(ctx, out) {
  const master = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();

  filter.type = 'lowpass';
  filter.frequency.value = 700;
  filter.Q.value = 4;
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 450;
  lfo.connect(lfoGain).connect(filter.frequency);

  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 3);
  filter.connect(master).connect(out);

  // Progresión: Am – F – C – G (voces graves)
  const chords = [
    [110, 164.81, 220, 261.63],
    [87.31, 130.81, 174.61, 220],
    [130.81, 196, 261.63, 329.63],
    [98, 146.83, 196, 246.94],
  ];

  const voices = chords[0].map((freq, i) => {
    const osc = ctx.createOscillator();
    const detune = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    detune.type = 'sawtooth';
    osc.frequency.value = freq;
    detune.frequency.value = freq;
    detune.detune.value = 9 + i * 2;
    g.gain.value = 0.05;
    osc.connect(g);
    detune.connect(g);
    g.connect(filter);
    osc.start();
    detune.start();
    return { osc, detune };
  });

  // Pulso suave tipo "kick" amortiguado cada 2 compases
  const pulse = () => tone(ctx, master, { from: 90, to: 45, duration: 0.5, volume: 0.35 });

  let step = 0;
  const changeChord = () => {
    step = (step + 1) % chords.length;
    const t = ctx.currentTime;
    voices.forEach(({ osc, detune }, i) => {
      osc.frequency.setTargetAtTime(chords[step][i], t, 0.6);
      detune.frequency.setTargetAtTime(chords[step][i], t, 0.6);
    });
    pulse();
  };
  lfo.start();
  pulse();
  const interval = setInterval(changeChord, 6000);

  return function stop() {
    clearInterval(interval);
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    setTimeout(() => {
      voices.forEach(({ osc, detune }) => {
        osc.stop();
        detune.stop();
      });
      lfo.stop();
      master.disconnect();
    }, 1300);
  };
}
