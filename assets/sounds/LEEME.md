# Sonidos

**Nombres sugeridos para los archivos** (así solo hay que conectarlos):
`hover.mp3`, `click.mp3`, `open.mp3`, `close.mp3`, `add.mp3`, `remove.mp3`, `success.mp3`,
`error.mp3`, `whoosh.mp3`, `tick.mp3`, `note.mp3`, `spray.mp3`, `unlock.mp3`, `ambient.mp3`.

Pon aquí tus archivos de audio y enlázalos en `js/config.js` → `SOUNDS`.
Mientras un sonido esté en `null`, el sitio usa uno **sintetizado en vivo**, así que no se rompe nada si falta alguno.

| Nombre    | Cuándo suena                                    | Qué buscar                                  | Duración ideal |
|-----------|-------------------------------------------------|---------------------------------------------|----------------|
| `hover`   | Pasar el mouse por botones y productos          | "ui hover", "soft blip", "tick"             | < 0.1 s        |
| `click`   | Clic en botones                                 | "ui click", "button press", "tap"           | < 0.2 s        |
| `open`    | Abrir carrito, vista rápida o menú              | "swoosh up", "open", "rise"                 | 0.2 – 0.4 s    |
| `close`   | Cerrar paneles                                  | "swoosh down", "close"                      | 0.2 – 0.4 s    |
| `add`     | Agregar al carrito                              | "coin", "pop", "add item", "positive"       | 0.2 – 0.5 s    |
| `remove`  | Quitar del carrito                              | "delete", "pop down", "negative soft"       | < 0.3 s        |
| `success` | Compra o suscripción exitosa                    | "success", "achievement", "chime"           | 0.5 – 1.5 s    |
| `error`   | Falta talla o correo inválido                   | "error", "denied", "buzz"                   | < 0.4 s        |
| `whoosh`  | Entrada al sitio, cambiar filtros               | "whoosh", "transition", "swipe"             | 0.3 – 0.8 s    |
| `tick`    | Colores, cantidades, cambio de look             | "tick", "tiny click", "tap"                 | < 0.05 s       |
| `note`    | Letras de "Shifting your style" (una nota c/u)  | Una nota musical limpia: "pluck", "piano C" | 0.3 – 1 s      |
| `spray`   | Clic en el logo grande                          | "spray can", "aerosol shake and spray"      | 0.5 – 1 s      |
| `unlock`  | Drop desbloqueado con la clave                  | "unlock", "vault open", "level up"          | 0.5 – 1.5 s    |
| `ambient` | Música de fondo en loop                         | "lofi loop", "ambient loop", beat propio    | 30 s – 3 min   |

## Consejos

- **Formato:** `.mp3` (compatible con todo) o `.ogg`. Mantén los efectos por debajo de ~50 KB.
- **Volumen:** normaliza los efectos a un nivel parecido; ajusta el global en `AUDIO` dentro de `config.js`.
- **Loop de música:** que empiece y termine en el mismo punto para que no se note el corte.
- **`note`:** usa una sola nota; el código la sube de tono para cada letra y forma una escala.
- **Dónde buscar (gratis):** freesound.org, pixabay.com/sound-effects, mixkit.co/free-sound-effects, zapsplat.com.
  Revisa la licencia de cada sonido (ideal: CC0 o uso comercial permitido), porque es para una marca.

## Ejemplo

```js
// js/config.js
export const SOUNDS = {
  hover: 'assets/sounds/hover.mp3',
  click: 'assets/sounds/click.mp3',
  add: 'assets/sounds/add.mp3',
  ambient: 'assets/sounds/ambient-loop.mp3',
  // …los que dejes en null siguen usando el sintetizador
};
```
