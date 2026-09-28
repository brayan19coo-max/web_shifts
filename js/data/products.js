/**
 * CATÁLOGO DE PRODUCTOS
 * =============================================================
 * Para AGREGAR un producto: copia esta plantilla, pégala dentro de
 * la lista PRODUCTS (más abajo) y cambia los datos.
 *
 *   {
 *     id: 'hoodie-negro-graffiti',       // único, sin espacios ni tildes
 *     name: 'Hoodie Graffiti',           // nombre que se ve en la tienda
 *     category: 'hoodies',               // una de las categorías de CATEGORIES
 *     type: 'hoodie',                    // dibujo si no hay foto: tee | hoodie | jacket | pants | cap | tote
 *     price: 189000,                     // en pesos, sin puntos ni signo $
 *     tag: 'Nuevo',                      // etiqueta opcional (bórrala si no quieres)
 *     description: 'Texto que aparece en la vista rápida.',
 *     colors: [
 *       { name: 'Negro', hex: '#111111' },
 *       { name: 'Blanco', hex: '#f4f4f4' },
 *     ],
 *     sizes: ['S', 'M', 'L', 'XL'],      // o ['Única']
 *     images: [                          // opcional: una foto por color, mismo orden
 *       'assets/images/productos/hoodie-graffiti-negro.jpg',
 *       'assets/images/productos/hoodie-graffiti-blanco.jpg',
 *     ],
 *     drop: 'drop-02',                   // opcional: lo bloquea en el drop con clave
 *   },
 *
 * Reglas rápidas:
 * - Cada producto va entre { } y termina con una coma.
 * - Los textos van entre comillas simples '...'.
 * - Fotos: guárdalas en assets/images/productos/ (formato .jpg o .webp,
 *   cuadradas o verticales 4:5, fondo liso, idealmente < 300 KB).
 * - Para QUITAR un producto, borra su bloque { ... }, completo.
 * - Para sacar un producto del drop bloqueado, borra su línea `drop`.
 */

export const CATEGORIES = [
  { id: 'all', label: 'Todo' },
  { id: 'camisetas', label: 'Camisetas' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'chaquetas', label: 'Chaquetas' },
  { id: 'pantalones', label: 'Pantalones' },
  { id: 'accesorios', label: 'Accesorios' },
];

const SIZES = ['S', 'M', 'L', 'XL'];

const NEGRO = { name: 'Negro', hex: '#111111' };
const BLANCO = { name: 'Blanco', hex: '#f4f4f4' };
const GRIS = { name: 'Gris', hex: '#8a8a8a' };
const CARBON = { name: 'Carbón', hex: '#333333' };

export const PRODUCTS = [
  // ---------------- COLECCIÓN (Drop 01) ----------------
  {
    id: 'tee-tag',
    name: 'Tee Tag',
    category: 'camisetas',
    type: 'tee',
    price: 89000,
    tag: 'Drop 01',
    description: 'Camiseta oversize en algodón de 240 g con el logo Shift\'s estampado al frente.',
    colors: [NEGRO, BLANCO],
    sizes: SIZES,
  },
  {
    id: 'tee-wall',
    name: 'Tee Wall',
    category: 'camisetas',
    type: 'tee',
    price: 95000,
    tag: 'Nuevo',
    description: 'Corte boxy, cuello grueso y gráfico de muro pintado en la espalda.',
    colors: [BLANCO, GRIS],
    sizes: SIZES,
  },
  {
    id: 'hoodie-bomb',
    name: 'Hoodie Bomb',
    category: 'hoodies',
    type: 'hoodie',
    price: 189000,
    tag: 'Más vendido',
    description: 'Felpa perchada de 420 g, capucha doble y bolsillo canguro. Logo bordado.',
    colors: [NEGRO, CARBON, BLANCO],
    sizes: SIZES,
  },
  {
    id: 'jacket-crew',
    name: 'Chaqueta Crew',
    category: 'chaquetas',
    type: 'jacket',
    price: 279000,
    tag: 'Drop 01',
    description: 'Chaqueta coach en nylon repelente al agua con forro de malla.',
    colors: [NEGRO, BLANCO],
    sizes: SIZES,
  },
  {
    id: 'pants-cargo',
    name: 'Cargo Throw-Up',
    category: 'pantalones',
    type: 'pants',
    price: 169000,
    description: 'Pantalón cargo de bota ancha con seis bolsillos y cordón en el ruedo.',
    colors: [NEGRO, GRIS],
    sizes: ['28', '30', '32', '34', '36'],
  },
  {
    id: 'cap-piece',
    name: 'Gorra Piece',
    category: 'accesorios',
    type: 'cap',
    price: 69000,
    description: 'Gorra de seis paneles en sarga lavada con bordado 3D.',
    colors: [NEGRO, BLANCO],
    sizes: ['Única'],
  },
  {
    id: 'tote-can',
    name: 'Tote Can',
    category: 'accesorios',
    type: 'tote',
    price: 59000,
    description: 'Bolso tote en lona de 16 oz con el logo en serigrafía.',
    colors: [BLANCO, NEGRO],
    sizes: ['Única'],
  },

  // ---------------- DROP 02 (bloqueado con clave) ----------------
  {
    id: 'hoodie-night-shift',
    name: 'Hoodie Night Shift',
    category: 'hoodies',
    type: 'hoodie',
    price: 219000,
    tag: 'Drop 02',
    description: 'Edición limitada numerada. Estampado reflectivo que aparece con el flash.',
    colors: [NEGRO, CARBON],
    sizes: SIZES,
    drop: 'drop-02',
  },
  {
    id: 'tee-outline',
    name: 'Tee Outline',
    category: 'camisetas',
    type: 'tee',
    price: 99000,
    tag: 'Drop 02',
    description: 'Logo en contorno puff print, algodón pesado de 280 g.',
    colors: [BLANCO, NEGRO],
    sizes: SIZES,
    drop: 'drop-02',
  },
  {
    id: 'jacket-varsity',
    name: 'Varsity Shift',
    category: 'chaquetas',
    type: 'jacket',
    price: 349000,
    tag: 'Drop 02',
    description: 'Chaqueta varsity en paño con mangas en cuero sintético y parches bordados.',
    colors: [NEGRO, BLANCO],
    sizes: SIZES,
    drop: 'drop-02',
  },
];

/** Productos visibles en la tienda principal (sin los de drops bloqueados). */
export const CATALOG = PRODUCTS.filter((p) => !p.drop);

export const getDropProducts = (dropId) => PRODUCTS.filter((p) => p.drop === dropId);

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}
