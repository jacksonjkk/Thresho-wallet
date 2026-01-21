export function startPoller(fn, intervalMs = 12000) {
  const id = setInterval(() => fn().catch(() => {}), intervalMs);
  return () => clearInterval(id);
}
