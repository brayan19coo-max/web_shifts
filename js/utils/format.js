import { BRAND } from '../config.js';

const priceFormatter = new Intl.NumberFormat(BRAND.locale, {
  style: 'currency',
  currency: BRAND.currency,
  maximumFractionDigits: 0,
});

export const formatPrice = (value) => priceFormatter.format(value);

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const lerp = (a, b, t) => a + (b - a) * t;
