/**
 * CONFIGURACIÓN DE LA MARCA
 * -------------------------------------------------------------
 * Aquí se personaliza el nombre, los textos, la moneda, el contacto,
 * el drop bloqueado y los sonidos del sitio.
 */

export const BRAND = {
  name: "Shift's",
  tagline: 'Shifting your style',
  description: 'Ropa urbana con alma de graffiti. Series cortas, sin temporadas: solo drops.',
  logo: 'assets/images/logo.png', // logo original (fondo transparente)
  logoSticker: 'assets/images/logo-sticker.png', // logo con borde blanco (para fondos negros)
  locale: 'es-CO',
  currency: 'COP',
  // Envío gratis a partir de este valor (0 para desactivar la barra)
  freeShippingFrom: 250000,
  // Número de WhatsApp con código de país, sin "+" ni espacios.
  // Si lo dejas vacío, el checkout funciona en modo demostración.
  whatsapp: '573242887471',
  social: {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/',
  },
};

/**
 * DROP BLOQUEADO
 * -------------------------------------------------------------
 * Los productos con `drop: 'drop-02'` (en products.js) quedan ocultos
 * detrás de una clave hasta la fecha de lanzamiento.
 *
 * - releaseDate: fecha y hora del lanzamiento (con zona horaria de Colombia -05:00).
 * - autoUnlock: si es true, el drop se abre solo cuando termina el contador.
 * - passwordHash: la clave NO se guarda en texto plano. Para cambiarla, abre
 *   /tools/generar-clave.html en el navegador, escribe tu nueva clave y
 *   pega aquí el código que te da.
 *   Clave actual: SHIFTS2026
 *
 * Nota: es un bloqueo para crear expectativa (acceso anticipado), no una
 * seguridad bancaria; alguien con conocimientos técnicos podría saltarlo.
 */
export const DROP = {
  id: 'drop-02',
  name: 'Drop 02',
  subtitle: 'Acceso anticipado solo con clave',
  releaseDate: '2026-10-31T20:00:00-05:00',
  timeZone: 'America/Bogota', // zona horaria en la que se muestra la fecha
  autoUnlock: true,
  passwordHash: 'ca98d1fe58a76e517f6c9650068ed5c61a7e2a643c6a3783ed2baf1562045328',
};

/**
 * SONIDOS
 * -------------------------------------------------------------
 * Cada evento del sitio tiene un sonido. Si dejas `null`, se usa un
 * sonido sintetizado en tiempo real (no necesita archivos).
 *
 * Para usar tus propios sonidos, copia los archivos a /assets/sounds
 * y pon la ruta. Ejemplo:
 *   hover: 'assets/sounds/hover.mp3',
 *
 * Formatos recomendados: .mp3 o .ogg, cortos (< 1 s) y livianos.
 * `ambient` es la música de fondo: un loop largo (.mp3).
 */
export const SOUNDS = {
  hover: null,    // pasar el mouse sobre botones/productos
  click: null,    // clic en botones
  open: null,     // abrir carrito / vista rápida / menú
  close: null,    // cerrar paneles
  add: null,      // agregar al carrito
  remove: null,   // quitar del carrito
  success: null,  // compra / suscripción exitosa
  error: null,    // validación fallida (falta talla, clave incorrecta)
  whoosh: null,   // transiciones (filtros, intro)
  tick: null,     // pequeños detalles (colores, cantidades, contador)
  note: null,     // letras de "Shifting your style" (se afina por letra)
  spray: null,    // clic en el logo (lata de aerosol)
  unlock: null,   // drop desbloqueado
  ambient: null,  // música de fondo en loop
};

/** Volúmenes por defecto (0 a 1). */
export const AUDIO = {
  sfxVolume: 0.7,
  musicVolume: 0.35,
};
