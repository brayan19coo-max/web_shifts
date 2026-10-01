/**
 * CONFIGURACIÓN DE LA MARCA
 * -------------------------------------------------------------
 * Aquí se personaliza el nombre, los textos, la moneda, el contacto,
 * el drop bloqueado y los sonidos del sitio.
 */

export const BRAND = {
  name: "Shift's",
  tagline: 'Shifting your style',
  description: 'Ropa urbana con alma de graffiti. Colecciones para tus días de base y drops para tus días de impulso.',
  logo: 'assets/images/logo.svg', // logo vectorial (letras blancas, contorno negro)
  logoSticker: 'assets/images/logo-sticker.svg', // con borde blanco tipo sticker (para fondos negros)
  locale: 'es-CO',
  currency: 'COP',
  // Envío gratis a partir de este valor (0 para desactivar la barra)
  freeShippingFrom: 250000,
  // Número de WhatsApp con código de país, sin "+" ni espacios.
  // Si lo dejas vacío, el checkout funciona en modo demostración.
  whatsapp: '573242887471',
  // Crew: canal de difusión de WhatsApp
  crew: {
    url: 'https://whatsapp.com/channel/0029VbCqmWhFXUugU8ZeLL2o',
    perks: [
      'Primero en enterarte de cada lanzamiento',
      'Claves de acceso anticipado',
      'Detrás de cámaras y sorpresas',
    ],
  },
  social: {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/',
  },
};

/**
 * DROP BLOQUEADO
 * -------------------------------------------------------------
 * Los productos con `drop: 'drop-02'` (en products.js) quedan ocultos
 * detrás de una clave hasta la fecha de lanzamiento. Si todavía no hay
 * productos con ese drop, al abrirse se muestra "Las piezas se revelan pronto".
 *
 * - releaseDate: fecha y hora del lanzamiento (con zona horaria de Colombia -05:00).
 *   Formato: 'AAAA-MM-DDTHH:MM:00-05:00'  (hora en formato 24 h: 7 p. m. = 19:00)
 * - autoUnlock: si es true, el drop se abre solo para todos cuando termina el contador.
 * - passwordHash: la clave NO se guarda en texto plano. Para cambiarla, abre
 *   /tools/generar-clave.html en el navegador, escribe tu nueva clave y
 *   pega aquí el código que te da. La clave no distingue mayúsculas/minúsculas.
 *
 * Nota: es un bloqueo para crear expectativa (acceso anticipado), no una
 * seguridad bancaria; alguien con conocimientos técnicos podría saltarlo.
 */
export const DROP = {
  id: 'drop-02',
  name: 'Drop 02',
  codename: 'Bonnie & Clyde',
  subtitle: 'FUERA DE LA LEY. DENTRO DEL DROP.',
  releaseDate: '2026-10-20T19:00:00-05:00',
  timeZone: 'America/Bogota', // zona horaria en la que se muestra la fecha
  autoUnlock: true,
  passwordHash: '6c4a1b64aa01374fafc4fc19b9355a13d773750daf0fa9afe4c97450c949485c',
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
  hover: 'assets/sounds/hover.mp3?v=709187bb',         // pasar el mouse sobre botones/productos
  click: 'assets/sounds/click.mp3?v=f39f8c7c',         // clic en botones
  open: 'assets/sounds/open.mp3?v=5679890c',           // abrir carrito / vista rápida / menú
  close: 'assets/sounds/close.mp3?v=7b525840',         // cerrar paneles
  add: 'assets/sounds/add.mp3?v=d36ed1e9',             // agregar al carrito
  remove: 'assets/sounds/remove.mp3?v=c260218f',       // quitar del carrito
  success: 'assets/sounds/success.mp3?v=11176881',     // compra / suscripción exitosa
  error: 'assets/sounds/error.mp3?v=080a2560',         // validación fallida (falta talla, clave incorrecta)
  whoosh: 'assets/sounds/whoosh.mp3?v=29767df1',       // transiciones (filtros, intro)
  tick: 'assets/sounds/tick.mp3?v=c3d23c3a',           // pequeños detalles (colores, cantidades, contador)
  note: 'assets/sounds/note.mp3?v=b1257806',           // letras de "Shifting your style" (se afina por letra)
  spray: 'assets/sounds/spray.mp3?v=06594c7f',         // clic en el logo (lata de aerosol)
  unlock: 'assets/sounds/unlock.mp3?v=bed277cb',       // drop desbloqueado
  ambient: 'assets/sounds/ambient.mp3?v=8160c148',     // música de fondo en loop
};

/**
 * SWAGGY — el brother de la marca
 * -------------------------------------------------------------
 * Nutria con lentes deportivos oscuros. Vive en "El parche", donde se
 * puede interactuar con él y entrar al arcade de mini juegos.
 * Las frases se escogen al azar según lo que pase.
 */
export const SWAGGY = {
  name: 'Swaggy',
  spotName: 'El parche de Swaggy',
  // Frases: se escoge una al azar. Puedes agregar, quitar o cambiar las que quieras.
  phrases: {
    // Al entrar al parche
    greet: ['¡Epa! Llegaste justo a tiempo 😎', 'Bienvenido al parche. Aquí no se entra, se llega.', 'Uy, ese outfit… me gusta cómo vienes.', '¿Qué más pues? Póngase cómodo.'],
    // Al volver después de 2 días o más
    back: ['¡Volviste! Te estaba guardando el puesto 🥹', 'Mira quién regresó… el que era.', 'Te demoraste, pero valió la pena.'],
    // Al tocarlo
    tap: ['¡Epa! Con cuidado, que estoy recién planchado.', 'Jaja, eso hace cosquillas 😂', '¿Me llamaste? Aquí estoy.', 'Tócame otra vez y te hago un paso.', 'Shifting my style 😎', '¿Ya viste lo que viene en el drop? 👀'],
    // Al acariciarlo (pasar el dedo/mouse por encima)
    pet: ['Uff… así sí 😌', 'Eso, justo detrás de la oreja.', 'Con cariño, como hacemos la ropa.'],
    // Al tocarlo demasiado
    annoyed: ['¡Ey, ey! Los lentes no se tocan 😤', 'Suave, que me despeinas.', 'Ya, ya… respeto con el brother.', 'Me vas a arrugar el outfit.'],
    // Cuando se duerme
    sleepy: ['…zzz', 'Soñando con el próximo drop…', 'Cinco minutos más…'],
    // Al despertarlo
    wake: ['¡Estoy despierto! …casi.', '¿Eh? ¿Quién? Ah, eras tú 😅', 'Uy, me dormí. ¿Me perdí de algo?'],
    // Lo que dice solo, cuando nadie lo toca
    idle: ['¿Jugamos algo o qué?', 'El arcade está ahí, eh 👉', 'Día de base o día de impulso: ¿qué eres hoy?', 'Estos lentes no me los quito ni para dormir.', 'Fuera de la ley, dentro del drop 🤫', 'Yo con esta cadena y tú con ese estilo… qué combo.'],
    // Cuando se sube los lentes y guiña
    glasses: ['Te guiño, pero no le digas a nadie 😉', 'Sí, hay ojos aquí debajo.'],
    // Cuando baila
    dance: ['Esta es mi canción 🎶', 'Mira este paso, brother.'],
    // Cuando se estira
    stretch: ['Aaaah… estiramiento de nutria.'],
    // Burbuja del botón flotante
    invite: ['¿Jugamos? 🕹️', 'Ven al parche 👀', 'Psst… por aquí 🦦', 'Tengo un juego para ti.'],
    // Al volver del juego al parche
    home: ['¿Otra o qué?', 'Buena esa. ¿Revancha?', 'Descansa los dedos y vuelve.'],
    // Al perder en un juego
    gameOver: ['Casi, casi. Otra más.', 'Nada mal… pero yo sé que das más.', 'Esa estuvo cerca 😅', 'Tranqui, hasta los grandes caen.'],
    // Al romper el récord
    record: ['¡Récord nuevo! Eres una leyenda 🔥', 'Rompiste el récord. Respeto 😎', 'Eso merece un aplauso 👏'],

    // ----- Swaggy por la página -----
    // Cuando se asoma al llegar a cada sección (una vez por visita)
    sections: {
      tienda: ['Pilas con esto, que se va rápido 👀', 'Aquí está lo bueno.', 'Yo me llevaría todo, pero no tengo bolsillos.'],
      drop: ['Shhh… aquí se guarda lo que viene 🤫', '¿Tienes la clave? Yo no he dicho nada.'],
      lookbook: ['Toca la portada y mira las cartas 🃏', 'Qué fotos, brother. Míralas todas.'],
      nosotros: ['Léela, que la escribimos con cariño.', 'Esta es la historia del parche.'],
      crew: ['En el Crew sueltan las claves primero 🤫', 'Únete al Crew, nos vemos allá.'],
      footer: ['¿Ya te vas? Vuelve pronto 🦦', 'Llegaste al final… o al comienzo 😎'],
    },
    // Carrito
    cartAdd: ['¡Buena elección! 🔥', 'Eso te va a quedar brutal.', 'Uy, ese es de los míos.'],
    cartRemove: ['Nooo, ¿por qué? 🥲', 'Me dolió, pero te entiendo.', 'Bueno… él se lo pierde.'],
    checkout: ['¡Eso! Nos vemos en WhatsApp 🥳', 'Pedido listo. ¡A estrenar! 🔥'],
    // Dentro de la bóveda cuando se abre el drop
    vault: ['Fuera de la ley 😎', 'Yo no vi nada… 🤫'],
    // Swaggy escondido: lo que dice cuando alguien lo encuentra
    secret: ['¡Me encontraste! 👀', 'Shhh… no le digas a nadie que me escondo aquí.', 'Pista: las claves se sueltan en el Crew 🤫', 'Pista: el drop se abre solo cuando llega la hora ⏰'],
  },
  // Premio de los mini juegos. En null = sin premio.
  // Ejemplo: { minScore: 60, text: '10 % de descuento en tu próxima compra' }
  // Para que aplique a un solo juego, agrega game: 'flap' | 'tapdrop' | 'stack' | 'combo' | 'guard' | 'rhythm' | 'runner' | 'catch'.
  // Quien lo gane recibe un botón para reclamarlo por WhatsApp con su puntaje.
  prize: null,
};

/** Volúmenes por defecto (0 a 1). */
export const AUDIO = {
  sfxVolume: 0.7,
  musicVolume: 0.35,
  // Ajustes por sonido:
  // - volume: 0 a 1, relativo al volumen general de efectos
  // - cooldown: milisegundos mínimos entre una repetición y la siguiente
  perSound: {
    hover: { volume: 0.45, cooldown: 250 },
    tick: { cooldown: 30 },
  },
};
