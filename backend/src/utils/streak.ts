import { IUser } from "../models/User.js";

/**
 * Update streak for user based on completion in their timezone.
 * Simple Asia/Kolkata logic for MVP — uses UTC date comparison shifted.
 * Returns the updated streak object.
 */
export function calcStreak(user: Pick<IUser, "streak" | "timezone">, now = new Date()): { count: number; lastActiveDate: Date } {
  const tz = user.timezone ?? "Asia/Kolkata";
  // For MVP we treat dates in the user's timezone via Intl.
  // Compare calendar days in that zone.
  const toDayStr = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

  const todayStr = toDayStr(now);
  const last = user.streak?.lastActiveDate ? toDayStr(new Date(user.streak.lastActiveDate)) : null;

  if (!last) {
    return { count: 1, lastActiveDate: now };
  }
  if (last === todayStr) {
    // already counted today
    return { count: user.streak.count, lastActiveDate: user.streak.lastActiveDate as Date };
  }
  // Check if last was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = toDayStr(yesterday);
  if (last === yStr) {
    return { count: (user.streak.count ?? 0) + 1, lastActiveDate: now };
  }
  // break
  return { count: 1, lastActiveDate: now };
}
