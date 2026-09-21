"use client";

import { useState } from "react";
import { Send, Sparkles, Pencil } from "lucide-react";
import { askAi } from "@/lib/api";

/* AI prompt — the signature exercise of the Code with AI path.
   The learner writes a real prompt, a live AI answers (same rate-limited,
   cached backend as the Ask-AI helper), then the learner self-checks the
   answer against a short checklist. Grading is deterministic (checklist vs
   solution) while the AI magic stays live.
   value shape: { prompt, asked, usedExample, answer, checks: (bool|null)[] }.
   If the AI is unavailable (not configured / daily limit), the learner can
   continue with the seeded example answer. No emoji — lucide icons only. */

function emptyChecks(n) {
  return Array.from({ length: n }, () => null);
}

export function AiPrompt({ exercise, value, onChange, showResult, lessonId }) {
  const checklist = exercise.content?.checklist ?? [];
  const correct = exercise.solution?.checklist ?? [];
  const v = value ?? { prompt: "", asked: false, usedExample: false, answer: null, checks: emptyChecks(checklist.length) };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(null);

  const locked = v.asked || v.usedExample;

  function set(part) {
    onChange({ ...v, checks: v.checks?.length === checklist.length ? v.checks : emptyChecks(checklist.length), ...part });
  }

  async function handleAsk(e) {
    e?.preventDefault?.();
    const prompt = (v.prompt ?? "").trim();
    if (loading || !prompt || locked) return;
    setLoading(true);
    setError("");
    try {
      const task = exercise.content?.aiTask ?? "Answer briefly and simply for a beginner.";
      const { ok, data, status } = await askAi({
        lessonId: lessonId ?? null,
        exerciseId: exercise?._id ? String(exercise._id) : null,
        question: `${task}\n\nMy request: ${prompt}`,
      });
      if (!ok) {
        if (status === 429) setError(data?.message ?? "Daily AI limit reached — use the example answer below to keep going.");
        else if (status === 501) setError("The AI buddy isn't awake yet — use the example answer below to keep going.");
        else setError(data?.message ?? "Couldn't reach the AI buddy. Try again, or use the example answer.");
        return;
      }
      set({ asked: true, usedExample: false, answer: data?.answer ?? "" });
      if (typeof data?.remaining === "number") setRemaining(data.remaining);
    } catch {
      setError("Network error. Try again, or use the example answer below.");
    } finally {
      setLoading(false);
    }
  }

  function useExample() {
    set({ usedExample: true, asked: false, answer: exercise.content?.exampleAnswer ?? "" });
    setError("");
  }

  function editPrompt() {
    set({ asked: false, usedExample: false, answer: null, checks: emptyChecks(checklist.length) });
    setError("");
  }

  function setCheck(i, val) {
    const next = [...(v.checks ?? emptyChecks(checklist.length))];
    next[i] = val;
    set({ checks: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-codingo-sans text-[19px] font-bold leading-[1.4] text-charcoal">{exercise.prompt}</h2>

      {exercise.content?.scenario ? (
        <div className="rounded-[12px] border-2 border-spark-blue/40 bg-[#e6f4ff] px-4 py-3">
          <p className="flex items-start gap-2 font-codingo-sans text-[14px] font-medium leading-[1.5] text-charcoal">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-spark-blue" strokeWidth={2.2} aria-hidden="true" />
            {exercise.content.scenario}
          </p>
        </div>
      ) : null}

      {/* Prompt box */}
      <form onSubmit={handleAsk} className="flex flex-col gap-2">
        <label
          htmlFor={`aiprompt-${String(exercise?._id ?? "x")}`}
          className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.04em] text-pencil-gray"
        >
          Your prompt
        </label>
        <textarea
          id={`aiprompt-${String(exercise?._id ?? "x")}`}
          value={v.prompt ?? ""}
          disabled={locked || showResult}
          onChange={(e) => set({ prompt: e.target.value })}
          maxLength={1000}
          rows={3}
          placeholder={exercise.content?.placeholder ?? "Write your prompt here — be clear and specific…"}
          className="min-w-0 resize-y rounded-[12px] border-2 border-faded-gray bg-paper-white px-3 py-2.5 font-codingo-sans text-[15px] font-medium leading-[1.5] text-charcoal placeholder:text-pencil-gray/70 focus:border-spark-blue focus:outline-none disabled:opacity-70"
        />
        {!locked && !showResult ? (
          <button
            type="submit"
            disabled={loading || !(v.prompt ?? "").trim()}
            className="codingo-btn codingo-btn-primary inline-flex items-center justify-center gap-2 self-start rounded-[12px] border-2 border-spark-blue bg-spark-blue px-5 py-2.5 font-codingo-sans text-[14px] font-bold leading-none text-paper-white transition-opacity disabled:opacity-50"
            style={{ boxShadow: "0 4px 0 #0b7fc1" }}
          >
            <Send className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            {loading ? "Asking the AI…" : "Ask the AI"}
          </button>
        ) : null}
        {locked && !showResult ? (
          <button
            type="button"
            onClick={editPrompt}
            className="inline-flex items-center gap-1.5 self-start rounded-[12px] border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[13px] font-bold text-pencil-gray hover:border-charcoal hover:text-charcoal"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            Edit prompt
          </button>
        ) : null}
      </form>

      {loading ? (
        <div className="flex flex-col gap-1.5" aria-label="AI is thinking">
          <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-faded-gray/30" />
          <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-faded-gray/20" />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[12px] border-2 border-destructive/30 bg-destructive/10 px-4 py-3">
          <p role="alert" className="font-codingo-sans text-[13px] font-bold leading-[1.4] text-destructive">{error}</p>
          {exercise.content?.exampleAnswer && !locked ? (
            <button
              type="button"
              onClick={useExample}
              className="mt-2 inline-flex items-center gap-1.5 rounded-[12px] border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[13px] font-bold text-charcoal hover:border-charcoal"
            >
              Use example answer instead
            </button>
          ) : null}
        </div>
      ) : null}

      {v.answer && !loading ? (
        <div className="rounded-[12px] border-2 border-spark-blue/40 bg-[#e6f4ff] px-4 py-3">
          <p className="font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-spark-blue">
            {v.usedExample ? "Example answer" : "The AI answered"}
            {typeof remaining === "number" && !v.usedExample ? ` · ${remaining} left today` : ""}
          </p>
          <p className="mt-1.5 whitespace-pre-line font-codingo-sans text-[14px] font-medium leading-[1.5] text-charcoal">
            {v.answer}
          </p>
        </div>
      ) : null}

      {/* Self-check checklist — this is what gets graded */}
      {locked && checklist.length ? (
        <div className="flex flex-col gap-2">
          <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.04em] text-pencil-gray">
            Check the answer — yes or no?
          </p>
          {checklist.map((item, i) => {
            const picked = v.checks?.[i] ?? null;
            const right = correct[i];
            const good = showResult && picked === right;
            const bad = showResult && picked !== null && picked !== right;
            return (
              <div
                key={i}
                className={
                  good
                    ? "rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-3"
                    : bad
                      ? "rounded-[12px] border-2 border-destructive bg-destructive/10 px-4 py-3"
                      : "rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-3"
                }
              >
                <p className="font-codingo-sans text-[14px] font-bold leading-[1.4] text-charcoal">{item}</p>
                <div className="mt-2 flex gap-2">
                  {[true, false].map((opt) => (
                    <button
                      key={String(opt)}
                      type="button"
                      disabled={showResult}
                      onClick={() => setCheck(i, opt)}
                      aria-pressed={picked === opt}
                      className={
                        picked === opt
                          ? "rounded-[10px] border-2 border-eager-green bg-eager-green px-4 py-1.5 font-codingo-sans text-[13px] font-bold text-paper-white"
                          : "rounded-[10px] border-2 border-faded-gray bg-paper-white px-4 py-1.5 font-codingo-sans text-[13px] font-bold text-pencil-gray hover:border-charcoal hover:text-charcoal"
                      }
                    >
                      {opt ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {showResult ? (
        <p className="rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-3 font-codingo-sans text-[14px] font-bold leading-[1.4] text-charcoal">
          {exercise.explanation}
        </p>
      ) : null}
    </div>
  );
}
