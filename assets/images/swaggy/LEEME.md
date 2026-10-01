# Cómo dibujar a Swaggy para que quede animado

En la web, Swaggy no es una imagen quieta: es un **muñeco articulado**. Tiene hombros, codos y muñecas, una cola de 3 partes, y cabeza, orejas, ojos, cejas, cachetes, boca y lentes que se mueven cada uno por su lado. Por eso el dibujo tiene que venir **por capas**.

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
5. **Los brazos se dibujan colgando y en 3 partes: brazo, antebrazo y mano.** Cada una va en su capa, metida dentro de la anterior, como ya viene en la plantilla. Las partes deben **montarse un poquito en cada articulación** (hombro, codo y muñeca) para que no se abra un hueco al doblarse; lo más fácil es terminarlas redondeadas en esa punta. Saludar, bailar, celebrar, poner las manos en la cintura y subirse los lentes salen solos al girar, así que esas poses no hay que dibujarlas. Los **brazos cruzados** van aparte, en su propia capa, porque esa pose no sale de girar.
6. **Ánimos: solo cambian las cejas y la boca.** Hay una capa de cejas y una de boca por cada ánimo: normal, feliz, molesto, celebrando, dormido y triste. Para dibujar una, muéstrala con el ojito de la capa; las demás pueden quedar ocultas.
7. **Extras:** lágrima (triste), zzz (dormido) y notas musicales (bailando). Son opcionales; si no los dibujas, se dejan los actuales.
8. **Pupilas aparte del ojo blanco.** Así siguen al cursor.
9. **Cola en 3 partes** (base, mitad y punta), una dentro de otra y montadas en las uniones, igual que los brazos. Así se menea como una ola.
10. **La boca debe verse bien aunque se aplaste.** Cuando habla, la boca se achata y se estira muy rápido.

## Capas (de atrás hacia adelante)

| Capa | Qué va | Cómo se mueve |
|---|---|---|
| `cola` → `cola-2` → `cola-3` | Base, mitad y punta de la cola | Se menea como una ola |
| `cuerpo` | Cuerpo y barriga | Respira |
| `cadena` | Cadena con la cruz | Va con el cuerpo |
| `pie-izq`, `pie-der` | Pies | Zapatean al bailar |
| `brazos-cruzados` | Pose de brazos cruzados | Aparece cuando está tranqui |
| `brazo-…` → `antebrazo-…` → `mano-…` | Brazo, antebrazo y mano (izq y der) | Giran desde el hombro, el codo y la muñeca |
| `cabeza-todo` | Grupo con todo lo de la cabeza | Sigue al cursor, asiente, mira a los lados |
| ↳ `oreja-izq`, `oreja-der` | Orejas | Se sacuden |
| ↳ `cabeza` | Cabeza y hocico | — |
| ↳ `nariz` | Nariz | Olfatea |
| ↳ `bigotes` | Bigotes | Se mueven |
| ↳ `ojo-izq`, `ojo-der` (+ `pupila-…`) | Ojos debajo de los lentes | Guiñan; las pupilas miran |
| ↳ `cachetes` | Rubor | Aparece cuando está feliz |
| ↳ `cejas-…` | Cejas de cada ánimo | Cambian con el ánimo y se levantan cuando se sorprende |
| ↳ `lentes` | Lentes deportivos | Se los sube; les pasa un brillo |
| ↳ `boca-…` | Boca de cada ánimo | Cambia con el ánimo y se mueve cuando habla |
| `extras` | Lágrima, zzz, notas | Aparecen según el ánimo |

## Cuando esté listo

En Inkscape: **Archivo → Guardar como → "SVG de Inkscape"**. Súbelo a esta carpeta con el nombre **`swaggy.svg`** y avisa: lo conecto a la web y queda animado en todos lados (el parche, el botón, la página, la bóveda y el juego).
