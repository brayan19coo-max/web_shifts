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
 *     image: 'assets/images/lookbook/look-01.jpg',
 *   },
 *
 * Con foto, la carta es vertical y la foto la ocupa completa. Sin foto se
 * muestra el dibujo de la prenda (art + color) sobre el color bg/fg.
 */

export const LOOKBOOK = {
  title: 'Lookbook',
  season: 'Drop 01 — Saint Mode',
  // Crédito de las fotos (se muestra debajo del lookbook)
  credit: { label: 'Fotos: @crisstian._s', url: 'https://instagram.com/crisstian._s' },
  cover: {
    image: 'assets/images/lookbook/portada-saint.jpg',
    title: 'Saint Mode',
    kicker: 'Drop 01',
  },
  looks: [
    {
      title: 'Saint Mode',
      image: 'assets/images/lookbook/saint-01.jpg',
    },
    {
      title: 'Alas',
      text: 'Tee blanca con alas en la espalda.',
      image: 'assets/images/lookbook/saint-02.jpg',
    },
    {
      title: 'Devoción',
      text: 'Tee negra con el logo Shift\'s en script.',
      image: 'assets/images/lookbook/saint-03.jpg',
    },
    {
      title: 'Ángel caído',
      text: 'Tee negra con ángel y logo en la espalda.',
      image: 'assets/images/lookbook/saint-04.jpg',
    },
    {
      title: 'Querubín',
      text: 'Tee negra con querubín al frente.',
      image: 'assets/images/lookbook/saint-05.jpg',
    },
    {
      title: 'Dúo celestial',
      text: 'Blanco y negro, un mismo culto.',
      image: 'assets/images/lookbook/saint-06.jpg',
    },
    {
      title: 'Señal divina',
      text: 'Tee blanca con ángel y logo en la espalda.',
      image: 'assets/images/lookbook/saint-07.jpg',
    },
    {
      title: 'Confesión',
      text: 'La espalda también habla.',
      image: 'assets/images/lookbook/saint-08.jpg',
    },
    {
      title: 'Juego sagrado',
      text: 'Dos tonos, un mismo drop.',
      image: 'assets/images/lookbook/saint-09.jpg',
    },
    {
      title: 'Tiro bendito',
      text: 'Saint Mode también se juega.',
      image: 'assets/images/lookbook/saint-10.jpg',
    },
  ],
};
