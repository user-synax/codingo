"use client";

/* Predict output — snippet + choose or type. Reuses multiple_choice styling. */

export function PredictOutput({ exercise, value, onChange, showResult }) {
  const snippet = exercise.content?.snippet ?? "";
  const opts = exercise.content?.options ?? null;
  const answer = exercise.solution?.answer ?? "";
  const isCorrect = showResult ? String(value).trim() === String(answer).trim() : null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-codingo-sans text-[19px] font-bold leading-[1.4] text-charcoal">{exercise.prompt}</h2>

      <div className="overflow-hidden rounded-[12px] border-2 border-faded-gray bg-paper-white">
        <div className="border-b-2 border-faded-gray bg-faded-gray/10 px-4 py-2">
          <p className="font-mono text-[12px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Code</p>
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-[1.6] text-charcoal">
          <code>{snippet}</code>
        </pre>
      </div>

      {opts ? (
        <div className="flex flex-col gap-2">
          {opts.map((opt) => {
            const selected = value === opt;
            const isRight = showResult && opt === answer;
            const isWrong = showResult && selected && opt !== answer;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => !showResult && onChange(opt)}
                aria-pressed={selected}
                disabled={showResult}
                className={
                  isRight
                    ? "w-full rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-3 text-left font-mono text-[14px] font-bold text-charcoal"
                    : isWrong
                      ? "w-full rounded-[12px] border-2 border-destructive bg-destructive/10 px-4 py-3 text-left font-mono text-[14px] font-bold text-destructive"
                      : selected
                        ? "w-full rounded-[12px] border-2 border-eager-green bg-paper-white px-4 py-3 text-left font-mono text-[14px] font-bold text-charcoal shadow-[0_2px_0_var(--color-eager-green)]"
                        : "w-full rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-3 text-left font-mono text-[14px] font-medium text-charcoal hover:border-charcoal"
                }
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="font-codingo-sans text-[14px] font-bold text-charcoal">Your answer</label>
          <input
            value={value ?? ""}
            onChange={(e) => !showResult && onChange(e.target.value)}
            disabled={showResult}
            placeholder="Type the output"
            className="h-[44px] w-full rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 font-mono text-[14px] text-charcoal placeholder:text-pencil-gray/60 outline-none focus:border-spark-blue disabled:opacity-60"
          />
        </div>
      )}

      {showResult ? (
        <p
          className={
            isCorrect
              ? "rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-3 font-codingo-sans text-[14px] font-bold text-charcoal"
              : "rounded-[12px] border-2 border-destructive/30 bg-destructive/10 px-4 py-3 font-codingo-sans text-[14px] font-bold text-destructive"
          }
        >
          {isCorrect ? "Got it!" : `Output is: ${answer}.`} {exercise.explanation}
        </p>
      ) : null}
    </div>
  );
}
