export function formatCoins(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1_000_000) return (n / 1000).toFixed(1) + "K";
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(1) + "M";
  return (n / 1_000_000_000).toFixed(1) + "B";
}

export function formatLeft(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return s + "s";
  return Math.floor(s / 60) + "m " + (s % 60) + "s";
}

export function levelOf(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function levelStart(level: number): number {
  return (level - 1) * (level - 1) * 50;
}

export function prestigeMult(p: number): number {
  return 1 + p * 0.1;
}
