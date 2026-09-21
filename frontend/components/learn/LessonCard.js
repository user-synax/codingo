"use client";

import Link from "next/link";
import { Lock, Check, Play, RotateCcw, Code2, Layers, GraduationCap, Rocket, Trophy, Clock } from "lucide-react";

const ICONS = {
  variables: Code2,
  loops: RotateCcw,
  functions: Layers,
  default: Code2,
};

function getIcon(title) {
  const t = String(title).toLowerCase();
  if (t.includes("variable")) return Code2;
  if (t.includes("loop")) return RotateCcw;
  if (t.includes("function")) return Layers;
  if (t.includes("array")) return Layers;
  if (t.includes("intro")) return GraduationCap;
  if (t.includes("final") || t.includes("project")) return Rocket;
  return Code2;
}

export function LessonCard({ lesson, status, draft, index, totalInUnit, unitTitle }) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isAvailable = status === "available";
  const hasDraft = !!draft && draft.idx > 0;
  const isContinue = isAvailable && hasDraft;
  // draft progress: idx is 0-based current exercise
  const draftProgress = draft ? Math.round(((draft.idx + 1) / (draft.total || 1)) * 100) : 0;
  const Icon = getIcon(lesson.title);
  const href = isLocked ? "#" : `/app/learn/${String(lesson._id)}`;
  const lessonNumber = typeof index === "number" ? index + 1 : 1;

  // card styles per status — follows DESIGN.md (Paper White, 12px radius, 2px border)
  const cardBase = "relative flex h-full flex-col overflow-hidden rounded-[16px] border-2 bg-paper-white p-4 transition-all duration-200";
  let cardStyle = "";
  let badge = null;
  let cta = null;

  if (isLocked) {
    cardStyle = "border-faded-gray/40 bg-faded-gray/10 opacity-75";
    badge = (
      <span className="inline-flex items-center gap-1 rounded-full border-2 border-faded-gray bg-faded-gray/20 px-2.5 py-1 font-codingo-sans text-[10px] font-black uppercase tracking-[0.05em] text-pencil-gray">
        <Lock className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
        Locked
      </span>
    );
    cta = (
      <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] border-2 border-faded-gray bg-faded-gray/15 px-4 py-2.5 font-codingo-sans text-[13px] font-bold text-pencil-gray">
        <Lock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Locked
      </span>
    );
  } else if (isCompleted) {
    cardStyle = "border-eager-green bg-storybook-green/30 hover:border-eager-green hover:shadow-[0_4px_0_var(--color-deep-leaf)] hover:-translate-y-[1px]";
    badge = (
      <span className="inline-flex items-center gap-1 rounded-full bg-eager-green px-2.5 py-1 font-codingo-sans text-[10px] font-black uppercase tracking-[0.05em] text-paper-white">
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
        Completed
      </span>
    );
    cta = (
      <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] border-2 border-eager-green bg-paper-white px-4 py-2.5 font-codingo-sans text-[13px] font-bold text-eager-green shadow-[0_3px_0_var(--color-deep-leaf)]">
        <Trophy className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        View
      </span>
    );
  } else if (isContinue) {
    cardStyle = "border-spark-blue bg-[#e6f4ff]/40 hover:border-spark-blue hover:shadow-[0_4px_0_var(--color-spark-blue)] hover:-translate-y-[1px]";
    badge = (
      <span className="inline-flex items-center gap-1 rounded-full bg-spark-blue px-2.5 py-1 font-codingo-sans text-[10px] font-black uppercase tracking-[0.05em] text-paper-white">
        <Play className="h-3 w-3 fill-paper-white" strokeWidth={2.5} aria-hidden="true" />
        Continue
      </span>
    );
    cta = (
      <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] border-2 border-spark-blue bg-spark-blue px-4 py-2.5 font-codingo-sans text-[13px] font-bold text-paper-white shadow-[0_3px_0_#0a8ac2]">
        <Play className="h-4 w-4 fill-paper-white" strokeWidth={2.5} aria-hidden="true" />
        Continue · {draft.idx + 1}/{draft.total || "?"}
      </span>
    );
  } else {
    // Start
    cardStyle = "border-faded-gray bg-paper-white hover:border-charcoal hover:shadow-[0_4px_0_var(--color-charcoal)] hover:-translate-y-[1px]";
    badge = (
      <span className="inline-flex items-center gap-1 rounded-full bg-charcoal px-2.5 py-1 font-codingo-sans text-[10px] font-black uppercase tracking-[0.05em] text-paper-white">
        <Play className="h-3 w-3 fill-paper-white" strokeWidth={2.5} aria-hidden="true" />
        Start
      </span>
    );
    cta = (
      <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] border-2 border-eager-green bg-eager-green px-4 py-2.5 font-codingo-sans text-[13px] font-bold text-paper-white shadow-[0_3px_0_var(--color-deep-leaf)]">
        <Play className="h-4 w-4 fill-paper-white" strokeWidth={2.5} aria-hidden="true" />
        Start lesson
      </span>
    );
  }

  const CardInner = (
    <div className={`${cardBase} ${cardStyle}`}>
      {/* Top row: number + xp + status — number enlarged per feedback */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border-[2.5px] text-[16px] font-black leading-none shadow-[0_2px_0_rgba(0,0,0,0.08)] sm:h-12 sm:w-12 sm:rounded-[14px] sm:text-[17px] ${isCompleted ? "border-eager-green bg-eager-green text-paper-white shadow-[0_2px_0_var(--color-deep-leaf)]" : isLocked ? "border-faded-gray bg-faded-gray/15 text-pencil-gray" : isContinue ? "border-spark-blue bg-spark-blue text-paper-white shadow-[0_2px_0_#0a8ac2]" : "border-charcoal bg-charcoal text-paper-white shadow-[0_2px_0_rgba(0,0,0,0.18)]"}`}>
            {isCompleted ? <Check className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={3} aria-hidden="true" /> : lessonNumber}
          </span>
          <span className="inline-flex items-center rounded-full bg-faded-gray/15 px-2.5 py-1 font-codingo-sans text-[11px] font-bold leading-none text-pencil-gray">
            {lesson.xpReward ?? 10} XP
          </span>
        </div>
        {badge}
      </div>

      {/* Icon + title */}
      <div className="mt-3 flex gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border-2 ${isLocked ? "border-faded-gray bg-faded-gray/10 text-pencil-gray" : isCompleted ? "border-eager-green bg-eager-green text-paper-white" : isContinue ? "border-spark-blue bg-spark-blue text-paper-white" : "border-faded-gray bg-paper-white text-charcoal"}`}>
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-codingo-sans text-[15px] font-black leading-[1.2] text-charcoal">{lesson.title}</h3>
          {unitTitle ? (
            <p className="mt-0.5 line-clamp-1 font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">{unitTitle}</p>
          ) : null}
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 line-clamp-2 min-h-[32px] font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">{lesson.description ?? "Practice • Build • Learn"}</p>

      {/* Progress bar for Continue / Completed */}
      {isContinue ? (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="font-codingo-sans text-[11px] font-bold text-spark-blue">{draft.idx + 1} / {draft.total || "?"} exercises</span>
            <span className="font-codingo-sans text-[11px] font-black text-spark-blue">{draftProgress}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-faded-gray/20">
            <div className="h-full rounded-full bg-spark-blue transition-all" style={{ width: `${draftProgress}%` }} />
          </div>
          <p className="mt-1 flex items-center gap-1 font-codingo-sans text-[11px] font-medium text-pencil-gray">
            <Clock className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            Resume where you left
          </p>
        </div>
      ) : isCompleted ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-faded-gray/20">
            <div className="h-full w-full rounded-full bg-eager-green" />
          </div>
          <p className="mt-1 font-codingo-sans text-[11px] font-bold text-eager-green">100% · Completed</p>
        </div>
      ) : isLocked ? (
        <div className="mt-3 flex items-center gap-1.5 rounded-[10px] border-2 border-faded-gray/30 bg-faded-gray/10 px-2.5 py-1.5">
          <Lock className="h-3.5 w-3.5 text-pencil-gray" strokeWidth={2} aria-hidden="true" />
          <span className="font-codingo-sans text-[11px] font-bold leading-none text-pencil-gray">Complete previous to unlock</span>
        </div>
      ) : (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-faded-gray/20">
            <div className="h-full w-0 rounded-full bg-eager-green" />
          </div>
          <p className="mt-1 font-codingo-sans text-[11px] font-medium text-pencil-gray">Not started</p>
        </div>
      )}

      {/* CTA — bottom pinned */}
      <div className="mt-4">{cta}</div>

      {/* Locked overlay click blocker */}
      {isLocked ? <span className="absolute inset-0" aria-hidden="true" /> : null}
    </div>
  );

  if (isLocked) {
    return (
      <div aria-label={`${lesson.title} — locked`} className="h-full">
        {CardInner}
      </div>
    );
  }

  return (
    <Link href={href} aria-label={`${lesson.title} — ${isCompleted ? "completed" : isContinue ? "continue" : "start"}`} className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue">
      {CardInner}
    </Link>
  );
}
