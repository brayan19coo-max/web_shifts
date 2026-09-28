/**
 * LOOKBOOK
 * =============================================================
 * Cada "look" es una tarjeta del lookbook. Para usar fotos reales:
 * 1. Sube las fotos a assets/images/lookbook/ (verticales 4:5 o 3:4,
 *    .jpg o .webp, idealmente < 400 KB cada una).
 * 2. Pon la ruta en `image`. Si un look no tiene `image`, se muestra
 *    el dibujo de la prenda (`art` + `color`).
 *
 *   {
 *     title: 'Nombre del look',
 *     text: 'Frase corta con las prendas que usa.',
 *     image: 'assets/images/lookbook/look-01.jpg',
 *     bg: '#f4f4f4',          // color de fondo de la tarjeta
 *     fg: '#0a0a0a',          // color del texto
 *   },
 */

export const LOOKBOOK = {
  title: 'Lookbook',
  season: 'Drop 01',
  looks: [
    {
      title: 'Ruido blanco',
      text: 'Capas pesadas para noches largas. Hoodie Bomb + Cargo Throw-Up.',
      art: 'hoodie',
      color: '#111111',
      bg: '#f4f4f4',
      fg: '#0a0a0a',
    },
    {
      title: 'Señal perdida',
      text: 'Nylon que corta el viento. Chaqueta Crew sobre Tee Tag.',
      art: 'jacket',
      color: '#f4f4f4',
      bg: '#1a1a1a',
      fg: '#f4f4f4',
    },
    {
      title: 'Frecuencia baja',
      text: 'Lo básico, pero con peso. Tee Wall y Gorra Piece.',
      art: 'tee',
      color: '#0a0a0a',
      bg: '#8a8a8a',
      fg: '#0a0a0a',
    },
    {
      title: 'Modo avión',
      text: 'Todo lo que necesitas, nada más. Cargo negro + Tote Can.',
      art: 'pants',
      color: '#111111',
      bg: '#f4f4f4',
      fg: '#0a0a0a',
    },
  ],
};
