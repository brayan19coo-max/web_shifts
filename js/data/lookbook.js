/**
 * LOOKBOOKS (uno por drop, el más nuevo primero)
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

const DROP_02 = {
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

const DROP_01 = {
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

// Cada lookbook se muestra en su propia sección, en este orden.
export const LOOKBOOKS = [DROP_02, DROP_01];
