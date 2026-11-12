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
  season: 'Drop 01 — Saint Mode',
  // Crédito de las fotos (se muestra debajo del lookbook)
  credit: { label: 'Fotos: @crisstian._s', url: 'https://instagram.com/crisstian._s' },
  cover: {
    image: 'assets/images/lookbook/portada-saint.webp',
    title: 'Saint Mode',
    kicker: 'Drop 01',
  },
  looks: [
    {
      title: 'Saint Mode',
      image: 'assets/images/lookbook/saint-01.webp',
    },
    {
      title: 'Alas',
      text: 'Donde otros ven límites, nosotros vemos camino.',
      image: 'assets/images/lookbook/saint-02.webp',
    },
    {
      title: 'Devoción',
      text: 'Por lo que somos.',
      image: 'assets/images/lookbook/saint-03.webp',
    },
    {
      title: 'Arcangel',
      text: 'Blessed in the streets.',
      image: 'assets/images/lookbook/saint-04.webp',
    },
    {
      title: 'Querubín',
      text: 'No preguntes de dónde vienen las alas.',
      image: 'assets/images/lookbook/saint-05.webp',
    },
    {
      title: 'Dúo celestial',
      text: 'Two icons, one frequency.',
      image: 'assets/images/lookbook/saint-06.webp',
    },
    {
      title: 'Señal divina',
      text: 'El comienzo de algo escrito.',
      image: 'assets/images/lookbook/saint-07.webp',
    },
    {
      title: 'BLACK & LIGHT',
      image: 'assets/images/lookbook/saint-09.webp',
    },
    {
      title: 'Es el fin. ¿O no?',
      image: 'assets/images/lookbook/saint-10.webp',
    },
  ],
};
