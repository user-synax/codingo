/* eslint-disable react-hooks/static-components -- Icon is a lucide component selected per lesson title */
import Link from "next/link";
import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { Code2, Repeat, Braces, Lock, Check, Play } from "lucide-react";

async function getCoursesWithProgress() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const [coursesRes, progressRes] = await Promise.all([
    fetch(`${API_BASE}/api/courses`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
    fetch(`${API_BASE}/api/progress/me`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
  ]);

  const coursesData = coursesRes.ok ? await coursesRes.json() : { courses: [] };
  const progressData = progressRes.ok ? await progressRes.json() : { progress: [] };

  const progressMap = {};
  for (const p of progressData.progress ?? []) progressMap[String(p.lessonId)] = p;

  return { courses: coursesData.courses ?? [], progressMap };
}

const LESSON_ICONS = {
  variables: Code2,
  loops: Repeat,
  functions: Braces,
  default: Code2,
};

function getLessonIcon(title) {
  const t = String(title).toLowerCase();
  if (t.includes("variable")) return LESSON_ICONS.variables;
  if (t.includes("loop")) return LESSON_ICONS.loops;
  if (t.includes("function")) return LESSON_ICONS.functions;
  return LESSON_ICONS.default;
}

function LessonNode({ lesson, status, href }) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const Icon = getLessonIcon(lesson.title);

  return (
    <div className="relative z-10 flex flex-col items-center gap-3">
      <Link
        href={isLocked ? "#" : href}
        aria-disabled={isLocked}
        aria-label={`${lesson.title} — ${status}`}
        className={
          isLocked
            ? "pointer-events-none relative z-10 flex h-[80px] w-[80px] items-center justify-center rounded-full border-[3px] border-faded-gray bg-faded-gray/20 text-pencil-gray md:h-[96px] md:w-[96px]"
            : isCompleted
              ? "relative z-10 flex h-[80px] w-[80px] items-center justify-center rounded-full border-[3px] border-eager-green bg-eager-green text-paper-white shadow-[0_6px_0_var(--color-deep-leaf)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:brightness-95 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-deep-leaf)] md:h-[96px] md:w-[96px]"
              : "relative z-10 flex h-[80px] w-[80px] items-center justify-center rounded-full border-[3px] border-faded-gray bg-paper-white text-charcoal shadow-[0_6px_0_var(--color-faded-gray)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-charcoal hover:shadow-[0_6px_0_var(--color-charcoal)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-charcoal)] md:h-[96px] md:w-[96px]"
        }
      >
        {isCompleted ? (
          <Check className="h-9 w-9 md:h-10 md:w-10" strokeWidth={2.5} aria-hidden="true" />
        ) : isLocked ? (
          <Lock className="h-9 w-9 md:h-10 md:w-10" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Icon className="h-9 w-9 md:h-10 md:w-10" strokeWidth={2} aria-hidden="true" />
        )}
      </Link>

      {/* State badge */}
      <div className="flex items-center justify-center gap-1.5">
        {isLocked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-faded-gray/20 px-2.5 py-1 font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] leading-none text-pencil-gray">
            <Lock className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
            Locked
          </span>
        ) : isCompleted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-storybook-green px-2.5 py-1 font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] leading-none text-charcoal">
            <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
            Completed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-eager-green px-3 py-1 font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] leading-none text-paper-white">
            <Play className="h-3 w-3 fill-paper-white" strokeWidth={2.5} aria-hidden="true" />
            Start
          </span>
        )}
      </div>

      <div className="w-[180px] rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-3 text-center md:w-[190px]">
        <p className="font-codingo-sans text-[14px] font-bold leading-[1.2] text-charcoal md:text-[15px]">{lesson.title}</p>
        <p className="mt-1 font-codingo-sans text-[12px] font-bold uppercase tracking-[0.04em] leading-none text-pencil-gray md:text-[12px]">
          {lesson.xpReward ?? 10} XP
        </p>
        <p className="mt-1 hidden font-codingo-sans text-[12px] font-medium leading-[1.3] text-pencil-gray md:block">
          {lesson.description ?? ""}
        </p>
      </div>
    </div>
  );
}

export default async function LearnPage() {
  const { courses, progressMap } = await getCoursesWithProgress();

  if (!courses.length) {
    return (
      <div className="mx-auto w-full max-w-[720px]">
        <h1 className="font-codingo-sans text-[28px] font-bold leading-[1.2] text-charcoal">Learn</h1>
        <p className="mt-2 font-codingo-sans text-[15px] font-medium leading-[1.4] text-pencil-gray">
          No courses yet — run <code className="rounded bg-faded-gray/20 px-1 py-0.5 font-mono text-[13px]">bun src/seed/seed.ts</code> in backend to seed JavaScript Basics.
        </p>
      </div>
    );
  }

  const course = courses[0];
  const unit = course.units?.[0];
  const lessons = unit?.lessons ?? [];

  const withStatus = lessons.map((l, i) => {
    const prog = progressMap[String(l._id)];
    if (prog?.status === "completed") return { lesson: l, status: "completed" };
    const prevCompleted = lessons.slice(0, i).every((prev) => progressMap[String(prev._id)]?.status === "completed");
    return { lesson: l, status: prevCompleted ? "available" : "locked" };
  });

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center">
      <div className="w-full text-center">
        <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">
          {course.language} · {course.title}
        </p>
        <h1 className="mt-1 font-codingo-sans text-[28px] font-bold leading-[1.2] text-charcoal md:text-[32px]">{unit?.title ?? "Fundamentals"}</h1>
        <p className="mx-auto mt-2 max-w-[520px] font-codingo-sans text-[15px] font-medium leading-[1.4] text-pencil-gray">
          {unit?.description ?? course.description}
        </p>
      </div>

      {/* Path — responsive: vertical on mobile, horizontal on desktop */}
      <div className="relative mt-10 flex w-full justify-center">
        {/* Mobile: vertical line — inset by half node (40px) so it starts/ends at circle centers, behind nodes */}
        <div className="pointer-events-none absolute left-1/2 top-[40px] bottom-[40px] z-0 w-[4px] -translate-x-1/2 rounded-full bg-faded-gray/25 md:hidden" aria-hidden="true" />
        {/* Desktop: horizontal line — inset by half node (48px) so it starts/ends at circle centers, behind nodes */}
        <div className="pointer-events-none absolute left-[48px] right-[48px] top-1/2 z-0 hidden h-[4px] -translate-y-1/2 rounded-full bg-faded-gray/25 md:block" aria-hidden="true" />

        {/* Mobile: column */}
        <div className="flex w-full flex-col items-center gap-8 md:hidden">
          {withStatus.map(({ lesson, status }) => (
            <LessonNode key={String(lesson._id)} lesson={lesson} status={status} href={`/app/learn/${String(lesson._id)}`} />
          ))}
        </div>

        {/* Desktop: row */}
        <div className="hidden w-full items-start justify-center gap-10 md:flex lg:gap-14">
          {withStatus.map(({ lesson, status }) => (
            <LessonNode key={String(lesson._id)} lesson={lesson} status={status} href={`/app/learn/${String(lesson._id)}`} />
          ))}
        </div>
      </div>

      <div className="mt-10 w-full max-w-[720px] rounded-[12px] border-2 border-faded-gray bg-paper-white p-5 text-center">
        <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Progress</p>
        <p className="mt-1 font-codingo-sans text-[15px] font-medium text-charcoal">
          {withStatus.filter((x) => x.status === "completed").length} / {withStatus.length} lessons completed
        </p>
        <div className="mx-auto mt-3 h-3 max-w-[360px] overflow-hidden rounded-full bg-faded-gray/20">
          <div
            className="h-full rounded-full bg-eager-green transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
            style={{ width: `${withStatus.length ? Math.round((withStatus.filter((x) => x.status === "completed").length / withStatus.length) * 100) : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
