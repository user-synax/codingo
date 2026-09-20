import Link from "next/link";
import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { Lock, Check, Play, Code2, Layers, GraduationCap, Rocket } from "lucide-react";
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

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center">
      <div className="w-full text-center">
        <p className="font-codingo-sans text-[12px] font-bold uppercase tracking-[0.08em] text-pencil-gray">
          {course.language} · {course.title}
        </p>
        <h1 className="mt-1 font-feather text-[28px] font-black leading-[1.1] tracking-[-0.02em] text-eager-green md:text-[34px]">Your path</h1>
        <p className="mx-auto mt-2 max-w-[560px] font-codingo-sans text-[14px] font-medium leading-[1.4] text-pencil-gray">
          {course.description} — 30 bite-sized lessons. Tap a node to start.
        </p>
      </div>

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
