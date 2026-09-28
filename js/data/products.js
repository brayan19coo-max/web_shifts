/**
 * CATÁLOGO
 * -------------------------------------------------------------
 * Agrega, quita o edita productos aquí.
 *
 * - type: forma de la ilustración cuando no hay foto
 *         ('tee' | 'hoodie' | 'jacket' | 'pants' | 'cap' | 'tote')
 * - images: (opcional) fotos reales por color, en el mismo orden que `colors`.
 *           Ej: images: ['assets/images/tee-negra.jpg', 'assets/images/tee-blanca.jpg']
 */

export const CATEGORIES = [
  { id: 'all', label: 'Todo' },
  { id: 'camisetas', label: 'Camisetas' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'chaquetas', label: 'Chaquetas' },
  { id: 'pantalones', label: 'Pantalones' },
  { id: 'accesorios', label: 'Accesorios' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export const PRODUCTS = [
  {
    id: 'tee-static',
    name: 'Tee Static',
    category: 'camisetas',
    type: 'tee',
    price: 89000,
    tag: 'Drop 01',
    description: 'Camiseta oversize en algodón peinado de 240 g. Estampado frontal en tinta de alta densidad.',
    colors: [
      { name: 'Negro', hex: '#161616' },
      { name: 'Hueso', hex: '#e9e4d8' },
      { name: 'Ácido', hex: '#d4ff3a' },
    ],
    sizes: SIZES,
  },
  {
    id: 'tee-glitch',
    name: 'Tee Glitch',
    category: 'camisetas',
    type: 'tee',
    price: 95000,
    tag: 'Nuevo',
    description: 'Corte boxy, cuello acanalado grueso y gráfico glitch en la espalda.',
    colors: [
      { name: 'Blanco', hex: '#f4f4f0' },
      { name: 'Rojo', hex: '#ff4d2e' },
    ],
    sizes: SIZES,
  },
  {
    id: 'hoodie-orbit',
    name: 'Hoodie Orbit',
    category: 'hoodies',
    type: 'hoodie',
    price: 189000,
    tag: 'Más vendido',
    description: 'Felpa perchada de 420 g, capucha doble y bolsillo canguro. Bordado tono sobre tono.',
    colors: [
      { name: 'Grafito', hex: '#2a2a2e' },
      { name: 'Oliva', hex: '#5d6b3a' },
      { name: 'Lila', hex: '#b9a6ff' },
    ],
    sizes: SIZES,
  },
  {
    id: 'hoodie-noise',
    name: 'Hoodie Noise',
    category: 'hoodies',
    type: 'hoodie',
    price: 199000,
    tag: 'Últimas unidades',
    description: 'Hoodie heavyweight con lavado vintage. Cada pieza queda única.',
    colors: [
      { name: 'Arena', hex: '#cdb892' },
      { name: 'Negro', hex: '#141414' },
    ],
    sizes: SIZES,
  },
  {
    id: 'jacket-shift',
    name: 'Chaqueta Shift',
    category: 'chaquetas',
    type: 'jacket',
    price: 279000,
    tag: 'Drop 01',
    description: 'Chaqueta coach en nylon repelente al agua con forro de malla y cremallera metálica.',
    colors: [
      { name: 'Negro', hex: '#101010' },
      { name: 'Azul eléctrico', hex: '#2f5bff' },
    ],
    sizes: SIZES,
  },
  {
    id: 'pants-cargo',
    name: 'Cargo Drift',
    category: 'pantalones',
    type: 'pants',
    price: 169000,
    tag: 'Nuevo',
    description: 'Pantalón cargo de bota ancha con seis bolsillos y cordón ajustable en el ruedo.',
    colors: [
      { name: 'Caqui', hex: '#8c7b58' },
      { name: 'Negro', hex: '#1b1b1b' },
    ],
    sizes: ['28', '30', '32', '34', '36'],
  },
  {
    id: 'pants-jogger',
    name: 'Jogger Loop',
    category: 'pantalones',
    type: 'pants',
    price: 139000,
    description: 'Jogger en felpa francesa con puño elástico y bolsillo trasero con cremallera.',
    colors: [
      { name: 'Gris jaspe', hex: '#9a9a9a' },
      { name: 'Grafito', hex: '#2a2a2e' },
    ],
    sizes: SIZES,
  },
  {
    id: 'cap-signal',
    name: 'Gorra Signal',
    category: 'accesorios',
    type: 'cap',
    price: 69000,
    tag: 'Drop 01',
    description: 'Gorra de seis paneles en sarga lavada, correa metálica y bordado 3D.',
    colors: [
      { name: 'Negro', hex: '#161616' },
      { name: 'Ácido', hex: '#d4ff3a' },
      { name: 'Hueso', hex: '#e9e4d8' },
    ],
    sizes: ['Única'],
  },
  {
    id: 'tote-carry',
    name: 'Tote Carry',
    category: 'accesorios',
    type: 'tote',
    price: 59000,
    description: 'Bolso tote en lona de 16 oz con bolsillo interno y serigrafía frontal.',
    colors: [
      { name: 'Crudo', hex: '#e6dcc4' },
      { name: 'Negro', hex: '#141414' },
    ],
    sizes: ['Única'],
  },
];

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}
