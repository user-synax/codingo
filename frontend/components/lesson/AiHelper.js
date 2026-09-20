/* AI doubt helper panel — hint-first answers inside a lesson (PRD 5.6).
   Sends exercise context + learner work, never the stored solution.
   Shows remaining daily budget. No emoji — lucide icons only. */
"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { aiStatus, askAi } from "@/lib/api";

function describeWork(exercise, value) {
  if (value === undefined || value === null || value === "") return null;
  try {
    if (typeof value === "string") return value.slice(0, 1500);
    if (typeof value === "number") {
      const opts = exercise?.content?.options ?? exercise?.content?.blocks ?? null;
      if (Array.isArray(opts) && opts[value] !== undefined) return `Selected: ${String(opts[value])}`;
      return `Selected option ${value}`;
    }
    if (Array.isArray(value)) {
      const blocks = exercise?.content?.blocks ?? [];
      if (blocks.length) return value.map((i) => blocks[i] ?? "").filter(Boolean).join("\n");
      return JSON.stringify(value).slice(0, 500);
    }
    return JSON.stringify(value).slice(0, 500);
  } catch {
    return null;
  }
}

export function AiHelper({ lesson, exercise, value }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [statusLoaded, setStatusLoaded] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !statusLoaded) {
      setStatusLoaded(true);
      try {
        const { ok, data } = await aiStatus();
        if (ok) setRemaining(data.remaining);
      } catch {}
    }
  }

  async function handleAsk(e) {
    e.preventDefault();
    if (loading || !question.trim()) return;
    setLoading(true);
    setError("");
    try {
      const work = describeWork(exercise, value);
      const { ok, data, status } = await askAi({
        lessonId: lesson?._id ? String(lesson._id) : null,
        exerciseId: exercise?._id ? String(exercise._id) : null,
        question: question.trim(),
        code: work,
      });
      if (!ok) {
        if (status === 429) setError(data?.message ?? "Daily AI limit reached.");
        else if (status === 501) setError("AI help isn't set up yet — ask the community instead.");
        else setError(data?.message ?? "Couldn't reach the AI helper. Try again.");
        return;
      }
      setAnswer(data);
      if (typeof data?.remaining === "number") setRemaining(data.remaining);
    } catch {
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="inline-flex items-center gap-2 font-codingo-sans text-[13px] font-bold text-spark-blue">
          <Sparkles className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          Ask AI
          {typeof remaining === "number" ? (
            <span className="rounded-full bg-[#e6f4ff] px-2 py-0.5 font-codingo-sans text-[11px] font-black leading-none text-spark-blue">
              {remaining} left
            </span>
          ) : null}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-pencil-gray transition-transform duration-[var(--duration-fast)] ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="border-t-2 border-faded-gray px-4 py-3">
          <p className="font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">
            Stuck? Ask — you get a hint, not the full answer.
          </p>
          <form onSubmit={handleAsk} className="mt-2 flex items-end gap-2">
            <label htmlFor={`ai-q-${exercise?._id ?? "x"}`} className="sr-only">
              Ask the AI helper
            </label>
            <textarea
              id={`ai-q-${exercise?._id ?? "x"}`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="e.g. why doesn't my loop stop?"
              className="max-h-[120px] min-w-0 flex-1 resize-y rounded-[10px] border-2 border-faded-gray bg-paper-white px-3 py-2 font-codingo-sans text-[14px] font-medium leading-[1.4] text-charcoal placeholder:text-pencil-gray/70 focus:border-spark-blue focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              aria-label="Send question"
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-spark-blue text-paper-white transition-opacity disabled:opacity-50"
            >
              <Send className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            </button>
          </form>

          {loading ? (
            <div className="mt-2 flex flex-col gap-1.5" aria-label="AI is thinking">
              <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-faded-gray/30" />
              <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-faded-gray/20" />
            </div>
          ) : null}
          {error ? (
            <p className="mt-2 font-codingo-sans text-[13px] font-bold text-[#e03131]" role="alert">
              {error}
            </p>
          ) : null}
          {answer && !loading ? (
            <div className="mt-2 rounded-[10px] bg-[#e6f4ff] px-3 py-2.5">
              <p className="whitespace-pre-line font-codingo-sans text-[14px] font-medium leading-[1.5] text-charcoal">
                {answer.answer}
              </p>
              <p className="mt-1.5 font-codingo-sans text-[11px] font-bold text-pencil-gray">
                Codingo AI{answer.cached ? " · instant answer" : ""} · {answer.remaining ?? remaining ?? "—"} left today
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
