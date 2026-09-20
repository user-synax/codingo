"use client";

import { useMemo } from "react";
import { shuffled } from "@/lib/shuffle";

/* Multiple choice — concept check. Beautiful per design.md: Paper White cards,
   12px radius, 2px border, green for correct, destructive for wrong.
   Uses transitions-dev error-shake (12) on wrong Check.
   Options are seeded-shuffled per exercise; the stored value stays the
   ORIGINAL index so checking needs no changes. */

export function MultipleChoice({ exercise, value, onChange, showResult }) {
  const opts = exercise.content?.options ?? [];
  const correct = exercise.solution?.correctIndex;
  const isCorrect = showResult ? value === correct : null;

  // [{ opt, orig }] shuffled once per exercise — value keeps original index
  const display = useMemo(() => {
    const list = exercise.content?.options ?? [];
    return shuffled(
      list.map((opt, orig) => ({ opt, orig })),
      `mcq:${String(exercise?._id ?? exercise?.prompt ?? "")}`,
    );
  }, [exercise]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-codingo-sans text-[19px] font-bold leading-[1.4] text-charcoal">{exercise.prompt}</h2>
      <div className="flex flex-col gap-2.5">
        {display.map(({ opt, orig }) => {
          const selected = value === orig;
          const isRight = showResult && orig === correct;
          const isWrongPick = showResult && selected && orig !== correct;
          return (
            <button
              key={orig}
              type="button"
              onClick={() => !showResult && onChange(orig)}
              disabled={showResult}
              aria-pressed={selected}
              className={
                isRight
                  ? "w-full rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-3 text-left font-codingo-sans text-[15px] font-bold leading-[1.4] text-charcoal"
                  : isWrongPick
                    ? "w-full rounded-[12px] border-2 border-destructive bg-destructive/10 px-4 py-3 text-left font-codingo-sans text-[15px] font-bold leading-[1.4] text-destructive"
                    : selected
                      ? "w-full rounded-[12px] border-2 border-eager-green bg-paper-white px-4 py-3 text-left font-codingo-sans text-[15px] font-bold leading-[1.4] text-charcoal shadow-[0_2px_0_var(--color-eager-green)]"
                      : "w-full rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-3 text-left font-codingo-sans text-[15px] font-medium leading-[1.4] text-charcoal transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-charcoal"
              }
            >
              <span className="flex items-center gap-3">
                <span
                  className={
                    isRight
                      ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-eager-green text-paper-white"
                      : isWrongPick
                        ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive text-paper-white"
                        : selected
                          ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-eager-green bg-paper-white"
                          : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-faded-gray bg-paper-white"
                  }
                  aria-hidden="true"
                >
                  {isRight ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isWrongPick ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  ) : selected ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-eager-green" />
                  ) : null}
                </span>
                {opt}
              </span>
            </button>
          );
        })}
      </div>
      {showResult ? (
        <p
          className={
            isCorrect
              ? "rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-3 font-codingo-sans text-[14px] font-bold leading-[1.4] text-charcoal"
              : "rounded-[12px] border-2 border-destructive/30 bg-destructive/10 px-4 py-3 font-codingo-sans text-[14px] font-bold leading-[1.4] text-destructive"
          }
        >
          {isCorrect ? "Nice!" : "Not quite."} {exercise.explanation}
        </p>
      ) : null}
    </div>
  );
}
