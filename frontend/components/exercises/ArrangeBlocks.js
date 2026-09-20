"use client";

import { useState } from "react";

/* Arrange — tap to order lines. Uses transitions-dev card-resize for movement. */

export function ArrangeBlocks({ exercise, value, onChange, showResult }) {
  const blocks = exercise.content?.blocks ?? [];
  const solutionOrder = exercise.solution?.order ?? blocks.map((_, i) => i);
  const ordered = value ?? [];
  const isCorrect = showResult ? JSON.stringify(ordered) === JSON.stringify(solutionOrder) : null;

  const available = blocks.map((_, i) => i).filter((i) => !ordered.includes(i));

  function toggle(idx) {
    if (showResult) return;
    if (ordered.includes(idx)) {
      onChange(ordered.filter((x) => x !== idx));
    } else {
      onChange([...ordered, idx]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-codingo-sans text-[19px] font-bold leading-[1.4] text-charcoal">{exercise.prompt}</h2>

      <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
        <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Your order</p>
        <div className="mt-2 flex min-h-[88px] flex-col gap-2">
          {ordered.length === 0 ? (
            <p className="rounded-[12px] border-2 border-dashed border-faded-gray bg-faded-gray/10 px-4 py-6 text-center font-codingo-sans text-[14px] font-medium text-pencil-gray">
              Tap blocks below to build the answer
            </p>
          ) : (
            ordered.map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggle(idx)}
                disabled={showResult}
                className="w-full rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-2.5 text-left font-mono text-[13px] font-medium leading-[1.5] text-charcoal transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
              >
                {blocks[idx]}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {available.map((idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => toggle(idx)}
            disabled={showResult}
            className="rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2 font-mono text-[13px] font-medium text-charcoal transition-colors hover:border-charcoal disabled:opacity-60"
          >
            {blocks[idx]}
          </button>
        ))}
        {available.length === 0 && !showResult ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2 font-codingo-sans text-[13px] font-bold text-pencil-gray hover:border-charcoal"
          >
            Clear
          </button>
        ) : null}
      </div>

      {showResult ? (
        <p
          className={
            isCorrect
              ? "rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-3 font-codingo-sans text-[14px] font-bold text-charcoal"
              : "rounded-[12px] border-2 border-destructive/30 bg-destructive/10 px-4 py-3 font-codingo-sans text-[14px] font-bold text-destructive"
          }
        >
          {isCorrect ? "Perfect order!" : "Check the order."} {exercise.explanation}
        </p>
      ) : null}
    </div>
  );
}
