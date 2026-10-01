# Sprites, fondos y música de los juegos del arcade (actualizado)

Hoy los juegos usan dibujos hechos con código. Esta es la lista de todo lo que hay que dibujar para el arte final. **Versión actualizada:** incluye las animaciones de Swaggy que ya usan los juegos, los escenarios compartidos, los obstáculos de cada escenario, el perro y la cámara del guardia, y las tarimas de Ritmo. También está en imagen: `tabla-sprites-1.png`, `-2.png` y `-3.png` en esta carpeta.

## Reglas generales

- PNG con fondo transparente (los fondos pueden ser JPG). Dibujar al DOBLE del tamaño en que se ve.
- Animación = tira horizontal: todos los cuadros del mismo tamaño, uno al lado del otro. correr_6f.png = 6 cuadros de 256×256 → 1536×256.
- El personaje en el mismo punto en todos los cuadros: pies a la misma altura y cuerpo centrado.
- Estilo de Swaggy: contorno negro grueso, colores planos. Paleta: negro, blanco, rojo #e3151a, dorado #f2c14e, azul jean y el café de Swaggy.
- Carpeta: assets/images/juegos/<carpeta>/ con el nombre exacto de la tabla. Si una animación te queda con más o menos cuadros, cambia el número del nombre (_6f, _8f…) y avísame.

## 1. Swaggy: animaciones (todas las usan los juegos)

De frente, igual que el muñeco de la página. Cada animación es una tira horizontal. Los nombres coinciden con las animaciones que ya están en el código (js/components/swaggy/games/poses.js): cuando subas los PNG, los conecto en su lugar.

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `swaggy/correr_6f.png` | Corriendo (loop). Para Escape del muro puede ser de lado | 6 | 256×256 | Escape del muro |
| `swaggy/saltar_2f.png` | Impulso y subida, brazos arriba | 2 | 256×256 | Escape del muro |
| `swaggy/caer_2f.png` | Bajando, brazos abiertos para aterrizar | 2 | 256×256 | Escape del muro |
| `swaggy/voltereta_6f.png` | Voltereta del doble salto (vuelta completa) | 6 | 256×256 | Escape del muro |
| `swaggy/golpe_3f.png` | Se tropieza o lo golpean (cara molesta) | 3 | 256×256 | Escape, Flap, Guardia, Ritmo, Atrapa, Tap the Drop |
| `swaggy/aletear_2f.png` | Impulso con la lata propulsora: brazos de arriba a abajo | 2 | 256×256 | Swaggy Flap |
| `swaggy/planear_2f.png` | Planeando con los brazos abiertos | 2 | 256×256 | Swaggy Flap |
| `swaggy/bailar_8f.png` | Paso de baile que dura 2 tiempos (va sincronizado al beat) | 8 | 256×256 | Ritmo Shift's |
| `swaggy/bailar2_8f.png` | Segundo paso de baile (el otro Swaggy) | 8 | 256×256 | Ritmo Shift's |
| `swaggy/celebrar_4f.png` | Brazos arriba bombeando, saltando | 4 | 256×256 | Stack, Guardia, Tap the Drop, fin de juego |
| `swaggy/nervioso_4f.png` | Manitos juntas, temblando, sudando | 4 | 256×256 | Tap the Drop, Stack (torre alta) |
| `swaggy/triste_2f.png` | Cabeza gacha, lagrimita | 2 | 256×256 | Stack (se cayó), perder |
| `swaggy/pintar_4f.png` | Pintando el muro: brazo derecho estirado con la lata, el izquierdo en la cintura | 4 | 256×256 | Esquiva al guardia |
| `swaggy/disimular_4f.png` | Brazos cruzados, lata escondida, silbando y mirando para otro lado | 4 | 256×256 | Esquiva al guardia |
| `swaggy/caminar_4f.png` | Caminando de lado a lado (de frente) | 4 | 256×256 | Atrapa la lata |
| `swaggy/quieto_4f.png` | Respirando tranqui (loop) | 4 | 256×256 | Varios |
| `swaggy/atrapar_2f.png` | Atrapa algo con los brazos arriba | 2 | 256×256 | Atrapa la lata |
| `swaggy/guinar_4f.png` | Se sube los lentes y guiña | 4 | 256×256 | Extra |
| `swaggy/lata-propulsor_4f.png` | Lata en la espalda con el chorro de pintura | 4 | 128×128 | Swaggy Flap |

## 2. Comunes

Los usan varios juegos.

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `comun/lata-blanca.png · lata-roja.png · lata-azul.png · lata-negra.png` | Latas de spray | 1 | 96×180 | Varios |
| `comun/lata-dorada_6f.png` | Lata dorada con brillo que gira | 6 | 96×180 | Flap, Escape, Atrapa |
| `comun/lata-mala.png` | Lata negra con X roja (quita vida) | 1 | 96×180 | Atrapa la lata |
| `comun/salpicadura_6f.png` | Explosión de pintura en blanco (se tiñe por código) | 6 | 192×192 | Varios |
| `comun/pow_4f.png` | Golpe / choque | 4 | 192×192 | Varios |
| `comun/brillo_4f.png` | Destello de ¡PERFECTO! | 4 | 128×128 | Stack, Tap the Drop, Ritmo |

## 3. Escenarios compartidos (fondos por capas)

Los usan Escape del muro, Swaggy Flap y Esquiva al guardia. Cada escenario lleva 3 capas que se repiten de lado a lado sin que se note el corte: lejos (cielo y skyline), medio (muros, puente, letreros) y cerca (postes, columnas). Tamaño de cada capa: 2048×1024.

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `escenarios/barrio-{lejos,medio,cerca}.png` | Barrio de noche: luna, edificios con ventanas, muro con graffitis, postes de luz | 1 c/u | 2048×1024 | Escape, Flap, Guardia (callejón) |
| `escenarios/puente-{lejos,medio,cerca}.png` | El puente: arcos y cables, agua con reflejos | 1 c/u | 2048×1024 | Escape, Guardia |
| `escenarios/metro-{lejos,medio,cerca}.png` | El metro: baldosas, franja roja con letreros LÍNEA S, luces del techo, columnas | 1 c/u | 2048×1024 | Escape, Flap, Guardia |
| `escenarios/azoteas-{lejos,medio,cerca}.png` | Azoteas al atardecer: sol grande, tanques de agua, antenas | 1 c/u | 2048×1024 | Escape, Flap, Guardia |
| `escenarios/neon-{lejos,medio,cerca}.png` | Ciudad neón: letreros SHIFT'S, 24H, B&C, CREW (dibujarlos aparte si van a titilar) | 1 c/u | 2048×1024 | Escape, Flap, Guardia |
| `escenarios/tormenta-{lejos,medio,cerca}.png` | Tormenta: cielo oscuro y muro mojado (la lluvia y los rayos van por código) | 1 c/u | 2048×1024 | Escape, Flap, Guardia |

## 4. 🚀 Swaggy Flap

Escenarios: barrio → azoteas → metro → neón → tormenta (cada 10 muros).

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `flap/muro-cuerpo-<escenario>.png` | Pedazo de columna repetible hacia arriba y abajo, uno por escenario (ladrillo, morado, baldosa, negro con neón, azul mojado) | 1 | 160×128 | Swaggy Flap |
| `flap/muro-tapa-<escenario>.png` | Borde de la columna con pintura escurrida, del color del escenario | 1 | 192×64 | Swaggy Flap |
| `flap/flecha-mueve.png` | Aviso ↕ de los muros que suben y bajan | 1 | 64×64 | Swaggy Flap |

## 5. 🏃 Escape del muro

Escenarios: barrio → puente → metro → azoteas → tormenta → neón (cada 300 puntos). Cada uno trae su obstáculo.

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `escape/cono.png` | Cono de tránsito blanco y rojo | 1 | 128×192 | Todos |
| `escape/caneca.png` | Caneca de basura con la S | 1 | 160×200 | Todos |
| `escape/valla.png` | Valla de obra a rayas | 1 | 256×224 | Todos |
| `escape/bolardo.png` | Bolardo amarillo y negro | 1 | 128×160 | El puente |
| `escape/torniquete.png` | Torniquete del metro | 1 | 160×240 | El metro |
| `escape/aire_2f.png` | Aire acondicionado con ventilador que gira | 2 | 224×192 | Azoteas |
| `escape/charco_3f.png` | Charco con ondas | 3 | 288×64 | Tormenta |
| `escape/patineta.png` | Patineta SHIFT'S | 1 | 224×80 | Ciudad neón |
| `escape/piso-<escenario>.png` | Franja de piso repetible, una por escenario | 1 | 512×128 | Escape del muro |

## 6. 👕 Stack Drop

Las prendas se cortan por código: cada una en 3 partes (borde izq, centro repetible, borde der). El fondo sube con la torre: calle → edificios → azoteas → nubes → espacio.

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `stack/<prenda>-izq.png · -centro.png · -der.png` | Prendas dobladas: camiseta-blanca, camiseta-negra, camiseta-roja, hoodie-negro, hoodie-gris, jean, hoodie-dorado (especial cada 10) | 1 c/u | 48×80 · 96×80 · 48×80 | Stack Drop |
| `stack/caja-base.png` | Caja de la marca (base de la pila) | 1 | 512×160 | Stack Drop |
| `stack/ciudad-alta.png` | Edificios muy altos (se van quedando abajo al subir) | 1 | 2048×2048 | Stack Drop |
| `stack/nube-1.png · nube-2.png · nube-3.png` | Nubes sueltas | 1 c/u | ~400×200 | Stack Drop |
| `stack/planeta.png` | Planeta rojo con anillo | 1 | 400×400 | Stack Drop (espacio) |
| `stack/estrellas.png` | Estrellas repetibles | 1 | 1024×1024 | Stack Drop (espacio) |

## 7. 🚨 Esquiva al guardia

Escenarios compartidos (sección 3), cada 2 muros. Perro desde el muro 3 y cámara desde el muro 5.

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `guardia/guardia-espalda_4f.png` | Guardia de espaldas (respira, mira el celular) | 4 | 256×384 | Guardia |
| `guardia/guardia-voltea_3f.png` | Empieza a voltear (¿?) | 3 | 256×384 | Guardia |
| `guardia/guardia-mira_2f.png` | Mirando con la linterna | 2 | 256×384 | Guardia |
| `guardia/guardia-ey_3f.png` | Señalando: ¡EY, TÚ! | 3 | 256×384 | Guardia |
| `guardia/perro-duerme_4f.png` | Perro dormido respirando (con zzz) | 4 | 256×160 | Desde el muro 3 |
| `guardia/perro-alerta_2f.png` | Abre un ojo y para la oreja (ruido alto) | 2 | 256×160 | Desde el muro 3 |
| `guardia/perro-ladra_4f.png` | Se para y ladra | 4 | 256×192 | Desde el muro 3 |
| `guardia/camara_2f.png` | Cámara de seguridad con luz roja que titila | 2 | 160×128 | Desde el muro 5 |
| `guardia/muro-pintar.png` | Muro de ladrillo donde se pinta (repetible) | 1 | 512×512 | Guardia |
| `guardia/mural-<palabra>.png` | Graffiti terminado de cada muro (se revela al pintar): SHIFT'S, SWAGGY, CREW, B&C, DROP 02, STYLE, LEY, PARCHE | 1 c/u | 1600×600 | Guardia |

## 8. 🎵 Ritmo Shift's

5 tarimas que cambian con la velocidad del beat.

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `ritmo/tarima-garaje.jpg` | Garaje con bombillo colgando | 1 | 2048×1024 | Nivel 1 |
| `ritmo/tarima-blockparty.jpg` | Block party con guirnaldas de bombillos | 1 | 2048×1024 | Nivel 2 |
| `ritmo/tarima-disco.jpg` | Disco con bola de espejos | 1 | 2048×1024 | Nivel 3 |
| `ritmo/tarima-concierto.jpg` | Tarima con reflectores y pantalla SHIFT'S | 1 | 2048×1024 | Nivel 4 |
| `ritmo/tarima-festival.jpg` | Festival (los láseres van por código) | 1 | 2048×1024 | Nivel 5 |
| `ritmo/publico_2f.png` | Fila de público en silueta (abajo / saltando), repetible de lado | 2 | 1024×256 | Niveles 2 a 5 |
| `ritmo/bola-disco_4f.png` | Bola de espejos girando | 4 | 128×128 | La disco |
| `ritmo/nota-blanca.png · nota-roja.png · nota-dorada.png` | Lata que cae en cada carril | 1 c/u | 96×180 | Ritmo |
| `ritmo/receptor.png · receptor-on.png` | Círculo de la línea de golpe (normal y presionado) | 1 c/u | 160×160 | Ritmo |

## 9. ⏱️ Tap the Drop

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `tapdrop/digitos_10f.png` | Números 0 a 9 estilo tablero (cada número es un cuadro) | 10 | 128×192 | Tap the Drop |
| `tapdrop/digito-flip_4f.png` | Ficha que gira cuando cambia el número | 4 | 128×192 | Tap the Drop |
| `tapdrop/fondo.jpg` | Escenario del lanzamiento | 1 | 2048×1024 | Tap the Drop |

## 10. 🌈 Combo Spray

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `combo/lata-<color>.png` | Las 5 latas: blanca, roja, dorada, azul, negra | 1 c/u | 128×128 | Combo Spray |
| `combo/lata-<color>-salta_4f.png` | Lata rebotando al seleccionarla | 4 | 128×128 | Combo Spray |
| `combo/bomba_6f.png` | Bomba de pintura (fila de 5) | 6 | 128×128 | Combo Spray |
| `combo/marco.png` | Marco del tablero | 1 | 1024×1024 | Combo Spray |
| `combo/fondo.jpg` | Fondo | 1 | 2048×1024 | Combo Spray |

## 11. 🥫 Atrapa la lata

Usa las latas comunes y las animaciones caminar, atrapar y golpe.

| Archivo | Qué es | Cuadros | Tamaño por cuadro | Dónde se usa |
|---|---|---|---|---|
| `atrapa/fondo.jpg` | Fondo | 1 | 2048×1024 | Atrapa la lata |

## 🎧 Música y sonidos

Van en `assets/sounds/juegos/`, en .mp3. Los loops deben empatar el final con el comienzo. Mientras no estén, cada juego usa la música hecha con código (`js/components/swaggy/games/music.js`).

| Archivo | Para qué | Duración | Notas |
|---|---|---|---|
| `arcade-menu.mp3` | Música del arcade (menú) | loop 30–60 s | Tranqui, lo-fi |
| `juego-rapido.mp3` | Flap y Escape del muro | loop 60–90 s | Rápida (~128 BPM) |
| `juego-tension.mp3` | Guardia y Tap the Drop | loop 60–90 s | Sigilosa (~100 BPM) |
| `juego-calle.mp3` | Stack, Combo Spray y Atrapa la lata | loop 60–90 s | Boom bap (~90 BPM) |
| `ritmo-96.mp3 … ritmo-156.mp3` | Ritmo Shift's (sube 6 BPM cada 16 tiempos) | 60–120 s | Decirme el BPM exacto; sin silencio al inicio |
| `nivel.mp3 · record.mp3 · perdiste.mp3` | Jingles | < 3 s |  |
| `salto.mp3 · golpe.mp3 · moneda.mp3 · spray-largo.mp3 · ladrido.mp3` | Efectos de juego | < 1 s | spray-largo en loop |
