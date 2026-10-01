import { startCatchGame } from './catch-can.js';
import { startRunnerGame } from './runner.js';
import { startMemoryGame } from './memory.js';

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
 * - soon: true para mostrarlo como "Próximamente".
 */
export const GAMES = [
  {
    id: 'catch',
    name: 'Atrapa la lata',
    icon: '🎨',
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
  {
    id: 'memory',
    name: 'Memoria Saint Mode',
    icon: '🧠',
    kind: 'dom',
    lives: false,
    start: startMemoryGame,
    controls: {
      mouse: 'Voltea las cartas de a dos y encuentra las parejas del Drop 01.',
      touch: 'Voltea las cartas de a dos y encuentra las parejas del Drop 01.',
    },
    rules: [
      ['rule-icon', '🃏 Cada pareja: +10'],
      ['rule-icon', '❌ Cada fallo: −2'],
      ['rule-icon', '⏱ Termina rápido para ganar bono (hasta +40)'],
    ],
  },
];
