/** Envoltorio seguro de localStorage (modo privado, bloqueos, etc.). */
const PREFIX = 'shifts:';

export const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* sin almacenamiento: el sitio sigue funcionando */
    }
  },
};
