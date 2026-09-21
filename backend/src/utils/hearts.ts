import type { IUser } from "../models/User.js";

export const HEART_CAP = 3;
export const HEART_REGEN_MS = 4 * 60 * 60 * 1000; // 4h → 1 heart, 12h → 3 hearts
export const HEART_PRICE_SINGLE = 20; // CC per 1 heart
export const HEART_PRICE_FULL = 50; // CC per refill to 3
export const FREEZE_PRICE = 50; // CC per streak freeze
export const CC_PER_LESSON = 5;
export const CC_PERFECT_BONUS = 10;

export function calcHeartsState(
  user: Pick<IUser, "hearts" | "heartsUpdatedAt">,
  now = new Date(),
) {
  let hearts = Math.min(HEART_CAP, Math.max(0, user.hearts ?? HEART_CAP));
  let updatedAt = user.heartsUpdatedAt ? new Date(user.heartsUpdatedAt) : now;

  // New users with null updatedAt — initialize
  if (!user.heartsUpdatedAt) {
    return {
      hearts,
      heartsUpdatedAt: now,
      regenInMs: hearts >= HEART_CAP ? 0 : HEART_REGEN_MS,
      fullInMs: hearts >= HEART_CAP ? 0 : (HEART_CAP - hearts) * HEART_REGEN_MS,
      needsSave: true,
    };
  }

  if (hearts >= HEART_CAP) {
    return { hearts, heartsUpdatedAt: updatedAt, regenInMs: 0, fullInMs: 0, needsSave: false };
  }

  const elapsed = now.getTime() - updatedAt.getTime();
  if (elapsed < HEART_REGEN_MS) {
    return {
      hearts,
      heartsUpdatedAt: updatedAt,
      regenInMs: HEART_REGEN_MS - elapsed,
      fullInMs: (HEART_CAP - hearts) * HEART_REGEN_MS - elapsed,
      needsSave: false,
    };
  }

  const regen = Math.floor(elapsed / HEART_REGEN_MS);
  const newHearts = Math.min(HEART_CAP, hearts + regen);
  const newUpdatedAt = new Date(updatedAt.getTime() + regen * HEART_REGEN_MS);
  const remaining = HEART_REGEN_MS - (elapsed % HEART_REGEN_MS);
  return {
    hearts: newHearts,
    heartsUpdatedAt: newUpdatedAt,
    regenInMs: newHearts >= HEART_CAP ? 0 : remaining,
    fullInMs: newHearts >= HEART_CAP ? 0 : (HEART_CAP - newHearts) * HEART_REGEN_MS + remaining,
    needsSave: regen > 0,
  };
}

// Apply regen to user doc (mutates) and returns state
export function applyHeartsRegen(
  user: Pick<IUser, "hearts" | "heartsUpdatedAt"> & { hearts: number; heartsUpdatedAt: Date | null },
  now = new Date(),
) {
  const state = calcHeartsState(user, now);
  if (state.needsSave) {
    user.hearts = state.hearts;
    user.heartsUpdatedAt = state.heartsUpdatedAt;
  } else if (!user.heartsUpdatedAt) {
    user.heartsUpdatedAt = state.heartsUpdatedAt;
  }
  return state;
}
