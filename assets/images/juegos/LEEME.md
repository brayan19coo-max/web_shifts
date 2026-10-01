# Sprites, fondos y música de los juegos del arcade

Hoy los juegos usan dibujos hechos con código (provisionales). Esta es la lista de todo lo que hay que dibujar para que cada juego quede con su arte final.

## Reglas generales

- **Formato:** PNG con fondo transparente. Los fondos pueden ser JPG si no llevan transparencia.
- **Tamaño:** dibuja **al doble** del tamaño en que se ve (para pantallas retina). Las medidas de las tablas ya están al doble.
- **Animaciones = tira horizontal.** Todos los cuadros (frames) del mismo tamaño, uno al lado del otro, sin espacio entre ellos.
  - Ejemplo: `correr_6f.png` = 6 cuadros de 256×256, así que la imagen mide 1536×256.
  - El número antes de la `f` es la cantidad de cuadros.
- **El personaje en el mismo punto en todos los cuadros:** los pies siempre a la misma altura y el cuerpo centrado. Si no, "brinca" al animarse.
- **Estilo:** igual que Swaggy, con contorno negro grueso y colores planos. Paleta: negro, blanco, rojo `#e3151a`, dorado `#f2c14e`, azul jean y el café de Swaggy.
- **Carpetas:** `assets/images/juegos/<juego>/`. Lo compartido va en `assets/images/juegos/comun/`.
- **Fondos por capas (paralaje):** cada capa es una imagen ancha que **se repite de lado a lado sin que se note el corte** (el borde derecho empata con el izquierdo).
  - 3 capas: lejos (cielo y edificios lejanos), medio (edificios y muros) y cerca (piso, postes, cosas en primer plano).
  - Medida: 2048×1024 cada capa.

---

## 1. Comunes (los usan varios juegos)

| Archivo | Qué es | Cuadros | Tamaño por cuadro |
|---|---|---|---|
| `comun/swaggy-frente-feliz_4f.png` | Swaggy de frente, rebotando contento | 4 | 256×256 |
| `comun/swaggy-frente-celebra_6f.png` | Celebrando récord (brazos arriba, salto) | 6 | 256×256 |
| `comun/swaggy-frente-pierde_4f.png` | Perdió: se agarra la cabeza o se encoge de hombros | 4 | 256×256 |
| `comun/lata-blanca.png`, `lata-roja.png`, `lata-azul.png`, `lata-negra.png` | Latas de spray | 1 | 96×180 |
| `comun/lata-dorada_6f.png` | Lata dorada con brillo que gira | 6 | 96×180 |
| `comun/lata-mala.png` | Lata negra con X roja (la que quita vida) | 1 | 96×180 |
| `comun/salpicadura_6f.png` | Explosión de pintura (blanca; se tiñe por código) | 6 | 192×192 |
| `comun/pow_4f.png` | Golpe / choque (estrellas y "¡PUM!") | 4 | 192×192 |
| `comun/brillo_4f.png` | Destello de "¡PERFECTO!" | 4 | 128×128 |

## 2. 🚀 Swaggy Flap

| Archivo | Qué es | Cuadros | Tamaño |
|---|---|---|---|
| `flap/swaggy-vuela_4f.png` | Swaggy **de lado** volando con la lata de propulsor en la espalda (impulso → planea) | 4 | 256×256 |
| `flap/swaggy-choca_3f.png` | Se estrella y cae dando vueltas | 3 | 256×256 |
| `flap/chorro_4f.png` | Chorro de pintura que sale de la lata al impulsar | 4 | 128×64 |
| `flap/muro-cuerpo.png` | Pedazo de columna de ladrillo **repetible hacia arriba y abajo** | 1 | 160×128 |
| `flap/muro-tapa.png` | Borde de la columna con pintura escurrida (arriba y abajo) | 1 | 192×64 |
| `flap/fondo-<escenario>-{lejos,medio,cerca}.png` | Fondos por capas, uno por escenario | 1 | 2048×1024 |

**Escenarios** (cambian cada 10 muros): 1. Barrio de noche → 2. Azoteas al atardecer → 3. Túnel del metro → 4. Ciudad con neón → 5. Tormenta.

## 3. ⏱️ Tap the Drop

| Archivo | Qué es | Cuadros | Tamaño |
|---|---|---|---|
| `tapdrop/digito_0-9.png` | Números 0 al 9 estilo tablero, en una tira (cada número es un cuadro) | 10 | 128×192 |
| `tapdrop/digito-flip_4f.png` | Animación del número cambiando (la ficha que gira) | 4 | 128×192 |
| `tapdrop/swaggy-nervioso_4f.png` | Esperando, mirando el contador y sudando | 4 | 256×256 |
| `tapdrop/swaggy-perfecto_6f.png` | ¡Lo clavó! Salta y señala | 6 | 256×256 |
| `tapdrop/swaggy-falla_4f.png` | Se agarra la cabeza | 4 | 256×256 |
| `tapdrop/swaggy-dormido_4f.png` | "Te dormiste": cabecea con zzz | 4 | 256×256 |
| `tapdrop/fondo.jpg` | Escenario del lanzamiento (tarima con luces o bóveda) | 1 | 2048×1024 |

## 4. 👕 Stack Drop

Ojo: **las prendas se cortan por código**, así que cada una va en **3 partes**: borde izquierdo, centro que se repite y borde derecho.

| Archivo | Qué es | Cuadros | Tamaño |
|---|---|---|---|
| `stack/<prenda>-izq.png` | Borde izquierdo de la prenda doblada | 1 | 48×80 |
| `stack/<prenda>-centro.png` | Centro **repetible de lado a lado** (aquí va el estampado si lo hay) | 1 | 96×80 |
| `stack/<prenda>-der.png` | Borde derecho | 1 | 48×80 |
| `stack/caja-base.png` | Caja de la marca (la base de la pila) | 1 | 512×160 |
| `stack/swaggy-mira-arriba_4f.png` | Swaggy mirando la torre, nervioso | 4 | 256×256 |
| `stack/fondo-<altura>.png` | Fondo que cambia mientras sube la torre | 1 | 2048×1024 |

**Prendas** (`<prenda>`): `camiseta-blanca`, `camiseta-negra`, `camiseta-roja`, `hoodie-negro`, `hoodie-gris`, `jean`, `chaqueta`, `hoodie-dorado` (especial, cada 10).
**Alturas:** 1. Calle → 2. Edificios → 3. Azoteas → 4. Nubes → 5. Espacio (con estrellas).

## 5. 🌈 Combo Spray

| Archivo | Qué es | Cuadros | Tamaño |
|---|---|---|---|
| `combo/lata-<color>.png` | Las 5 latas del tablero: blanca, roja, dorada, azul y negra | 1 | 128×128 |
| `combo/lata-<color>-salta_4f.png` | La lata "rebotando" cuando la seleccionas | 4 | 128×128 |
| `combo/bomba_6f.png` | Lata especial "bomba de pintura" (aparece con 5 en fila) | 6 | 128×128 |
| `combo/marco.png` | Marco del tablero (muro con bordes de cinta) | 1 | 1024×1024 |
| `combo/fondo.jpg` | Fondo detrás del tablero | 1 | 2048×1024 |

## 6. 🚨 Esquiva al guardia

| Archivo | Qué es | Cuadros | Tamaño |
|---|---|---|---|
| `guardia/swaggy-pinta_6f.png` | Swaggy de lado o de 3/4 pintando el muro con la lata | 6 | 256×256 |
| `guardia/swaggy-disimula_4f.png` | Silbando, mirando para otro lado, lata escondida | 4 | 256×256 |
| `guardia/swaggy-pillado_3f.png` | ¡Lo pillaron! Brinca del susto | 3 | 256×256 |
| `guardia/guardia-espalda_4f.png` | Guardia de espaldas (respira, mira el celular) | 4 | 256×384 |
| `guardia/guardia-voltea_3f.png` | Empieza a voltear ("¿?") | 3 | 256×384 |
| `guardia/guardia-mira_2f.png` | Mirando con la linterna | 2 | 256×384 |
| `guardia/guardia-ey_3f.png` | Señalando: "¡EY, TÚ!" | 3 | 256×384 |
| `guardia/mural-<palabra>.png` | El graffiti **terminado** de cada muro (se revela mientras pintas) | 1 | 1600×600 |
| `guardia/fondo-<escenario>.jpg` | Fondo por escenario | 1 | 2048×1024 |

**Palabras:** SHIFT'S, SWAGGY, CREW, B&C, DROP 02, STYLE, LEY, PARCHE.
**Escenarios** (cada 2 muros): 1. Callejón → 2. Debajo del puente → 3. Estación del metro → 4. Azotea.
**Enemigos extra** (niveles altos, opcionales): perro guardián (`perro-*`) y cámara de seguridad (`camara-*`) con las mismas 4 animaciones del guardia.

## 7. 🎵 Ritmo Shift's

| Archivo | Qué es | Cuadros | Tamaño |
|---|---|---|---|
| `ritmo/swaggy-baila_8f.png` | Swaggy bailando **un paso que dura 2 tiempos** (loop) | 8 | 256×256 |
| `ritmo/swaggy-baila2_8f.png` | Segundo paso de baile (para variar) | 8 | 256×256 |
| `ritmo/swaggy-tropieza_3f.png` | Cuando fallas varias | 3 | 256×256 |
| `ritmo/nota-<carril>.png` | Lata que cae en cada carril (3 colores) | 1 | 96×180 |
| `ritmo/receptor.png` / `receptor-on.png` | Círculo de la línea de golpe, normal y presionado | 1 | 160×160 |
| `ritmo/fondo-<nivel>.jpg` | Tarima o escenario que cambia con la velocidad | 1 | 2048×1024 |

## 8. 🏃 Escape del muro

| Archivo | Qué es | Cuadros | Tamaño |
|---|---|---|---|
| `escape/swaggy-corre_6f.png` | Swaggy **de lado** corriendo (loop) | 6 | 256×256 |
| `escape/swaggy-salta_4f.png` | Impulso → arriba → bajando → aterriza | 4 | 256×256 |
| `escape/swaggy-voltereta_6f.png` | Doble salto (vuelta en el aire) | 6 | 256×256 |
| `escape/swaggy-golpe_3f.png` | Se tropieza | 3 | 256×256 |
| `escape/cono.png`, `caneca.png`, `valla.png` | Obstáculos | 1 | 128×192 · 160×200 · 256×224 |
| `escape/obstaculo-<escenario>.png` | Un obstáculo propio de cada escenario (ver abajo) | 1 | ~200×200 |
| `escape/fondo-<escenario>-{lejos,medio,cerca}.png` | Fondos por capas | 1 | 2048×1024 |

**Escenarios** (cada 300 puntos): 1. Calle con muro de graffiti → 2. Puente (obstáculo: bolardo) → 3. Metro (obstáculo: torniquete) → 4. Azoteas (obstáculo: aire acondicionado) → 5. Lluvia de noche.

## 9. 🥫 Atrapa la lata

| Archivo | Qué es | Cuadros | Tamaño |
|---|---|---|---|
| `atrapa/swaggy-camina_4f.png` | Swaggy de frente moviéndose de lado a lado | 4 | 256×256 |
| `atrapa/swaggy-atrapa_3f.png` | Atrapa una lata | 3 | 256×256 |
| `atrapa/fondo.jpg` | Fondo | 1 | 2048×1024 |

---

## 🎧 Música y sonidos de los juegos

Van en `assets/sounds/juegos/`. Formato **.mp3** (128–192 kbps). Las de loop deben **empatar al final con el comienzo**, sin silencio.

| Archivo | Qué es | Duración | Notas |
|---|---|---|---|
| `arcade-menu.mp3` | Música del arcade (menú) | loop 30–60 s | Tranqui, hip hop lo-fi |
| `juego-1.mp3` | Música de juego (rápida) | loop 60–90 s | Para Flap, Escape y Stack |
| `juego-2.mp3` | Música de juego (tensión) | loop 60–90 s | Para Guardia y Tap the Drop |
| `juego-3.mp3` | Música de juego (alegre) | loop 60–90 s | Para Combo Spray y Atrapa la lata |
| `ritmo-100.mp3`, `ritmo-120.mp3`, `ritmo-140.mp3` | Canciones para Ritmo Shift's | 60–120 s | **Decirme el BPM exacto de cada una** y que arranque justo en el primer golpe, sin silencio al inicio |
| `nivel.mp3` | Subiste de nivel / nuevo escenario | < 2 s | |
| `record.mp3` | Récord nuevo | 2–3 s | |
| `perdiste.mp3` | Fin del juego | 1–2 s | |
| `salto.mp3`, `golpe.mp3`, `moneda.mp3`, `spray-largo.mp3` | Efectos de juego | < 1 s | `spray-largo` en loop, para Guardia |

Mientras no estén los archivos, cada juego usa música hecha con código (`js/components/swaggy/games/music.js`) y los sonidos actuales del sitio.
