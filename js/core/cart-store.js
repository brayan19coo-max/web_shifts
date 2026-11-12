import { createStore } from './store.js';
import { storage } from '../utils/storage.js';
import { getProduct } from '../data/products.js';
import { canBuyDrop } from './drop-state.js';

const KEY = 'cart';

// Prendas de un drop que todavía no se puede comprar se sacan del carrito
// (por si alguien las agregó cuando el drop estaba abierto por error)
// Lo guardado en el navegador se revisa antes de usarlo (cantidades
// enteras y razonables, productos que existan)
const raw = storage.get(KEY, []);
const saved = (Array.isArray(raw) ? raw : [])
  .filter((item) => item && getProduct(item.id))
  .map((item) => ({ ...item, qty: Math.min(20, Math.max(1, Math.floor(Number(item.qty)) || 1)) }))
  .filter((item) => !getProduct(item.id).drop || canBuyDrop());
export const cartStore = createStore({ items: saved });

cartStore.subscribe((state) => storage.set(KEY, state.items));

const lineKey = (id, size, color) => `${id}|${size}|${color}`;

export function addItem({ id, size, color, qty = 1 }) {
  const key = lineKey(id, size, color);
  cartStore.set(({ items }) => {
    const existing = items.find((item) => item.key === key);
    return {
      items: existing
        ? items.map((item) => (item.key === key ? { ...item, qty: item.qty + qty } : item))
        : [...items, { key, id, size, color, qty }],
    };
  });
}

export function changeQty(key, delta) {
  cartStore.set(({ items }) => ({
    items: items
      .map((item) => (item.key === key ? { ...item, qty: item.qty + delta } : item))
      .filter((item) => item.qty > 0),
  }));
}

export function removeItem(key) {
  cartStore.set(({ items }) => ({ items: items.filter((item) => item.key !== key) }));
}

export function clearCart() {
  cartStore.set({ items: [] });
}

/** Líneas del carrito enriquecidas con el producto (descarta productos que ya no existen). */
export function getLines(items = cartStore.get().items) {
  return items
    .map((item) => ({ ...item, product: getProduct(item.id) }))
    .filter((line) => line.product);
}

export function getTotals(items = cartStore.get().items) {
  return getLines(items).reduce(
    (totals, line) => ({
      count: totals.count + line.qty,
      subtotal: totals.subtotal + line.qty * line.product.price,
    }),
    { count: 0, subtotal: 0 },
  );
}
