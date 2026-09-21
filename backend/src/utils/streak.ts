import { IUser } from "../models/User.js";

/**
 * Update streak for user based on completion in their timezone.
 * Supports streak freeze (CC item): if exactly one day was missed and
 * the user owns a freeze, it is consumed and the streak continues.
 * Returns the updated streak and whether a freeze was used.
 */
export function calcStreak(
  user: Pick<IUser, "streak" | "timezone" | "freezes">,
  now = new Date(),
): { count: number; lastActiveDate: Date; freezeUsed: boolean } {
  const tz = user.timezone ?? "Asia/Kolkata";
  const toDayStr = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

  const todayStr = toDayStr(now);
  const last = user.streak?.lastActiveDate ? toDayStr(new Date(user.streak.lastActiveDate)) : null;

  if (!last) {
    return { count: 1, lastActiveDate: now, freezeUsed: false };
  }
  if (last === todayStr) {
    return { count: user.streak.count, lastActiveDate: user.streak.lastActiveDate as Date, freezeUsed: false };
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = toDayStr(yesterday);
  if (last === yStr) {
    return { count: (user.streak.count ?? 0) + 1, lastActiveDate: now, freezeUsed: false };
  }
  // Exactly one missed day (last was day before yesterday) → try freeze
  const dayBeforeYesterday = new Date(now);
  dayBeforeYesterday.setDate(now.getDate() - 2);
  const y2Str = toDayStr(dayBeforeYesterday);
  const freezes = (user as unknown as { freezes?: number }).freezes ?? 0;
  if (last === y2Str && freezes > 0) {
    return { count: (user.streak.count ?? 0) + 1, lastActiveDate: now, freezeUsed: true };
  }
  // break
  return { count: 1, lastActiveDate: now, freezeUsed: false };
}
