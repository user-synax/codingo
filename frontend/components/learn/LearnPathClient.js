"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Check, Play, Code2, Layers, GraduationCap, Rocket, ChevronDown, Sparkles, Terminal, ArrowRight } from "lucide-react";
import { LessonCard } from "@/components/learn/LessonCard";
import { useProgressStore } from "@/stores/progressStore";
import { ProgressSyncBadge } from "@/components/progress/ProgressHydrator";
import * as progressDb from "@/lib/progressDb";

const UNIT_COLORS = [
  { bg: "bg-eager-green", border: "border-eager-green", text: "text-paper-white", accent: "bg-storybook-green" },
  { bg: "bg-spark-blue", border: "border-spark-blue", text: "text-paper-white", accent: "bg-[#e6f4ff]" },
  { bg: "bg-[#ff9600]", border: "border-[#ff9600]", text: "text-paper-white", accent: "bg-[#fff4e6]" },
  { bg: "bg-[#ce82ff]", border: "border-[#ce82ff]", text: "text-paper-white", accent: "bg-[#f3e8ff]" },
  { bg: "bg-[#ff86d0]", border: "border-[#ff86d0]", text: "text-paper-white", accent: "bg-[#ffe6f3]" },
];

const UNIT_ICONS = [Code2, Layers, GraduationCap, Layers, Rocket];

const COURSE_META = {
  javascript: { mark: "JS", chip: "javascript", badge: "bg-charcoal", markColor: "text-[#f7df1e]", dot: "bg-[#f7df1e]", Icon: Code2, tile: "bg-[#f7df1e]", tileIcon: "text-charcoal" },
  ai: { mark: "AI", chip: "AI coding", badge: "bg-spark-blue", markColor: "text-paper-white", dot: "bg-spark-blue", Icon: Sparkles, tile: "bg-spark-blue", tileIcon: "text-paper-white" },
  python: { mark: "Py", chip: "python", badge: "bg-[#3776ab]", markColor: "text-[#ffd43b]", dot: "bg-[#ffd43b]", Icon: Terminal, tile: "bg-[#3776ab]", tileIcon: "text-paper-white" },
};

function courseMeta(course) {
  const m = COURSE_META[course?.language];
  if (m) return m;
  const mark = String(course?.title ?? "??").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "??";
  return { mark, chip: course?.language ?? "course", badge: "bg-charcoal", markColor: "text-paper-white", dot: "bg-paper-white", Icon: GraduationCap, tile: "bg-charcoal", tileIcon: "text-paper-white" };
}

const STATE_PILL = {
  Completed: "bg-charcoal text-paper-white",
  "Start here": "bg-eager-green text-paper-white",
  "In progress": "bg-[#ff9600] text-paper-white",
  "Next up": "bg-spark-blue text-paper-white",
};

function statusForLessons(allLessons, progressMap) {
  return allLessons.map((l, i) => {
    const prog = progressMap[String(l._id)];
    if (prog?.status === "completed") return { lesson: l, status: "completed" };
    const prevCompleted = allLessons.slice(0, i).every((prev) => progressMap[String(prev._id)]?.status === "completed");
    return { lesson: l, status: prevCompleted ? "available" : "locked" };
  });
}

function courseStats(course, progressMap) {
  const lessons = (course.units ?? []).flatMap((u) => u.lessons ?? []);
  const done = lessons.filter((l) => progressMap[String(l._id)]?.status === "completed").length;
  return { total: lessons.length, done, percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0 };
}

/* Client shell — now with card grid per Unit (ladder removed).
   Keeps IDB-first progress + draft resume (Continue cards). */
export function LearnPathClient({ courses, initialProgressMap, activeCourseId }) {
  const byLessonId = useProgressStore((s) => s.byLessonId);
  const hydratedFromCache = useProgressStore((s) => s.hydratedFromCache);
  const pendingCount = useProgressStore((s) => s.pendingCount);
  const isOffline = useProgressStore((s) => s.isOffline);
  const userId = useProgressStore((s) => s.userId);
  const [mounted, setMounted] = useState(false);
  const [draftMap, setDraftMap] = useState({});

  useEffect(() => setMounted(true), []);

  // Load lesson drafts (IndexedDB only) for Continue status
  useEffect(() => {
    if (!mounted || !progressDb.isSupported()) return;
    let alive = true;
    async function loadDrafts() {
      try {
        const uid = userId ?? undefined;
        let drafts = await progressDb.getAllDrafts(uid).catch(() => []);
        if (!drafts.length && uid && uid !== "anon") {
          const anonDrafts = await progressDb.getAllDrafts("anon").catch(() => []);
          if (anonDrafts.length) drafts = anonDrafts;
        }
        if (!uid) {
          const any = await progressDb.getAllDrafts().catch(() => []);
          if (any.length) drafts = any;
        }
        if (!alive) return;
        const map = {};
        for (const d of drafts) {
          map[String(d.lessonId)] = d;
        }
        setDraftMap(map);
      } catch {}
    }
    loadDrafts();
    const id = setInterval(loadDrafts, 2000);
    const onVis = () => {
      if (document.visibilityState === "visible") loadDrafts();
    };
    const onStorage = () => loadDrafts();
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", loadDrafts);
    window.addEventListener("storage", onStorage);
    // Also listen to custom event fired by LessonRunner on save
    const onDraftUpdate = () => loadDrafts();
    window.addEventListener("codingo:draft-update", onDraftUpdate);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", loadDrafts);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("codingo:draft-update", onDraftUpdate);
    };
  }, [mounted, userId]);

  // IDB-first merge: store wins over server when hydrated, else server is truth.
  const progressMap = useMemo(() => {
    if (!mounted || !hydratedFromCache || !byLessonId || Object.keys(byLessonId).length === 0) return initialProgressMap ?? {};
    return { ...(initialProgressMap ?? {}), ...byLessonId };
  }, [initialProgressMap, byLessonId, hydratedFromCache, mounted]);

  if (!courses.length) {
    return (
      <div className="mx-auto w-full max-w-[720px]">
        <h1 className="font-codingo-sans text-[28px] font-bold leading-[1.2] text-charcoal">Learn</h1>
        <p className="mt-2 font-codingo-sans text-[15px] font-medium leading-[1.4] text-pencil-gray">
          No courses yet — run <code className="rounded bg-faded-gray/20 px-1 py-0.5 font-mono text-[13px]">bun src/seed/seed.ts --course js-from-zero</code> in backend to seed JS from Zero.
        </p>
      </div>
    );
  }

  const activeCourse = courses.find((c) => String(c._id) === String(activeCourseId ?? "")) ?? courses[0];
  const meta = courseMeta(activeCourse);
  const allLessons = activeCourse.units?.flatMap((u) => u.lessons ?? []) ?? [];

  const globalWithStatus = statusForLessons(allLessons, progressMap);
  const globalMap = new Map(globalWithStatus.map((x) => [String(x.lesson._id), x.status]));

  const completedCount = globalWithStatus.filter((x) => x.status === "completed").length;
  const totalCount = globalWithStatus.length;
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextLesson = globalWithStatus.find((x) => x.status === "available")?.lesson ?? null;
  const nextHref = nextLesson ? `/app/learn/${String(nextLesson._id)}` : "/app/learn";
  const unitsCount = activeCourse.units?.length ?? 0;
  const ctaLabel = completedCount === 0 ? "Start learning" : completedCount === totalCount ? "Review lessons" : "Continue learning";

  const usingCache = mounted && hydratedFromCache && Object.keys(byLessonId).length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center">
      {mounted && (isOffline || pendingCount > 0) ? (
        <div className="mb-4 flex w-full justify-end">
          <ProgressSyncBadge />
        </div>
      ) : null}
      {usingCache && !isOffline && pendingCount === 0 ? (
        <p className="mb-2 w-full text-right font-codingo-sans text-[11px] font-bold text-pencil-gray">
          Showing cached progress — syncing with server…
        </p>
      ) : null}

      {/* Course header — banner card. */}
      <header className="w-full overflow-hidden rounded-[16px] border-2 border-faded-gray bg-paper-white md:rounded-[20px]">
        <div className="relative p-5 sm:p-6 md:p-7">
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-storybook-green/70" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-spark-blue/10" aria-hidden="true" />
          <div className="pointer-events-none absolute right-24 top-6 hidden h-10 w-10 rounded-full border-2 border-faded-gray/30 lg:block" aria-hidden="true" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:gap-6">
            <div className="flex items-start justify-between gap-3 md:block">
              <div className={`flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[16px] border-2 border-charcoal sm:h-[72px] sm:w-[72px] ${meta.badge}`}>
                <span className={`font-codingo-sans text-[24px] font-black leading-none sm:text-[26px] ${meta.markColor}`}>{meta.mark}</span>
              </div>
              <Link href="#courses" className="inline-flex items-center gap-1 rounded-full border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[12px] font-bold leading-none text-charcoal transition-colors hover:border-charcoal md:hidden">
                Switch
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-3 py-1 font-codingo-sans text-[11px] font-black uppercase leading-none tracking-[0.06em] text-paper-white">
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                  {meta.chip}
                </span>
                <span className="inline-flex items-center rounded-full border-2 border-faded-gray/40 bg-paper-white px-3 py-1 font-codingo-sans text-[11px] font-bold leading-none text-pencil-gray">
                  {unitsCount} units · {totalCount} lessons
                </span>
                <span className="inline-flex items-center rounded-full bg-storybook-green px-3 py-1 font-codingo-sans text-[11px] font-black leading-none text-charcoal">
                  {percent}% done
                </span>
              </div>
              <h1 className="mt-2.5 font-codingo-sans text-[26px] font-bold leading-[1.1] text-charcoal sm:text-[30px]">{activeCourse.title}</h1>
              <p className="mt-1.5 max-w-[560px] font-codingo-sans text-[14px] font-medium leading-[1.45] text-pencil-gray sm:text-[15px]">{activeCourse.description}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-faded-gray/20 sm:max-w-[320px]">
                  <div className="h-full rounded-full bg-eager-green transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]" style={{ width: `${percent}%` }} />
                </div>
                <p className="shrink-0 font-codingo-sans text-[13px] font-bold leading-none text-pencil-gray">{completedCount}/{totalCount}</p>
              </div>
              {nextLesson ? (
                <p className="mt-2 truncate font-codingo-sans text-[13px] font-medium text-pencil-gray">
                  Up next: <span className="font-bold text-charcoal">{nextLesson.title}</span>
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2.5 md:w-[210px]">
              <Link href={nextHref} className="codingo-btn codingo-btn-primary inline-flex items-center justify-center gap-2 rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-3 font-codingo-sans text-[14px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95">
                <Play className="h-4 w-4 fill-paper-white" strokeWidth={2.5} aria-hidden="true" />
                {ctaLabel}
              </Link>
              <Link href="#courses" className="codingo-btn-outline hidden items-center justify-center gap-1.5 rounded-[12px] border-2 border-faded-gray bg-paper-white px-5 py-3 font-codingo-sans text-[13px] font-bold leading-none text-charcoal transition-colors hover:border-charcoal md:inline-flex">
                Switch path
                <ChevronDown className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              </Link>
              <p className="hidden text-center font-codingo-sans text-[11px] font-medium leading-[1.3] text-pencil-gray md:block">{courses.length} paths · all open</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t-2 border-faded-gray/40 bg-storybook-green/30 px-5 py-2.5 sm:px-6">
          <p className="font-codingo-sans text-[12px] font-bold uppercase leading-none tracking-[0.053em] text-pencil-gray">Your path</p>
          <p className="truncate font-codingo-sans text-[12px] font-medium text-pencil-gray">Cards • {completedCount} of {totalCount} done</p>
        </div>
      </header>

      <section id="courses" aria-label="Learning paths" className="mt-8 w-full scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-storybook-green px-3 py-1 font-codingo-sans text-[11px] font-black uppercase leading-none tracking-[0.06em] text-charcoal">
              <Sparkles className="h-3.5 w-3.5 text-eager-green" strokeWidth={2.5} aria-hidden="true" />
              Learning paths
            </p>
            <h2 className="mt-2 font-feather text-[26px] font-black leading-[1.1] tracking-[-0.01em] text-charcoal sm:text-[30px]">Pick your path</h2>
            <p className="mt-1 font-codingo-sans text-[14px] font-medium leading-[1.4] text-pencil-gray">Every path runs newbie to expert. All open — start anywhere.</p>
          </div>
          <p className="rounded-full border-2 border-faded-gray bg-paper-white px-3 py-1 font-codingo-sans text-[12px] font-bold leading-none text-pencil-gray">{courses.length} paths · all open</p>
        </div>
        <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          {courses.map((c, i) => {
            const m = courseMeta(c);
            const st = courseStats(c, progressMap);
            const active = String(c._id) === String(activeCourse._id);
            const units = c.units?.length ?? 0;
            const state = st.percent === 100 ? "Completed" : i === 0 ? "Start here" : st.done > 0 ? "In progress" : "Next up";
            const TileIcon = m.Icon;
            return (
              <Link
                key={String(c._id)}
                href={`/app/learn?course=${String(c._id)}`}
                aria-current={active ? "true" : undefined}
                className={
                  active
                    ? "group flex items-center gap-3 rounded-[16px] border-2 border-eager-green bg-storybook-green/40 p-3 sm:gap-4 sm:rounded-[20px] sm:p-4 transition-colors"
                    : "group flex items-center gap-3 rounded-[16px] border-2 border-faded-gray bg-paper-white p-3 transition-colors hover:border-charcoal sm:gap-4 sm:rounded-[20px] sm:p-4"
                }
              >
                <div className="relative shrink-0">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-[16px] border-2 border-charcoal sm:h-20 sm:w-20 sm:rounded-[20px] lg:h-[84px] lg:w-[84px] lg:rounded-[22px] ${m.tile} shadow-[0_3px_0_var(--color-charcoal)] sm:shadow-[0_4px_0_var(--color-charcoal)]`}>
                    <TileIcon className={`h-[22px] w-[22px] sm:h-8 sm:w-8 lg:h-9 lg:w-9 ${m.tileIcon}`} strokeWidth={2.2} aria-hidden="true" />
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 rounded-full border-2 border-charcoal bg-paper-white px-1.5 py-0.5 font-codingo-sans text-[10px] font-black leading-none text-charcoal sm:-bottom-2 sm:-right-2 sm:px-2 sm:text-[11px] lg:-bottom-2.5 lg:-right-2.5 lg:px-2.5 lg:py-1 lg:text-[12px]">{m.mark}</span>
                  {active ? (
                    <span className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-paper-white bg-eager-green text-paper-white sm:-left-2 sm:-top-2 sm:h-7 sm:w-7" aria-label="Currently viewing">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} aria-hidden="true" />
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <p className="font-codingo-sans text-[16px] font-black leading-[1.2] text-charcoal sm:text-[17px]">{c.title}</p>
                    <span className={`rounded-full px-2 py-1 font-codingo-sans text-[10px] font-black uppercase leading-none tracking-[0.05em] ${STATE_PILL[state]}`}>{state}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 font-codingo-sans text-[12px] font-medium leading-[1.45] text-pencil-gray sm:text-[13px]">{c.description}</p>
                  <p className="mt-1 font-codingo-sans text-[11px] font-bold text-pencil-gray sm:text-[12px]">{units} units · {st.total} lessons</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-faded-gray/20 sm:h-2.5">
                      <div className={`h-full rounded-full ${st.percent === 100 ? "bg-charcoal" : "bg-eager-green"}`} style={{ width: `${st.percent}%` }} />
                    </div>
                    <span className="shrink-0 font-codingo-sans text-[11px] font-black text-charcoal sm:text-[12px]">{st.done}/{st.total}</span>
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className={
                    active
                      ? "hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-eager-green text-paper-white sm:flex"
                      : "hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-faded-gray text-pencil-gray transition-colors group-hover:border-charcoal group-hover:text-charcoal sm:flex"
                  }
                >
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Units — card grids (ladder removed) */}
      {activeCourse.units?.map((unit, unitIdx) => {
        const unitLessons = unit.lessons ?? [];
        const withStatus = unitLessons.map((l) => ({ lesson: l, status: globalMap.get(String(l._id)) ?? "locked" }));
        const completedInUnit = withStatus.filter((x) => x.status === "completed").length;
        const colors = UNIT_COLORS[unitIdx % UNIT_COLORS.length];
        const UnitIcon = UNIT_ICONS[unitIdx % UNIT_ICONS.length];
        const globalStartIndex = allLessons.findIndex((l) => String(l._id) === String(withStatus[0]?.lesson._id));
        return (
          <section key={String(unit._id)} className="mt-8 w-full md:mt-6">
            <div className={`sticky top-[72px] z-20 -mx-4 border-y-2 ${colors.border} ${colors.bg} px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] md:mx-0 md:top-4 md:rounded-[16px] md:border-2 md:p-4`}>
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
                  <span className="rounded-full bg-paper-white px-3 py-1 font-codingo-sans text-[12px] font-black leading-none text-charcoal shadow-[0_3px_0_rgba(0,0,0,0.12)]">{completedInUnit}/{unitLessons.length}</span>
                  <span className={`hidden font-codingo-sans text-[10px] font-bold uppercase tracking-[0.05em] ${colors.text} opacity-80 md:block`}>completed</span>
                </div>
              </div>
              <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-black/15">
                <div className="absolute inset-y-0 left-0 rounded-full bg-paper-white transition-all duration-500 ease-[var(--ease-smooth-out)]" style={{ width: `${unitLessons.length ? Math.round((completedInUnit / unitLessons.length) * 100) : 0}%` }} />
              </div>
            </div>

            {/* Perfect grid: 1 col mobile, 2 tablet, 3 desktop — every card previewed */}
            <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-4">
              {withStatus.map(({ lesson, status }, i) => {
                const globalIdx = globalStartIndex >= 0 ? globalStartIndex + i : i;
                const draft = mounted ? draftMap[String(lesson._id)] : null;
                // Don't show draft as Continue if already completed
                const effectiveDraft = status === "completed" ? null : draft;
                return (
                  <LessonCard
                    key={String(lesson._id)}
                    lesson={lesson}
                    status={status}
                    draft={effectiveDraft}
                    index={globalIdx}
                    totalInUnit={unitLessons.length}
                    unitTitle={unit.title}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="mt-10 w-full max-w-[720px] rounded-[16px] border-2 border-faded-gray bg-paper-white p-5 text-center">
        <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Overall</p>
        <p className="mt-1 font-codingo-sans text-[15px] font-medium text-charcoal">{globalWithStatus.filter((x) => x.status === "completed").length} / {globalWithStatus.length} lessons completed</p>
        <div className="mx-auto mt-3 h-3 max-w-[360px] overflow-hidden rounded-full bg-faded-gray/20">
          <div className="h-full rounded-full bg-eager-green transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]" style={{ width: `${globalWithStatus.length ? Math.round((globalWithStatus.filter((x) => x.status === "completed").length / globalWithStatus.length) * 100) : 0}%` }} />
        </div>
        {usingCache ? <p className="mt-2 font-codingo-sans text-[11px] font-medium text-pencil-gray">Cache + server — your streak is safe even offline.</p> : null}
      </div>
    </div>
  );
}
