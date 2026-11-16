/**
 * LOOKBOOK
 * =============================================================
 * Cada "look" es una tarjeta del lookbook. Para usar fotos reales:
 * 1. Sube las fotos a assets/images/lookbook/ (verticales 4:5 o 3:4,
 *    .jpg o .webp, idealmente < 400 KB cada una).
 * 2. Pon la ruta en `image`. Si un look no tiene `image`, se muestra
 *    el dibujo de la prenda (`art` + `color`).
 *
 * PORTADA (cover): es la carta de arriba del mazo. Al tocarla, los looks
 * salen como cartas. Si no tiene `image`, se genera una con el nombre.
 *
 *   {
 *     title: 'Nombre del look',
 *     text: 'Frase corta con las prendas que usa.',
 *     image: 'assets/images/lookbook/look-01.webp',
 *   },
 *
 * Con foto, la carta es vertical y la foto la ocupa completa. Sin foto se
 * muestra el dibujo de la prenda (art + color) sobre el color bg/fg.
 */

export const LOOKBOOK = {
  title: 'Lookbook',
  season: 'Drop 02 — Bonnie & Clyde',
  // Crédito de las fotos (se muestra debajo del lookbook). Sin crédito: credit: null
  credit: null,
  cover: {
    image: 'assets/images/lookbook/drop-02/portada.webp',
    title: 'Bonnie & Clyde',
    kicker: 'Drop 02',
  },
  looks: [
    {
      title: 'Bolsa en mano',
      text: 'Clyde negra/azul. Cero preguntas.',
      image: 'assets/images/lookbook/drop-02/look-01.webp',
    },
    {
      title: 'El botín',
      text: 'Clyde negra/roja y blanca/azul, repartiendo lo robado.',
      image: 'assets/images/lookbook/drop-02/look-02.webp',
    },
    {
      title: 'Sin coartada',
      text: 'Clyde negra/roja.',
      image: 'assets/images/lookbook/drop-02/look-03.webp',
    },
    {
      title: 'Cara de inocente',
      text: 'Clyde blanca/azul.',
      image: 'assets/images/lookbook/drop-02/look-04.webp',
    },
    {
      title: 'Cubriendo la salida',
      text: 'Clyde blanca/azul al frente, negra/roja de espaldas.',
      image: 'assets/images/lookbook/drop-02/look-05.webp',
    },
    {
      title: 'Sospechosos de siempre',
      text: 'Rojo, azul y blanco: todos culpables.',
      image: 'assets/images/lookbook/drop-02/look-06.webp',
    },
    {
      title: 'Manos arriba',
      text: 'Aquí nadie se rinde.',
      image: 'assets/images/lookbook/drop-02/look-07.webp',
    },
    {
      title: 'Bonnie & Clyde',
      text: 'Estado: ¿capturados?',
      image: 'assets/images/lookbook/drop-02/look-08.webp',
    },
  ],
};
