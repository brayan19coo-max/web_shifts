import { startCatchGame } from './catch-can.js';
import { startRunnerGame } from './runner.js';
import { startFlapGame } from './flap.js';
import { startTapDropGame } from './tap-drop.js';
import { startStackGame } from './stack.js';
import { startComboGame } from './combo.js';
import { startGuardGame } from './guard.js';
import { startRhythmGame } from './rhythm.js';

/**
 * ARCADE DE SWAGGY
 * -------------------------------------------------------------
 * Lista de mini juegos. Para agregar uno nuevo: crea su archivo en esta
 * carpeta (que exporte una función start(elemento, { onScore, onLives,
 * onInfo, onEnd }) y devuelva { stop() }) y agrégalo aquí.
 *
 * - kind: 'canvas' (el juego dibuja en un <canvas>) o 'dom' (arma su
 *   propio HTML dentro de un <div>).
 * - controls: texto de cómo se juega (con versión para mouse y para dedo).
 * - rules: lista de reglas que se muestra antes de empezar.
 * - lives: false si el juego no usa vidas (muestra su propia info arriba).
 * - soon: true para mostrarlo como "Próximamente".
 */
export const GAMES = [
  {
    id: 'flap',
    name: 'Swaggy Flap',
    icon: '🚀',
    kind: 'canvas',
    lives: false,
    start: startFlapGame,
    controls: {
      mouse: 'Clic o espacio = un impulso con la lata. Pasa entre los muros sin tocarlos.',
      touch: 'Cada toque = un impulso con la lata. Pasa entre los muros sin tocarlos.',
    },
    rules: [
      ['rule-icon', '🧱 Cada muro que pasas: +1'],
      ['can can--gold', 'Lata dorada en el hueco: +3'],
      ['rule-icon', '💥 Un solo golpe y se acaba'],
      ['rule-icon', '🔥 Cada 10 muros, más difícil'],
    ],
  },
  {
    id: 'tapdrop',
    name: 'Tap the Drop',
    icon: '⏱️',
    kind: 'canvas',
    start: startTapDropGame,
    controls: {
      mouse: 'Para el contador lo más cerca de 00.000 con clic o espacio.',
      touch: 'Para el contador lo más cerca de 00.000 tocando la pantalla.',
    },
    rules: [
      ['rule-icon', '🎯 Perfecto (≤ 15 ms): +100 y recuperas una vida'],
      ['rule-icon', '✅ Excelente +60 · Bien +30 · Casi +10'],
      ['rule-icon', '🔥 Aciertos seguidos = combo que multiplica'],
      ['rule-icon', '👀 Desde la ronda 4 los números se esconden'],
    ],
  },
  {
    id: 'stack',
    name: 'Stack Drop',
    icon: '👕',
    kind: 'canvas',
    lives: false,
    start: startStackGame,
    controls: {
      mouse: 'Clic o espacio para soltar la prenda sobre la pila.',
      touch: 'Toca para soltar la prenda sobre la pila.',
    },
    rules: [
      ['rule-icon', '👕 Cada prenda apilada: +1'],
      ['rule-icon', '✂️ Lo que sobresale se corta y se cae'],
      ['rule-icon', '✨ Caída perfecta: +3, y 3 seguidas la agrandan'],
      ['rule-icon', '💥 Si la sueltas por fuera, se acaba'],
    ],
  },
  {
    id: 'combo',
    name: 'Combo Spray',
    icon: '🌈',
    kind: 'canvas',
    lives: false,
    start: startComboGame,
    controls: {
      mouse: 'Arrastra una lata hacia la de al lado (o haz clic en las dos) para cambiarlas.',
      touch: 'Desliza una lata hacia la de al lado (o toca las dos) para cambiarlas.',
    },
    rules: [
      ['rule-icon', '🎨 3 o más iguales en fila explotan: +10 cada una'],
      ['rule-icon', '⛓️ Las cadenas multiplican los puntos y suman tiempo'],
      ['rule-icon', '💣 Fila de 5: bomba de pintura (+3 s)'],
      ['rule-icon', '⏱ Tienes 60 segundos'],
    ],
  },
  {
    id: 'guard',
    name: 'Esquiva al guardia',
    icon: '🚨',
    kind: 'canvas',
    start: startGuardGame,
    controls: {
      mouse: 'Mantén presionado el clic (o espacio) para pintar. Cuando el guardia voltee, ¡suelta!',
      touch: 'Mantén el dedo para pintar. Cuando el guardia voltee, ¡suelta!',
    },
    rules: [
      ['rule-icon', '🖌️ +1 por cada 1 % del muro pintado'],
      ['rule-icon', '🤨 Cuando hace "¿?" está por voltear (a veces es amague)'],
      ['rule-icon', '😮‍💨 Soltar justo a tiempo: ¡UFF! +15'],
      ['rule-icon', '🧱 Muro terminado: +50 × nivel'],
    ],
  },
  {
    id: 'rhythm',
    name: "Ritmo Shift's",
    icon: '🎵',
    kind: 'canvas',
    lives: false,
    start: startRhythmGame,
    controls: {
      mouse: 'Usa ← ↓ → (o A S D, o clic en el carril) cuando la lata toque la línea roja.',
      touch: 'Toca el carril cuando la lata llegue a la línea roja.',
    },
    rules: [
      ['rule-icon', '🎯 Perfecto +100 · Bien +60 · OK +30'],
      ['rule-icon', '🔥 Cada 10 seguidas sube el multiplicador (hasta x4)'],
      ['rule-icon', '⚡ Si se te pasan, pierdes energía'],
      ['rule-icon', '🔊 Mejor con sonido: cada acierto es una nota'],
    ],
  },
  {
    id: 'catch',
    name: 'Atrapa la lata',
    icon: '🥫',
    kind: 'canvas',
    start: startCatchGame,
    controls: {
      mouse: 'Mueve el mouse (o usa ← →) para mover a Swaggy.',
      touch: 'Arrastra el dedo para mover a Swaggy.',
    },
    rules: [
      ['can can--white', 'Lata blanca: +1'],
      ['can can--gold', 'Lata dorada: +5'],
      ['can can--bad', 'Lata negra con X: pierdes una vida'],
    ],
  },
  {
    id: 'runner',
    name: 'Escape del muro',
    icon: '🏃',
    kind: 'canvas',
    start: startRunnerGame,
    controls: {
      mouse: 'Clic, espacio o ↑ para saltar. Mantén para saltar más alto y salta otra vez en el aire para el doble salto.',
      touch: 'Toca para saltar. Mantén para saltar más alto y toca otra vez en el aire para el doble salto.',
    },
    rules: [
      ['rule-icon', '🚧 Salta conos, canecas y vallas: cada golpe quita una vida'],
      ['can can--white', 'Lata en el aire: +5'],
      ['can can--gold', 'Lata dorada: +15'],
      ['rule-icon', '🏁 Entre más lejos llegues, más puntos'],
    ],
  },
];
