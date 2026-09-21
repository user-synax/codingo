/* eslint-disable react-hooks/static-components -- Icon is selected per lesson title */
"use client";

import Link from "next/link";
import { useState } from "react";
import { Code2, Repeat, Braces, Lock, Check, Play } from "lucide-react";

const ICONS = {
  variables: Code2,
  loops: Repeat,
  functions: Braces,
  default: Code2,
};

function getIcon(title) {
  const t = String(title).toLowerCase();
  if (t.includes("variable")) return ICONS.variables;
  if (t.includes("loop")) return ICONS.loops;
  if (t.includes("function")) return ICONS.functions;
  return ICONS.default;
}

export function LessonNode({ lesson, status, href }) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const Icon = getIcon(lesson.title);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isActive = open || hovered;

  return (
    <div
      className={`group relative flex flex-col items-center ${isActive ? "z-30" : "z-10"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Single popover — always at TOP of every lesson circle (bottom-full) so user sees perfectly; parent z-30 > sticky header z-20, popover z-[60] */}
      <div
        className={`pointer-events-none absolute bottom-full left-1/2 z-[60] mb-4 w-[min(260px,calc(100vw-24px))] -translate-x-1/2 rounded-[14px] border-2 border-faded-gray bg-paper-white p-4 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] ${open ? "!opacity-100 !pointer-events-auto" : "group-hover:opacity-100 group-hover:pointer-events-auto"}`}
      >
        <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 border-b-2 border-r-2 border-faded-gray bg-paper-white" aria-hidden="true" />
        <p className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">
          {isLocked ? "Locked • " : isCompleted ? "Completed • " : "Ready • "}
          {lesson.xpReward ?? 10} XP
        </p>
        <p className="mt-1 font-codingo-sans text-[15px] font-bold leading-[1.2] text-charcoal">{lesson.title}</p>
        <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">{lesson.description ?? ""}</p>
        <div className="mt-3">
          {isLocked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-faded-gray/20 px-3 py-1 font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">
              <Lock className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
              Complete previous
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-storybook-green px-3 py-1 font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-charcoal">
              <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
              View lesson
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-eager-green px-3 py-1 font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-paper-white">
              <Play className="h-3 w-3 fill-paper-white" strokeWidth={2.5} aria-hidden="true" />
              Start lesson
            </span>
          )}
        </div>
      </div>

      {/* Tap overlay for mobile — shows card on tap */}
      {open ? (
        <button
          type="button"
          aria-label="Close details"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-10 bg-transparent md:hidden"
        />
      ) : null}

      <Link
        href={isLocked ? "#" : href}
        aria-disabled={isLocked}
        aria-label={`${lesson.title} — ${status}`}
        onClick={(e) => {
          if (window.matchMedia("(max-width: 767px)").matches && !isLocked) {
            if (!open) {
              e.preventDefault();
              setOpen(true);
              return;
            }
          }
        }}
        className={
          isLocked
            ? "pointer-events-none relative z-10 flex h-[80px] w-[80px] items-center justify-center rounded-full border-[3px] border-faded-gray bg-faded-gray/15 text-pencil-gray md:h-[96px] md:w-[96px]"
            : isCompleted
              ? "relative z-10 flex h-[80px] w-[80px] items-center justify-center rounded-full border-[3px] border-eager-green bg-eager-green text-paper-white shadow-[0_6px_0_var(--color-deep-leaf)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:brightness-[0.97] hover:scale-[1.04] active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-deep-leaf)] md:h-[96px] md:w-[96px]"
              : "relative z-10 flex h-[80px] w-[80px] items-center justify-center rounded-full border-[3px] border-faded-gray bg-paper-white text-charcoal shadow-[0_6px_0_var(--color-faded-gray)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-charcoal hover:scale-[1.04] hover:shadow-[0_6px_0_var(--color-charcoal)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-charcoal)] md:h-[96px] md:w-[96px]"
        }
      >
        {!isLocked && !isCompleted ? <span className="pointer-events-none absolute inset-[7px] rounded-full border border-white/40 md:inset-[8px]" aria-hidden="true" /> : null}
        {isCompleted ? (
          <Check className="h-9 w-9 md:h-10 md:w-10" strokeWidth={2.6} aria-hidden="true" />
        ) : isLocked ? (
          <Lock className="h-9 w-9 md:h-10 md:w-10" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Icon className="h-9 w-9 md:h-10 md:w-10" strokeWidth={2} aria-hidden="true" />
        )}
      </Link>
    </div>
  );
}
