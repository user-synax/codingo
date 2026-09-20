import type { IUser } from "../models/User.js";

export type BadgeId = "first_lesson" | "five_lessons" | "perfect" | "streak_3" | "streak_7" | "night_owl";

export const BADGE_DEFS: Record<BadgeId, { title: string; desc: string; icon: string }> = {
  first_lesson: { title: "First Lesson", desc: "Complete your first lesson", icon: "target" },
  five_lessons: { title: "5 Lessons", desc: "Complete 5 lessons", icon: "book-open" },
  perfect: { title: "Perfect", desc: "100% on a lesson", icon: "star" },
  streak_3: { title: "3-Day Streak", desc: "3 days in a row", icon: "flame" },
  streak_7: { title: "Week Warrior", desc: "7-day streak", icon: "trophy" },
  night_owl: { title: "Night Owl", desc: "Study after 10pm", icon: "moon" },
};

export function checkBadges(user: Pick<IUser, "badges" | "streak" | "timezone">, ctx: { totalCompleted: number; isPerfect: boolean; now?: Date }): BadgeId[] {
  const now = ctx.now ?? new Date();
  const have = new Set(user.badges ?? []);
  const out: BadgeId[] = [];

  if (ctx.totalCompleted >= 1 && !have.has("first_lesson")) out.push("first_lesson");
  if (ctx.totalCompleted >= 5 && !have.has("five_lessons")) out.push("five_lessons");
  if (ctx.isPerfect && !have.has("perfect")) out.push("perfect");

  const streak = user.streak?.count ?? 0;
  if (streak >= 3 && !have.has("streak_3")) out.push("streak_3");
  if (streak >= 7 && !have.has("streak_7")) out.push("streak_7");

  // Night owl: 22:00-04:00 in user's timezone
  try {
    const tz = user.timezone ?? "Asia/Kolkata";
    const hourStr = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(now);
    const hour = Number(hourStr);
    const isNight = hour >= 22 || hour < 4;
    if (isNight && !have.has("night_owl")) out.push("night_owl");
  } catch {}

  return out;
}
