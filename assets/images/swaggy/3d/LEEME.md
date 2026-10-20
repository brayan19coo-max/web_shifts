# Swaggy 3D en la página

Estas tiras son el **modelo 3D de Swaggy** (la escena `Swaggy de Shift's`) grabado cuadro por cuadro con fondo transparente, a 12 cuadros por segundo. La página las usa en el botón de la esquina, cuando se asoma por los bordes, en el parche, en la bóveda y en el Swaggy escondido (`js/components/swaggy/sw3d.js`).

Cada archivo es una tira horizontal de cuadros de 240×260 (la cantidad está en `manifest.json`):

| Archivo | Acción del 3D | Se usa para |
|---|---|---|
| `quieto` | (sin acción) | normal, en loop |
| `saludar` | call | saludar |
| `hablar` | chat | mientras habla |
| `risa` / `carcajada` | giggle / bellyLaugh | feliz / acariciarlo |
| `bailar` / `rapear` | dance / rap | celebrar, carrito, solo |
| `flex` / `chocala` | flex / highFive | al tocarlo |
| `bravo` / `pataleta` | stomp / tantrum | molesto |
| `triste` | sad | quitar del carrito |
| `dormido` / `bostezo` | dormir / yawn | se duerme / se despierta |
| `gafas` | glassesPeek | se sube las gafas |
| `susto` / `mirar` / `girar` / `saltar` / `cadena` | startle / lookAround / tailSpin / footHop / showChain | reacciones |

## Si cambia el modelo 3D

Herramientas en `tools/swaggy3d/`: `patch.py` arma una copia "estudio" de la escena (sin calle, fondo transparente, reloj controlado), `capture.mjs` graba cada acción con Chromium y `build_sheets.py` arma las tiras. Pásale a Claude el HTML nuevo y las regenera.
