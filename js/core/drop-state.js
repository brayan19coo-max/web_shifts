import { DROP } from '../config.js';
import { storage } from '../utils/storage.js';

/**
 * Estado del drop compartido entre el bloqueo (drop-lock.js) y los precios
 * (price-tag.js). El estado se liga a la clave y a la fecha actuales: si
 * cambias cualquiera de las dos, el drop vuelve a aparecer bloqueado.
 */
export const release = new Date(DROP.releaseDate).getTime();
export const earlyAccess = DROP.earlyAccessDate ? new Date(DROP.earlyAccessDate).getTime() : null;

export const lockId = `${DROP.id}:${DROP.passwordHash.slice(0, 8)}:${DROP.releaseDate.slice(0, 10)}`;
export const unlockedKey = `${lockId}:unlocked`;
export const vaultSeenKey = `${lockId}:vault-seen`;

export const isReleased = () => Date.now() >= release;
export const hasCode = () => Boolean(storage.get(unlockedKey, false));
export const isEarlyOpen = () => earlyAccess != null && Date.now() >= earlyAccess;

/** ¿Este visitante ya puede comprar las prendas del drop? */
export const canBuyDrop = () => isReleased() || (hasCode() && isEarlyOpen());

const fmt = (time) =>
  new Date(time).toLocaleString('es-CO', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: DROP.timeZone });
export const releaseLabel = () => fmt(release);
export const earlyLabel = () =>
  new Date(earlyAccess).toLocaleString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: DROP.timeZone });
