/* Mirrors backend/src/utils/level.ts — fast early levels */
export function getLevelForXp(xp) {
  const x = Math.max(0, Math.floor(xp ?? 0));
  if (x < 100) return 1;
  if (x < 250) return 2;
  if (x < 450) return 3;
  if (x < 700) return 4;
  return 5 + Math.floor((x - 700) / 150);
}
export function getXpForLevel(level) {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  if (level === 3) return 250;
  if (level === 4) return 450;
  if (level === 5) return 700;
  return 700 + (level - 5) * 150;
}
export function getXpProgress(xp) {
  const lvl = getLevelForXp(xp);
  const cur = getXpForLevel(lvl);
  const next = getXpForLevel(lvl + 1);
  const have = xp - cur;
  const need = next - cur;
  return { level: lvl, nextLevel: lvl + 1, cur, next, have, need, progress: Math.min(1, Math.max(0, have / need)) };
}
