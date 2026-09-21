import Link from "next/link";
import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getXpProgress } from "@/lib/level";
import {
  ArrowRight,
  BookOpenCheck,
  Flame,
  MessagesSquare,
  Play,
  Trophy,
  Zap,
} from "lucide-react";

async function getDashboardData() {
  const cookieStore = await cookies();
  const headers = { Cookie: cookieStore.toString() };
  const [coursesRes, progressRes] = await Promise.all([
    fetch(`${API_BASE}/api/courses`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/progress/me`, { headers, cache: "no-store" }),
  ]);
  const coursesData = coursesRes.ok ? await coursesRes.json() : { courses: [] };
  const progressData = progressRes.ok ? await progressRes.json() : { progress: [] };
  return { courses: coursesData.courses ?? [], progress: progressData.progress ?? [] };
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default async function AppHome() {
  const [user, { courses, progress }] = await Promise.all([getCurrentUser(), getDashboardData()]);
  const xpInfo = getXpProgress(user?.xp ?? 0);

  // Multi-path dashboard — each path runs newbie-to-expert from its own lesson 1.
  // "Continue" resumes the first path (in order) that still has an open lesson.
  const lessonById = new Map();
  const perCourse = (courses ?? []).map((course) => {
    const units = course?.units ?? [];
    const lessons = units.flatMap((u) => (u.lessons ?? []).map((l) => ({ ...l, unitTitle: u.title, courseTitle: course.title })));
    for (const l of lessons) lessonById.set(String(l._id), l);
    return { course, lessons };
  });
  const completedIds = new Set(
    (progress ?? []).filter((p) => p.status === "completed").map((p) => String(p.lessonId)),
  );

  const perCourseStatus = perCourse.map(({ course, lessons }) => ({
    course,
    withStatus: lessons.map((l, i) => {
      if (completedIds.has(String(l._id))) return { lesson: l, status: "completed" };
      const prevDone = lessons.slice(0, i).every((prev) => completedIds.has(String(prev._id)));
      return { lesson: l, status: prevDone ? "available" : "locked" };
    }),
  }));
  const completedCount = perCourseStatus.reduce((n, c) => n + c.withStatus.filter((x) => x.status === "completed").length, 0);
  const totalCount = perCourseStatus.reduce((n, c) => n + c.withStatus.length, 0);
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextEntry = perCourseStatus
    .flatMap((c) => c.withStatus.map((x) => ({ ...x, courseTitle: c.course?.title })))
    .find((x) => x.status === "available") ?? null;
  const nextLesson = nextEntry?.lesson ?? null;
  const nextIndex = nextLesson
    ? (perCourseStatus.flatMap((c) => c.withStatus.map((x) => x.lesson)).findIndex((l) => String(l._id) === String(nextLesson._id)))
    : -1;

  const recent = (progress ?? [])
    .filter((p) => p.status === "completed" && p.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 4)
    .map((p) => ({ ...p, lesson: lessonById.get(String(p.lessonId)) ?? null }));

  const now = new Date();
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const count = (progress ?? []).filter((p) => p.status === "completed" && p.completedAt && sameDay(new Date(p.completedAt), d)).length;
    week.push({ date: d, count, isToday: i === 0 });
  }
  const weekMax = Math.max(1, ...week.map((w) => w.count));
  const todayLine = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const stats = [
    {
      label: "XP",
      value: String(user?.xp ?? 0),
      sub: "total points earned",
      icon: Zap,
      tile: "bg-storybook-green text-eager-green",
    },
    {
      label: "Streak",
      value: `${user?.streak?.count ?? 0} day${(user?.streak?.count ?? 0) === 1 ? "" : "s"}`,
      sub: completedCount === 0 ? "Start lesson 1 today" : "keep it going",
      icon: Flame,
      tile: "bg-[#fff4e6] text-[#ff9600]",
    },
    {
      label: "Level",
      value: `Lv ${xpInfo.level}`,
      sub: `${xpInfo.have}/${xpInfo.need} XP to Lv ${xpInfo.nextLevel}`,
      icon: Trophy,
      tile: "bg-[#e6f4ff] text-spark-blue",
    },
    {
      label: "Lessons",
      value: `${completedCount}/${totalCount}`,
      sub: `${percent}% across ${courses.length} path${courses.length === 1 ? "" : "s"}`,
      icon: BookOpenCheck,
      tile: "bg-[#f3e8ff] text-[#9333ea]",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      {/* Greeting banner */}
      <div className="relative overflow-hidden rounded-[16px] border-2 border-faded-gray bg-paper-white p-[20px] sm:p-[28px] md:rounded-[20px]">
        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-storybook-green/70" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-spark-blue/10" aria-hidden="true" />
        <div className="relative">
          <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">
            Welcome back · {todayLine}
          </p>
          <h1 className="mt-1 font-codingo-sans text-[26px] font-bold leading-[1.15] text-charcoal sm:text-[32px]">
            Hey, {user?.username ?? "learner"} — ready to code?
          </h1>
          <p className="mt-2 max-w-[560px] font-codingo-sans text-[15px] font-medium leading-[1.4] text-pencil-gray">
            {completedCount === 0
              ? "Bite-sized lessons, real code in your browser. Your first lesson takes 2 minutes."
              : (user?.streak?.count ?? 0) > 0
                ? `You're on a ${user.streak.count}-day streak with ${completedCount} lessons done. One more today?`
                : `You've finished ${completedCount} lesson${completedCount === 1 ? "" : "s"}. Pick up where you left off.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={nextLesson ? `/app/learn/${String(nextLesson._id)}` : "/app/learn"}
              className="codingo-btn codingo-btn-primary inline-flex items-center gap-2 rounded-[12px] border-2 border-eager-green bg-eager-green px-6 py-3 font-codingo-sans text-[15px] font-bold uppercase leading-[1.33] tracking-[0.053em] text-paper-white hover:brightness-95"
            >
              <Play className="h-4 w-4 fill-paper-white" strokeWidth={2.5} aria-hidden="true" />
              {completedCount === 0 ? "Start learning" : "Continue learning"}
            </Link>
            <Link
              href="/app/community"
              className="codingo-btn-outline inline-flex items-center gap-2 rounded-[12px] border-2 border-faded-gray bg-paper-white px-6 py-3 font-codingo-sans text-[14px] font-bold leading-[1.4] text-spark-blue hover:border-spark-blue hover:bg-spark-blue/5"
            >
              <MessagesSquare className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              Ask the community
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="font-codingo-sans text-[12px] font-bold uppercase tracking-[0.053em] text-pencil-gray sm:text-[13px]">
                {s.label}
              </p>
              <span className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${s.tile}`} aria-hidden="true">
                <s.icon className="h-[22px] w-[22px]" strokeWidth={2.2} />
              </span>
            </div>
            <p className="mt-2 truncate font-codingo-sans text-[22px] font-bold leading-none text-charcoal sm:text-[28px]">
              {s.value}
            </p>
            <p className="mt-1 truncate font-codingo-sans text-[12px] font-medium text-pencil-gray sm:text-[13px]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Continue + side column */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {/* Up next — real lesson data */}
        <div className="rounded-[16px] border-2 border-charcoal bg-paper-white p-5 sm:p-6 lg:col-span-3">
          <p className="font-codingo-sans text-[12px] font-bold uppercase tracking-[0.053em] text-pencil-gray sm:text-[13px]">
            Up next
          </p>
          {nextLesson ? (
            <>
              <p className="mt-2 inline-flex items-center rounded-full bg-[#e6f4ff] px-2.5 py-0.5 font-codingo-sans text-[11px] font-bold leading-[1.4] text-spark-blue">
                {nextLesson.unitTitle}
              </p>
              {nextEntry?.courseTitle ? (
                <p className="mt-2 inline-flex items-center rounded-full bg-charcoal px-2.5 py-0.5 font-codingo-sans text-[11px] font-bold leading-[1.4] text-paper-white ml-2">
                  {nextEntry.courseTitle}
                </p>
              ) : null}
              <h2 className="mt-2 font-codingo-sans text-[20px] font-bold leading-[1.2] text-charcoal sm:text-[22px]">
                {nextIndex + 1}. {nextLesson.title}
              </h2>
              <p className="mt-1 font-codingo-sans text-[14px] font-medium leading-[1.45] text-pencil-gray">
                {nextLesson.description ?? "A bite-sized lesson."}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-faded-gray/20">
                  <div
                    className="h-full rounded-full bg-eager-green transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="shrink-0 font-codingo-sans text-[13px] font-bold leading-none text-pencil-gray">
                  {completedCount}/{totalCount}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/app/learn/${String(nextLesson._id)}`}
                  className="codingo-btn codingo-btn-primary inline-flex items-center gap-1.5 rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-2.5 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95"
                >
                  Start lesson
                  <ArrowRight className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
                </Link>
                <span className="rounded-full bg-storybook-green px-3 py-1 font-codingo-sans text-[12px] font-black leading-[1.4] text-charcoal">
                  +{nextLesson.xpReward ?? 10} XP
                </span>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 font-codingo-sans text-[20px] font-bold leading-[1.2] text-charcoal sm:text-[22px]">
                {totalCount ? "Course complete — be proud" : "Lessons are on the way"}
              </h2>
              <p className="mt-1 font-codingo-sans text-[14px] font-medium leading-[1.45] text-pencil-gray">
                {totalCount
                  ? `You finished all ${totalCount} lessons. Review the path or help others in the community.`
                  : "Course content is being prepared."}
              </p>
              <div className="mt-4">
                <Link
                  href="/app/learn"
                  className="codingo-btn codingo-btn-primary inline-flex items-center gap-1.5 rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-2.5 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95"
                >
                  View learning path
                  <ArrowRight className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* This week */}
        <div className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-codingo-sans text-[15px] font-bold leading-[1.3] text-charcoal">This week</h2>
            <span className="rounded-full bg-faded-gray/20 px-2.5 py-1 font-codingo-sans text-[11px] font-black leading-none text-pencil-gray">
              {week.reduce((a, w) => a + w.count, 0)} done
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-1.5" role="img" aria-label="Lessons completed per day this week">
            {week.map((day, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="flex h-[72px] w-full items-end justify-center">
                  <div
                    className={`w-full max-w-[28px] rounded-full ${day.count > 0 ? "bg-eager-green" : day.isToday ? "bg-charcoal/25" : "bg-faded-gray/20"}`}
                    style={{ height: `${day.count > 0 ? Math.max(18, Math.round((day.count / weekMax) * 100)) : 8}%` }}
                    title={`${day.count} lesson${day.count === 1 ? "" : "s"}`}
                  />
                </div>
                <span
                  className={`font-codingo-sans text-[11px] font-black leading-none ${day.isToday ? "text-charcoal" : "text-pencil-gray"}`}
                >
                  {day.date.toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center font-codingo-sans text-[12px] font-medium text-pencil-gray">
            {week[6].count > 0 ? "Today's lesson is done — streak safe." : "Finish a lesson today to light up the last bar."}
          </p>
        </div>
      </div>

      {/* Recent completions */}
      <div className="mt-4 rounded-[16px] border-2 border-faded-gray bg-paper-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-codingo-sans text-[15px] font-bold leading-[1.3] text-charcoal">Recent completions</h2>
          <Link
            href="/app/learn"
            className="inline-flex items-center gap-1 font-codingo-sans text-[13px] font-bold text-spark-blue hover:underline"
          >
            Full path
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
          </Link>
        </div>
        {recent.length ? (
          <ul className="mt-3 divide-y-2 divide-faded-gray/30">
            {recent.map((r) => (
              <li key={String(r._id ?? r.lessonId)} className="flex items-center gap-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-storybook-green text-eager-green" aria-hidden="true">
                  <BookOpenCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-codingo-sans text-[14px] font-bold leading-[1.3] text-charcoal">
                    {r.lesson?.title ?? "Lesson"}
                  </p>
                  <p className="truncate font-codingo-sans text-[12px] font-medium leading-[1.3] text-pencil-gray">
                    {r.lesson?.unitTitle ?? ""} · {r.completedAt ? new Date(r.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-faded-gray/20 px-2.5 py-1 font-codingo-sans text-[12px] font-black leading-none text-charcoal">
                  {r.score ?? 0}%
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-[12px] border-2 border-dashed border-faded-gray p-5 text-center">
            <p className="font-codingo-sans text-[14px] font-medium leading-[1.4] text-pencil-gray">
              Nothing completed yet — your finished lessons will show up here.
            </p>
            <Link
              href="/app/learn"
              className="mt-3 inline-flex items-center gap-1.5 font-codingo-sans text-[13px] font-bold text-spark-blue hover:underline"
            >
              Browse the path
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
