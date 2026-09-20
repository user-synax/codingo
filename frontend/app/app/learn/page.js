import Link from "next/link";
import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { Lock, Check, Play, Code2, Layers, GraduationCap, Rocket, ChevronDown } from "lucide-react";
import { LessonNode } from "@/components/learn/LessonNode";

async function getCoursesWithProgress() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const [coursesRes, progressRes] = await Promise.all([
    fetch(`${API_BASE}/api/courses`, { headers: { Cookie: cookieHeader }, cache: "no-store" }),
    fetch(`${API_BASE}/api/progress/me`, { headers: { Cookie: cookieHeader }, cache: "no-store" }),
  ]);
  const coursesData = coursesRes.ok ? await coursesRes.json() : { courses: [] };
  const progressData = progressRes.ok ? await progressRes.json() : { progress: [] };
  const progressMap = {};
  for (const p of progressData.progress ?? []) progressMap[String(p.lessonId)] = p;
  return { courses: coursesData.courses ?? [], progressMap };
}

const UNIT_COLORS = [
  { bg: "bg-eager-green", border: "border-eager-green", text: "text-paper-white", accent: "bg-storybook-green" },
  { bg: "bg-spark-blue", border: "border-spark-blue", text: "text-paper-white", accent: "bg-[#e6f4ff]" },
  { bg: "bg-[#ff9600]", border: "border-[#ff9600]", text: "text-paper-white", accent: "bg-[#fff4e6]" },
  { bg: "bg-[#ce82ff]", border: "border-[#ce82ff]", text: "text-paper-white", accent: "bg-[#f3e8ff]" },
  { bg: "bg-[#ff86d0]", border: "border-[#ff86d0]", text: "text-paper-white", accent: "bg-[#ffe6f3]" },
];

const UNIT_ICONS = [Code2, Layers, GraduationCap, Layers, Rocket];

export default async function LearnPage() {
  const { courses, progressMap } = await getCoursesWithProgress();

  if (!courses.length) {
    return (
      <div className="mx-auto w-full max-w-[720px]">
        <h1 className="font-codingo-sans text-[28px] font-bold leading-[1.2] text-charcoal">Learn</h1>
        <p className="mt-2 font-codingo-sans text-[15px] font-medium leading-[1.4] text-pencil-gray">
          No courses yet — run <code className="rounded bg-faded-gray/20 px-1 py-0.5 font-mono text-[13px]">bun src/seed/seed.ts</code> in backend to seed JS from Zero.
        </p>
      </div>
    );
  }

  const course = courses[0];
  const allLessons = course.units?.flatMap((u) => u.lessons ?? []) ?? [];

  const globalWithStatus = allLessons.map((l, i) => {
    const prog = progressMap[String(l._id)];
    if (prog?.status === "completed") return { lesson: l, status: "completed" };
    const prevCompleted = allLessons.slice(0, i).every((prev) => progressMap[String(prev._id)]?.status === "completed");
    return { lesson: l, status: prevCompleted ? "available" : "locked" };
  });
  const globalMap = new Map(globalWithStatus.map((x) => [String(x.lesson._id), x.status]));

  const snakeOffsets = [0, 48, 28, -28, -48, 0];
  const snakeOffsetsMobile = [0, 32, 18, -18, -32, 0];

  const completedCount = globalWithStatus.filter((x) => x.status === "completed").length;
  const totalCount = globalWithStatus.length;
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextLesson = globalWithStatus.find((x) => x.status === "available")?.lesson ?? null;
  const nextHref = nextLesson ? `/app/learn/${String(nextLesson._id)}` : "/app/learn";
  const unitsCount = course.units?.length ?? 0;
  const ctaLabel = completedCount === 0 ? "Start learning" : completedCount === totalCount ? "Review lessons" : "Continue learning";

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center">
      {/* Course header — banner card. Course switcher slots in at the
          top-right (disabled "Soon" for now, becomes dropdown/modal). */}
      <header className="w-full overflow-hidden rounded-[16px] border-2 border-faded-gray bg-paper-white md:rounded-[20px]">
        <div className="relative p-5 sm:p-6 md:p-7">
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-storybook-green/70" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-spark-blue/10" aria-hidden="true" />
          <div className="pointer-events-none absolute right-24 top-6 hidden h-10 w-10 rounded-full border-2 border-faded-gray/30 lg:block" aria-hidden="true" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:gap-6">
            {/* Course badge */}
            <div className="flex items-start justify-between gap-3 md:block">
              <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[16px] border-2 border-charcoal bg-charcoal sm:h-[72px] sm:w-[72px]">
                <span className="font-codingo-sans text-[24px] font-black leading-none text-[#f7df1e] sm:text-[26px]">
                  JS
                </span>
              </div>
              {/* Mobile switcher placeholder */}
              <span
                title="More courses soon"
                aria-disabled="true"
                className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[12px] font-bold leading-none text-pencil-gray opacity-70 md:hidden"
              >
                Switch
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                <span className="rounded-full bg-storybook-green px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.04em] text-charcoal">Soon</span>
              </span>
            </div>

            {/* Title + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-3 py-1 font-codingo-sans text-[11px] font-black uppercase leading-none tracking-[0.06em] text-paper-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f7df1e]" aria-hidden="true" />
                  {course.language}
                </span>
                <span className="inline-flex items-center rounded-full border-2 border-faded-gray/40 bg-paper-white px-3 py-1 font-codingo-sans text-[11px] font-bold leading-none text-pencil-gray">
                  {unitsCount} units · {totalCount} lessons
                </span>
                <span className="inline-flex items-center rounded-full bg-storybook-green px-3 py-1 font-codingo-sans text-[11px] font-black leading-none text-charcoal">
                  {percent}% done
                </span>
              </div>
              <h1 className="mt-2.5 font-codingo-sans text-[26px] font-bold leading-[1.1] text-charcoal sm:text-[30px]">
                {course.title}
              </h1>
              <p className="mt-1.5 max-w-[560px] font-codingo-sans text-[14px] font-medium leading-[1.45] text-pencil-gray sm:text-[15px]">
                {course.description}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-faded-gray/20 sm:max-w-[320px]">
                  <div
                    className="h-full rounded-full bg-eager-green transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="shrink-0 font-codingo-sans text-[13px] font-bold leading-none text-pencil-gray">
                  {completedCount}/{totalCount}
                </p>
              </div>
              {nextLesson ? (
                <p className="mt-2 truncate font-codingo-sans text-[13px] font-medium text-pencil-gray">
                  Up next: <span className="font-bold text-charcoal">{nextLesson.title}</span>
                </p>
              ) : null}
            </div>

            {/* Actions — desktop */}
            <div className="flex shrink-0 flex-col items-stretch gap-2.5 md:w-[210px]">
              <Link
                href={nextHref}
                className="codingo-btn codingo-btn-primary inline-flex items-center justify-center gap-2 rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-3 font-codingo-sans text-[14px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95"
              >
                <Play className="h-4 w-4 fill-paper-white" strokeWidth={2.5} aria-hidden="true" />
                {ctaLabel}
              </Link>
              <span
                title="More courses soon — switcher becomes a dropdown/modal here"
                aria-disabled="true"
                className="codingo-btn-outline hidden cursor-not-allowed items-center justify-center gap-1.5 rounded-[12px] border-2 border-faded-gray bg-paper-white px-5 py-3 font-codingo-sans text-[13px] font-bold leading-none text-pencil-gray opacity-70 md:inline-flex"
              >
                Switch course
                <ChevronDown className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <p className="hidden text-center font-codingo-sans text-[11px] font-medium leading-[1.3] text-pencil-gray md:block">
                More courses soon
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t-2 border-faded-gray/40 bg-storybook-green/30 px-5 py-2.5 sm:px-6">
          <p className="font-codingo-sans text-[12px] font-bold uppercase leading-none tracking-[0.053em] text-pencil-gray">Your path</p>
          <p className="truncate font-codingo-sans text-[12px] font-medium text-pencil-gray">
            Tap a node below to start · {completedCount} of {totalCount} done
          </p>
        </div>
      </header>

      {course.units?.map((unit, unitIdx) => {
        const unitLessons = unit.lessons ?? [];
        const withStatus = unitLessons.map((l) => ({ lesson: l, status: globalMap.get(String(l._id)) ?? "locked" }));
        const completedInUnit = withStatus.filter((x) => x.status === "completed").length;
        const colors = UNIT_COLORS[unitIdx % UNIT_COLORS.length];
        const UnitIcon = UNIT_ICONS[unitIdx % UNIT_ICONS.length];

        return (
          <section key={String(unit._id)} className="mt-8 w-full md:mt-6">
            {/* Sticky unit header — with margin from top so it doesn't stack */}
            <div
              className={`sticky top-[72px] z-20 -mx-4 border-y-2 ${colors.border} ${colors.bg} px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] md:mx-0 md:top-4 md:rounded-[16px] md:border-2 md:p-4`}
            >
              <div className="absolute -right-6 -top-6 hidden h-20 w-20 rounded-full bg-white/15 md:block" aria-hidden="true" />
              <div className="relative flex items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border-2 border-white/30 bg-white/20 text-paper-white md:h-12 md:w-12">
                  <UnitIcon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className={`font-feather text-[17px] font-black leading-[1.1] tracking-[-0.01em] ${colors.text} md:text-[19px]`}>{unit.title}</h2>
                  <p className={`mt-0.5 line-clamp-1 font-codingo-sans text-[12px] font-bold leading-[1.3] ${colors.text} opacity-90 md:text-[13px]`}>{unit.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-full bg-paper-white px-3 py-1 font-codingo-sans text-[12px] font-black leading-none text-charcoal shadow-[0_3px_0_rgba(0,0,0,0.12)]">
                    {completedInUnit}/{unitLessons.length}
                  </span>
                  <span className={`hidden font-codingo-sans text-[10px] font-bold uppercase tracking-[0.05em] ${colors.text} opacity-80 md:block`}>completed</span>
                </div>
              </div>
              <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-black/15">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-paper-white transition-all duration-500 ease-[var(--ease-smooth-out)]"
                  style={{ width: `${unitLessons.length ? Math.round((completedInUnit / unitLessons.length) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Snake path — custom vertical line behind nodes, no browser scrollbar */}
            <div className="relative mt-6 flex w-full justify-center overflow-hidden py-2 md:mt-4">
              <div className="pointer-events-none absolute bottom-[40px] left-1/2 top-[40px] z-0 w-[14px] -translate-x-1/2 rounded-full bg-faded-gray/15 md:bottom-[48px] md:top-[48px]" aria-hidden="true" />

              <div className="flex w-full flex-col items-center gap-7 md:hidden">
                {withStatus.map(({ lesson, status }, i) => (
                  <div key={String(lesson._id)} style={{ transform: `translateX(${snakeOffsetsMobile[i % snakeOffsetsMobile.length]}px)` }}>
                    <LessonNode lesson={lesson} status={status} href={`/app/learn/${String(lesson._id)}`} />
                  </div>
                ))}
              </div>

              <div className="hidden w-full max-w-[980px] flex-col items-center gap-5 md:flex">
                {withStatus.map(({ lesson, status }, i) => (
                  <div key={String(lesson._id)} style={{ transform: `translateX(${snakeOffsets[i % snakeOffsets.length]}px)` }}>
                    <LessonNode lesson={lesson} status={status} href={`/app/learn/${String(lesson._id)}`} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <div className="mt-10 w-full max-w-[720px] rounded-[16px] border-2 border-faded-gray bg-paper-white p-5 text-center">
        <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Overall</p>
        <p className="mt-1 font-codingo-sans text-[15px] font-medium text-charcoal">
          {globalWithStatus.filter((x) => x.status === "completed").length} / {globalWithStatus.length} lessons completed
        </p>
        <div className="mx-auto mt-3 h-3 max-w-[360px] overflow-hidden rounded-full bg-faded-gray/20">
          <div
            className="h-full rounded-full bg-eager-green transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
            style={{ width: `${globalWithStatus.length ? Math.round((globalWithStatus.filter((x) => x.status === "completed").length / globalWithStatus.length) * 100) : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
