import { getCurrentUser } from "@/lib/auth";
import { getXpProgress } from "@/lib/level";
import { BADGE_DEFS, ALL_BADGES } from "@/lib/badges";
import { Flame, Trophy, Target, BookOpen, Star, Moon, Check, Lock } from "lucide-react";

const BADGE_ICONS = {
  first_lesson: Target,
  five_lessons: BookOpen,
  perfect: Star,
  streak_3: Flame,
  streak_7: Trophy,
  night_owl: Moon,
};

function StreakCalendar({ streak }) {
  const count = streak?.count ?? 0;
  const now = new Date();
  // Anchor fills to lastActiveDate so "today" ticks when active today,
  // not the oldest day in the 7-day window.
  const toDayStr = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const lastActive = streak?.lastActiveDate ? new Date(streak.lastActiveDate) : null;
  const activeToday = lastActive ? toDayStr(lastActive) === toDayStr(now) : count > 0;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const activeYesterday = lastActive ? toDayStr(lastActive) === toDayStr(yesterday) : false;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const isToday = i === 0;
    let filled = false;
    if (count > 0 && activeToday) {
      filled = i < count;
    } else if (count > 0 && activeYesterday) {
      filled = i >= 1 && i <= count;
    }
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    days.push({ date: d, label, isToday, filled });
  }

  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3">
      {days.map((day, idx) => (
        <div key={idx} className="flex flex-col items-center gap-1.5 sm:gap-2">
          <span
            className={`flex h-[48px] w-[48px] items-center justify-center rounded-full border-[2.5px] text-[15px] font-black leading-none shadow-sm transition-colors sm:h-[56px] sm:w-[56px] sm:text-[16px] ${
              day.filled
                ? "border-eager-green bg-eager-green text-paper-white shadow-[0_3px_0_var(--color-deep-leaf)]"
                : day.isToday
                  ? "border-charcoal bg-paper-white text-charcoal shadow-[0_3px_0_rgba(0,0,0,0.1)]"
                  : "border-faded-gray bg-paper-white text-pencil-gray"
            }`}
          >
            {day.filled ? <Check className="h-[22px] w-[22px] sm:h-[24px] sm:w-[24px]" strokeWidth={2.8} aria-hidden="true" /> : <span className="font-codingo-sans text-[14px] font-black sm:text-[15px]">{day.label.slice(0, 1)}</span>}
          </span>
          <span className={`font-codingo-sans text-[12px] font-bold leading-none sm:text-[13px] ${day.isToday ? "text-charcoal" : "text-pencil-gray"}`}>{day.label}</span>
          <span className="hidden font-codingo-sans text-[11px] font-medium leading-none text-pencil-gray sm:block sm:text-[12px]">
            {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const xpInfo = getXpProgress(user?.xp ?? 0);
  const badges = user?.badges ?? [];

  return (
    <div className="mx-auto w-full max-w-[1100px] flex flex-col gap-6">
      <div className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[16px] border-2 border-faded-gray bg-charcoal font-feather text-[28px] font-black leading-none text-paper-white">
            {(user?.username?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="font-codingo-sans text-[24px] font-black leading-[1.1] text-charcoal">{user?.name ?? user?.username}</h1>
            <p className="font-codingo-sans text-[14px] font-medium leading-[1.2] text-pencil-gray">@{user?.username} · {user?.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4e6] px-3 py-1.5 font-codingo-sans text-[12px] font-black leading-none text-[#b91c1c]">
                <Flame className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                {user?.streak?.count ?? 0} day streak
              </span>
              <span className="rounded-full bg-storybook-green px-3 py-1.5 font-codingo-sans text-[12px] font-black leading-none text-charcoal">{user?.xp ?? 0} XP</span>
              <span className="rounded-full bg-spark-blue px-3 py-1.5 font-codingo-sans text-[12px] font-black leading-none text-paper-white">Lv {xpInfo.level}</span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Level {xpInfo.level} → {xpInfo.nextLevel}</p>
            <p className="font-codingo-sans text-[13px] font-bold text-pencil-gray">
              {xpInfo.have} / {xpInfo.need} XP
            </p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-faded-gray/20">
            <div className="h-full rounded-full bg-eager-green transition-all duration-500" style={{ width: `${Math.round(xpInfo.progress * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-5 sm:p-6">
          <h2 className="font-codingo-sans text-[16px] font-black leading-[1.2] text-charcoal">Streak</h2>
          <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">Study daily to keep the flame alive. Timezone {user?.timezone ?? "Asia/Kolkata"}.</p>
          <div className="mt-5">
            <StreakCalendar streak={user?.streak} />
          </div>
          <p className="mt-4 text-center font-codingo-sans text-[13px] font-bold leading-[1.4] text-pencil-gray">
            {user?.streak?.count ? `You're on a ${user.streak.count}-day streak — keep it up!` : "Start a lesson today to begin your streak."}
          </p>
        </div>

        <div className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-5 sm:p-6">
          <h2 className="font-codingo-sans text-[16px] font-black leading-[1.2] text-charcoal">Stats</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-3 text-center sm:p-4">
              <p className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">XP</p>
              <p className="mt-1 font-codingo-sans text-[20px] font-black leading-none text-eager-green sm:text-[22px]">{user?.xp ?? 0}</p>
            </div>
            <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-3 text-center sm:p-4">
              <p className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Level</p>
              <p className="mt-1 font-codingo-sans text-[20px] font-black leading-none text-spark-blue sm:text-[22px]">{xpInfo.level}</p>
            </div>
            <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-3 text-center sm:p-4">
              <p className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Badges</p>
              <p className="mt-1 font-codingo-sans text-[20px] font-black leading-none text-charcoal sm:text-[22px]">{badges.length}/6</p>
            </div>
          </div>
          <p className="mt-3 text-center font-codingo-sans text-[12px] font-medium text-pencil-gray">Badges unlock automatically as you learn.</p>
        </div>
      </div>

      <div className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-5 sm:p-6">
        <h2 className="font-codingo-sans text-[16px] font-black leading-[1.2] text-charcoal">Badges</h2>
        <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">Collect them all — Duolingo-style stickers.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_BADGES.map((id) => {
            const def = BADGE_DEFS[id];
            const unlocked = badges.includes(id);
            const Icon = BADGE_ICONS[id];
            return (
              <div
                key={id}
                className={
                  unlocked
                    ? `rounded-[12px] border-2 ${def.border} ${def.bg} p-4 text-center sm:p-5`
                    : "rounded-[12px] border-2 border-faded-gray bg-faded-gray/10 p-4 text-center opacity-60 grayscale sm:p-5"
                }
              >
                <div className={`mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full border-[2.5px] shadow-sm sm:h-[72px] sm:w-[72px] ${unlocked ? def.border : "border-faded-gray"} ${unlocked ? def.bg : "bg-paper-white"} ${def.iconColor}`}>
                  <Icon className="h-[28px] w-[28px] sm:h-[32px] sm:w-[32px]" strokeWidth={2} aria-hidden="true" />
                </div>
                <p className="mt-3 font-codingo-sans text-[13px] font-black leading-[1.2] text-charcoal sm:text-[14px]">{def.title}</p>
                <p className="mt-1 font-codingo-sans text-[11px] font-medium leading-[1.3] text-pencil-gray sm:text-[12px]">{def.desc}</p>
                <p className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] ${unlocked ? "bg-eager-green text-paper-white shadow-[0_2px_0_var(--color-deep-leaf)]" : "bg-faded-gray/20 text-pencil-gray"}`}>
                  {unlocked ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> : <Lock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />}
                  {unlocked ? "Unlocked" : "Locked"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
