# Swaggy 3D en los mini juegos

Son el **modelo 3D de Swaggy** grabado desde la calle 3D (`swaggy3d.html`) con fondo transparente. Los juegos las cargan con `js/components/swaggy/games/poses.js` y el filtro de pixel art (`games/pixel.js`) las deja en estilo arcade.

Cada archivo es una tira horizontal de cuadros de 220 px de alto (cantidad y ancho en `manifest.json`).

| Archivo | Vista | Acción del 3D | Juegos |
|---|---|---|---|
| `quieto` | frente | (sin acción) | Tap the Drop, Stack, Guardia, Atrapa la lata |
| `caminar` | frente | caminar | Atrapa la lata |
| `bailar` | frente | dance | Ritmo Shift's |
| `celebrar` | frente | tantrum (contento) | varios |
| `golpe` | frente | bonk | varios |
| `nervioso` / `triste` / `atrapar` | frente | scared / sad / highFive | Tap the Drop, Stack, Atrapa la lata |
| `disimular` / `pintar` | frente / de espaldas | sing / spray | Esquiva al guardia |
| `correr` / `saltar` / `caer` / `recoger` / `golpe_lado` | de lado | correr en 4 patas / salto / scared / bonk | Escape del muro |
| `aletear` / `planear` | tres cuartos | tantrum / startle | Swaggy Flap |

## Si cambia el modelo 3D

En `tools/swaggy3d/`:
1. `python3 game_studio.py swaggy3d.html studio.html` (copia "estudio": sin calle, reloj controlado). Junto a `studio.html` debe estar `assets/vendor/three/`.
2. `python3 capture_games.py studio.html frames` (graba cada animación con Chromium).
3. `python3 build_game_sheets.py frames assets/images/juegos/3d` (arma las tiras y `manifest.json`).
4. Si cambian cuadros o anchos, actualiza la tabla `ANIMS` de `poses.js`.
