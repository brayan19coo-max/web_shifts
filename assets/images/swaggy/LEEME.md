# Cómo dibujar a Swaggy para que quede animado

En la web, Swaggy no es una imagen quieta: es un **muñeco por partes**. La cola, los brazos, la cabeza, las orejas, los ojos y los lentes se mueven cada uno por su lado. Por eso el dibujo tiene que venir **por capas**.

Archivos de esta carpeta:
- `swaggy-plantilla.svg`: la plantilla. Ábrela con **Inkscape** (gratis). Ya tiene todas las capas con su nombre y el dibujo provisional adentro.
- `guia-swaggy.png`: imagen de referencia con los puntos de giro, los 6 ánimos y las poses.

## Reglas

1. **Formato: vector (SVG).** Nada de PNG ni JPG pegados adentro, ni filtros de desenfoque o sombras. Colores planos; las sombras y los brillos van como formas aparte dentro de la misma capa.
2. **Mismo lienzo y misma posición.** El lienzo es de 200 × 240. Swaggy de frente, de pie y centrado, más o menos del mismo tamaño que el provisional. Así los puntos de giro (los puntos rosados de la capa "GUÍA") caen en su sitio. Si alguna parte queda en otro lugar, no pasa nada: me dices y muevo el punto.
3. **Dibuja cada parte en su capa y no cambies los nombres.** Borra la forma provisional y dibuja la tuya dentro de la misma capa.
4. **Cada parte completa, aunque quede tapada.**
   - El cuerpo va entero detrás de los brazos.
   - La cabeza va entera detrás de los lentes.
   - **Los ojos se dibujan debajo de los lentes**, porque a veces se sube los lentes y guiña.
5. **Los brazos se dibujan colgando, saliendo del hombro.** Las poses de saludar y bailar se hacen girándolos desde el hombro, así que no hay que dibujarlas. Los **brazos cruzados** van aparte, en su propia capa, porque esa pose no sale de girar.
6. **Ánimos: solo cambian las cejas y la boca.** Hay una capa de cejas y una de boca por cada ánimo: normal, feliz, molesto, celebrando, dormido y triste. Para dibujar una, muéstrala con el ojito de la capa; las demás pueden quedar ocultas.
7. **Extras:** lágrima (triste), zzz (dormido) y notas musicales (bailando). Son opcionales; si no los dibujas, se dejan los actuales.
8. **Pupilas aparte del ojo blanco.** Así siguen al cursor.

## Capas (de atrás hacia adelante)

| Capa | Qué va | Cómo se mueve |
|---|---|---|
| `cola` | La cola | Se menea desde la base |
| `cuerpo` | Cuerpo y barriga | Respira |
| `cadena` | Cadena con la cruz | Va con el cuerpo |
| `pie-izq`, `pie-der` | Pies | Zapatean al bailar |
| `brazos-cruzados` | Pose de brazos cruzados | Aparece cuando está tranqui |
| `brazo-izq`, `brazo-der` | Cada brazo colgando | Giran desde el hombro: saludar, bailar, subirse los lentes |
| `cabeza-todo` | Grupo con todo lo de la cabeza | Sigue al cursor, asiente, mira a los lados |
| ↳ `oreja-izq`, `oreja-der` | Orejas | Se sacuden |
| ↳ `cabeza` | Cabeza y hocico | — |
| ↳ `nariz` | Nariz | Olfatea |
| ↳ `bigotes` | Bigotes | Se mueven |
| ↳ `ojo-izq`, `ojo-der` (+ `pupila-…`) | Ojos debajo de los lentes | Guiñan; las pupilas miran |
| ↳ `cejas-…` | Cejas de cada ánimo | Cambian con el ánimo |
| ↳ `lentes` | Lentes deportivos | Se los sube; les pasa un brillo |
| ↳ `boca-…` | Boca de cada ánimo | Cambia con el ánimo |
| `extras` | Lágrima, zzz, notas | Aparecen según el ánimo |

## Cuando esté listo

En Inkscape: **Archivo → Guardar como → "SVG de Inkscape"**. Súbelo a esta carpeta con el nombre **`swaggy.svg`** y avisa: lo conecto a la web y queda animado en todos lados (el parche, el botón, la página, la bóveda y el juego).
