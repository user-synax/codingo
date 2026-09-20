/**
 * Duolingo-style fast early levels for newbies to feel progression.
 * L1 0, L2 100, L3 250, L4 450, L5 700, then +150 each.
 * Returns level (1-indexed) for given XP, and XP thresholds.
 */

const THRESHOLDS = [0, 100, 250, 450, 700];
const STEP_AFTER = 150;

export function getLevelForXp(xp: number): number {
  const x = Math.max(0, Math.floor(xp));
  // Find highest threshold <= x
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (x >= THRESHOLDS[i]) {
      // For first 5 levels, level = i+1
      if (i < THRESHOLDS.length - 1) return i + 1;
      // Beyond L5, compute
      const beyond = x - THRESHOLDS[THRESHOLDS.length - 1];
      return THRESHOLDS.length + Math.floor(beyond / STEP_AFTER) + (beyond >= 0 ? 0 : 0);
    }
  }
  return 1;
}

// More precise for beyond L5: L5 is index 4 (700), so for xp >=700, level = 5 + floor((xp-700)/150)
export function getLevelForXpPrecise(xp: number): number {
  const x = Math.max(0, Math.floor(xp));
  if (x < 100) return 1;
  if (x < 250) return 2;
  if (x < 450) return 3;
  if (x < 700) return 4;
  // L5 starts at 700
  return 5 + Math.floor((x - 700) / STEP_AFTER);
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  if (level === 3) return 250;
  if (level === 4) return 450;
  if (level === 5) return 700;
  return 700 + (level - 5) * STEP_AFTER;
}

export function getXpToNextLevel(xp: number) {
  const lvl = getLevelForXpPrecise(xp);
  const next = lvl + 1;
  const curThresh = getXpForLevel(lvl);
  const nextThresh = getXpForLevel(next);
  return {
    level: lvl,
    nextLevel: next,
    curThresh,
    nextThresh,
    have: xp - curThresh,
    need: nextThresh - curThresh,
    progress: Math.min(1, Math.max(0, (xp - curThresh) / (nextThresh - curThresh))),
  };
}
