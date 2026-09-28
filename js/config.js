/**
 * CONFIGURACIÓN DE LA MARCA
 * -------------------------------------------------------------
 * Este es el único archivo que necesitas tocar para personalizar
 * nombre, textos, moneda, contacto y sonidos del sitio.
 */

export const BRAND = {
  name: 'SHIFTS',
  tagline: 'Cambia de piel. Cambia de ritmo.',
  description: 'Ropa urbana hecha en series cortas. Sin temporadas, solo drops.',
  locale: 'es-CO',
  currency: 'COP',
  // Envío gratis a partir de este valor (0 para desactivar la barra)
  freeShippingFrom: 250000,
  // Número de WhatsApp con código de país, sin "+" ni espacios (ej: '573001234567').
  // Si lo dejas vacío, el checkout funciona en modo demostración.
  whatsapp: '',
  social: {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/',
  },
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
  error: null,    // validación fallida (p.ej. falta talla)
  whoosh: null,   // transiciones (filtros, intro)
  tick: null,     // pequeños detalles (swatches, cantidades)
  note: null,     // letras del logo del inicio (se afina por letra)
  ambient: null,  // música de fondo en loop
};

/** Volúmenes por defecto (0 a 1). */
export const AUDIO = {
  sfxVolume: 0.7,
  musicVolume: 0.35,
};
