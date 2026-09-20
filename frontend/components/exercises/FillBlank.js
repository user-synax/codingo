"use client";

export function FillBlank({ exercise, value, onChange, showResult }) {
  const code = exercise.content?.code ?? "";
  const opts = exercise.content?.options ?? [];
  const answer = exercise.solution?.answer ?? exercise.content?.blank;
  const isCorrect = showResult ? value === answer : null;

  // Replace ___ with blank UI
  const parts = code.split("___");

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-codingo-sans text-[19px] font-bold leading-[1.4] text-charcoal">{exercise.prompt}</h2>

      <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
        <pre className="overflow-x-auto font-mono text-[14px] leading-[1.6] text-charcoal">
          <code>
            {parts[0]}
            <span className="inline-flex min-w-[84px] items-center justify-center rounded-[8px] border-2 border-faded-gray bg-faded-gray/10 px-2 py-0.5 font-mono text-[14px] font-bold text-charcoal">
              {value || "___"}
            </span>
            {parts[1] ?? ""}
          </code>
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
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
                  ? "rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-2 font-mono text-[14px] font-bold text-charcoal"
                  : isWrong
                    ? "rounded-[12px] border-2 border-destructive bg-destructive/10 px-4 py-2 font-mono text-[14px] font-bold text-destructive"
                    : selected
                      ? "rounded-[12px] border-2 border-eager-green bg-paper-white px-4 py-2 font-mono text-[14px] font-bold text-charcoal shadow-[0_2px_0_var(--color-eager-green)]"
                      : "rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2 font-mono text-[14px] font-medium text-charcoal hover:border-charcoal"
              }
            >
              {opt}
            </button>
          );
        })}
      </div>

      {showResult ? (
        <p
          className={
            isCorrect
              ? "rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-3 font-codingo-sans text-[14px] font-bold text-charcoal"
              : "rounded-[12px] border-2 border-destructive/30 bg-destructive/10 px-4 py-3 font-codingo-sans text-[14px] font-bold text-destructive"
          }
        >
          {isCorrect ? "Correct!" : `Answer: ${answer}.`} {exercise.explanation}
        </p>
      ) : null}
    </div>
  );
}
