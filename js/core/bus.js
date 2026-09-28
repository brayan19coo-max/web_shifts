/**
 * Bus de eventos global: permite que los módulos se comuniquen
 * sin importarse entre sí (p.ej. la tarjeta de producto pide abrir
 * la vista rápida sin conocer su implementación).
 */
const listeners = new Map();

export const bus = {
  on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return () => listeners.get(event).delete(handler);
  },
  emit(event, payload) {
    listeners.get(event)?.forEach((handler) => handler(payload));
  },
};
