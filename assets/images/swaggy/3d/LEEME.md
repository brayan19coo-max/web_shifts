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

## Ropa (clóset de Swaggy)

`looks/<look>/` tiene las mismas 20 tiras pero con Swaggy vestido (camiseta de cada drop, gorra, pijama) y `foto.webp` (foto en alta para "Foto con Swaggy"). La página escoge la carpeta según lo que el visitante eligió en el clóset (`js/components/swaggy/closet.js`, lista en `SWAGGY.looks` de `config.js`). De noche, si no eligió nada, usa `pijama`.

Para agregar o cambiar ropa:
1. `tools/swaggy3d/dress.js` arma la camiseta (tronco + mangas) con su estampado; `looks.json` tiene cada look.
2. `patch.py` arma el estudio y luego se pega `dress.js` antes de `window.__swg = {` en `studio/studio.html`.
3. `capture_looks.py` graba cada look (`plan.json` = las 20 acciones), `build_looks.py <look>` arma las tiras y `capture_stills.py` las fotos.
4. La calle 3D (`swaggy3d.html`) se viste en vivo con el mensaje `swaggy:dress` (mismo `dress.js` pegado al final de su escena).
