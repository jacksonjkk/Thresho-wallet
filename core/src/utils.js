export function isValidPublicKey(key) {
  return typeof key === 'string' && key.startsWith('G') && key.length >= 56;
}

export function isPositiveAmount(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
}

export function formatAmount(v) {
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 7 });
}

export function shortKey(k) {
  if (!k) return '';
  return k.slice(0, 5) + '…' + k.slice(-5);
}
