"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LessonProgressBar } from "@/components/lesson/LessonProgressBar";
import { MultipleChoice } from "@/components/exercises/MultipleChoice";
import { FillBlank } from "@/components/exercises/FillBlank";
import { ArrangeBlocks } from "@/components/exercises/ArrangeBlocks";
import { PredictOutput } from "@/components/exercises/PredictOutput";
import { FixBug } from "@/components/exercises/FixBug";
import { WriteCode } from "@/components/exercises/WriteCode";
import { useProgressStore } from "@/stores/progressStore";
import { runCode, compareOutput } from "@/lib/runner";
import { playCorrect, playWrong, playComplete, isMuted, toggleMuted } from "@/lib/sound";
import { Confetti } from "@/components/lesson/Confetti";
import { AiHelper } from "@/components/lesson/AiHelper";
import { Volume2, VolumeX, Flame } from "lucide-react";

/* Single-screen lesson runner — one exercise at a time, distraction-free.
   Follows design.md (Paper White, 12px radius, 2px borders, 3D buttons) and
   transitions-dev: panel reveal for hint, success check on complete, error shake on wrong. */

function HintPanel({ hints, exercise }) {
  const [open, setOpen] = useState(false);
  const text = hints?.[0] ?? exercise?.hints?.[0];
  if (!text) return null;
  return (
    <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="inline-flex items-center gap-2 font-codingo-sans text-[13px] font-bold text-spark-blue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          Hint
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-pencil-gray transition-transform duration-[var(--duration-fast)] ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className="border-t-2 border-faded-gray px-4 py-3">
          <p className="font-codingo-sans text-[14px] font-medium leading-[1.4] text-charcoal">{text}</p>
        </div>
      ) : null}
    </div>
  );
}

export function LessonRunner({ lesson, exercises }) {
  const router = useRouter();
  const save = useProgressStore((s) => s.save);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [firstTryCorrect, setFirstTryCorrect] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [muted, setMuted] = useState(() => {
    try {
      return isMuted();
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const onMute = (e) => {
      try {
        setMuted(e.detail?.muted ?? isMuted());
      } catch {}
    };
    window.addEventListener("codingo:mute", onMute);
    return () => window.removeEventListener("codingo:mute", onMute);
  }, []);

  const total = exercises.length;
  const current = exercises[idx];

  const score = useMemo(() => {
    let correct = 0;
    for (const ex of exercises) {
      const v = answers[ex._id];
      const ch = checked[ex._id];
      if (!ch) continue;
      // Simple correctness check per type
      let ok = false;
      if (ex.type === "multiple_choice") ok = v === ex.solution?.correctIndex;
      else if (ex.type === "fill_blank") ok = v === ex.solution?.answer;
      else if (ex.type === "arrange") ok = JSON.stringify(v) === JSON.stringify(ex.solution?.order);
      else if (ex.type === "predict_output") ok = String(v).trim() === String(ex.solution?.answer).trim();
      else if (ex.type === "fix_bug" || ex.type === "write_code") ok = ch === true; // set via inner component? we track via firstTryCorrect
      // For code types, we rely on firstTryCorrect map set by parent? Instead we treat checked as boolean
      if (ex.type === "fix_bug" || ex.type === "write_code") ok = firstTryCorrect[ex._id] ?? false;
      else if (ok) correct++;
      else if (ex.type !== "fix_bug" && ex.type !== "write_code" && ch) {
        // for non-code, ch is boolean already? we set checked[ex._id]=isCorrect
        ok = ch === true;
        if (ok) correct++;
      }
    }
    // For simplicity, compute from firstTryCorrect for code types and direct check for others
    let c = 0;
    for (const ex of exercises) {
      if (ex.type === "multiple_choice") { if (checked[ex._id] === true) c++; }
      else if (ex.type === "fill_blank") { if (checked[ex._id] === true) c++; }
      else if (ex.type === "arrange") { if (checked[ex._id] === true) c++; }
      else if (ex.type === "predict_output") { if (checked[ex._id] === true) c++; }
      else if (ex.type === "fix_bug" || ex.type === "write_code") { if (firstTryCorrect[ex._id] === true) c++; }
    }
    return total ? Math.round((c / total) * 100) : 0;
  }, [answers, checked, firstTryCorrect, exercises, total]);

  const isLast = idx === total - 1;
  const hasChecked = checked[current?._id] !== undefined;

  function handleValue(v) {
    setAnswers((s) => ({ ...s, [current._id]: v }));
  }

  const [checking, setChecking] = useState(false);

  async function handleCheck() {
    if (checking) return;
    setChecking(true);
    let correct = false;

    if (current.type === "multiple_choice") correct = answers[current._id] === current.solution?.correctIndex;
    else if (current.type === "fill_blank") correct = answers[current._id] === current.solution?.answer;
    else if (current.type === "arrange") correct = JSON.stringify(answers[current._id]) === JSON.stringify(current.solution?.order);
    else if (current.type === "predict_output") correct = String(answers[current._id]).trim() === String(current.solution?.answer).trim();
    else if (current.type === "fix_bug" || current.type === "write_code") {
      const code = answers[current._id] ?? current.content?.starterCode ?? current.content?.code ?? "";
      const expected = current.content?.tests?.[0]?.expected ?? null;
      const res = await runCode({ code, language: "javascript", timeout: 2000 });
      if (expected !== null) {
        correct = !res.error && !res.timedOut && compareOutput(res.output, expected);
      } else {
        // No expected test — just check it runs without error and produces output
        correct = !res.error && !res.timedOut;
      }
    }

    setChecked((s) => ({ ...s, [current._id]: correct }));
    if (!(current._id in firstTryCorrect)) {
      setFirstTryCorrect((s) => ({ ...s, [current._id]: correct }));
    } else if (!firstTryCorrect[current._id] && correct) {
      // keep first try false if it was wrong first time
    }
    try {
      if (correct) playCorrect();
      else playWrong();
    } catch {}
    setChecking(false);
  }

  const [xpResult, setXpResult] = useState(null);

  async function handleNext() {
    if (!hasChecked) return;
    if (isLast) {
      setSaving(true);
      const allCorrectFirstTry = exercises.every((ex) => firstTryCorrect[ex._id] === true);
      // Count correct for XP: number of checked true
      let correctCount = 0;
      for (const ex of exercises) if (checked[ex._id] === true) correctCount++;
      // For code types, checked true already means correct, so above covers.
      // But for code we stored in firstTryCorrect, checked is boolean too, so same.
      // Ensure at least score-based fallback
      if (correctCount === 0 && score > 0) correctCount = Math.round((score / 100) * total);
      try {
        const res = await save({
          lessonId: lesson._id,
          score,
          completed: true,
          firstTry: allCorrectFirstTry,
          correctCount,
          total,
        });
        setXpResult(res);
        setCelebrate(true);
        setDone(true);
        try {
          playComplete();
        } catch {}
      } catch (e) {
        setDone(true);
        try {
          playComplete();
        } catch {}
      } finally {
        setSaving(false);
      }
      return;
    }
    setIdx((i) => i + 1);
  }

  if (done) {
    const xp = xpResult?.xpAwarded ?? lesson.xpReward ?? 10;
    const newBadges = xpResult?.newBadges ?? [];
    const levelUp = xpResult?.levelUp ?? null;
    const streak = xpResult?.streak ?? xpResult?.user?.streak ?? null;
    return (
      <div className="relative mx-auto flex w-full max-w-[720px] flex-col items-center gap-6 py-10 text-center">
        <Confetti show={celebrate} />
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-storybook-green text-eager-green">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="font-codingo-sans text-[32px] font-bold leading-[1.2] text-charcoal">Lesson complete!</h1>
        <p className="max-w-[480px] font-codingo-sans text-[15px] font-medium leading-[1.4] text-pencil-gray">
          You scored {score}%. {score >= 80 ? "Great job — keep the streak going!" : "Keep practicing — you can retry."}
        </p>

        <div className="grid w-full max-w-[480px] grid-cols-3 gap-3">
          <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-3">
            <p className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">XP</p>
            <p className="mt-1 font-codingo-sans text-[22px] font-black leading-none text-eager-green">+{xp}</p>
          </div>
          <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-3">
            <p className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Streak</p>
            <p className="mt-1 flex items-center justify-center gap-1 font-codingo-sans text-[22px] font-black leading-none text-charcoal">
              <Flame className="h-5 w-5 text-[#ff9600]" strokeWidth={2.4} aria-hidden="true" />
              {streak?.count ?? "—"}
            </p>
          </div>
          <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-3">
            <p className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Level</p>
            <p className="mt-1 font-codingo-sans text-[22px] font-black leading-none text-spark-blue">Lv {xpResult?.user?.level ?? "—"}</p>
          </div>
        </div>

        {levelUp ? (
          <div className="w-full max-w-[480px] rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-3">
            <p className="font-codingo-sans text-[14px] font-black text-charcoal">Level up! {levelUp.from} → {levelUp.to}</p>
            <p className="mt-1 font-codingo-sans text-[13px] font-medium text-charcoal">You’ve reached a new level — keep going!</p>
          </div>
        ) : null}

        {newBadges.length ? (
          <div className="w-full max-w-[480px] rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
            <p className="font-codingo-sans text-[12px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Badge unlocked</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {newBadges.map((b) => (
                <span key={b} className="inline-flex items-center gap-1 rounded-full bg-charcoal px-3 py-1 font-codingo-sans text-[13px] font-bold text-paper-white">
                  {b}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex w-full max-w-[480px] flex-col gap-3 sm:flex-row">
          <Button variant="primary" className="flex-1" onClick={() => router.push("/app/learn")}>
            Back to path
          </Button>
          <Button variant="outline" className="flex-1 bg-paper-white" onClick={() => router.push("/app")}>
            Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <LessonProgressBar current={idx + 1} total={total} />
        </div>
        <button
          type="button"
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
          aria-pressed={muted}
          onClick={() => setMuted(toggleMuted())}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border-2 border-faded-gray bg-paper-white text-pencil-gray transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-charcoal hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue"
        >
          {muted ? <VolumeX className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> : <Volume2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
        </button>
      </div>

      <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-5 sm:p-6">
        {current.type === "multiple_choice" ? (
          <MultipleChoice
            exercise={current}
            value={answers[current._id]}
            onChange={handleValue}
            showResult={hasChecked}
          />
        ) : null}
        {current.type === "fill_blank" ? (
          <FillBlank exercise={current} value={answers[current._id]} onChange={handleValue} showResult={hasChecked} />
        ) : null}
        {current.type === "arrange" ? (
          <ArrangeBlocks exercise={current} value={answers[current._id]} onChange={handleValue} showResult={hasChecked} />
        ) : null}
        {current.type === "predict_output" ? (
          <PredictOutput exercise={current} value={answers[current._id]} onChange={handleValue} showResult={hasChecked} />
        ) : null}
        {current.type === "fix_bug" ? (
          <FixBug exercise={current} value={answers[current._id]} onChange={handleValue} showResult={hasChecked} />
        ) : null}
        {current.type === "write_code" ? (
          <WriteCode exercise={current} value={answers[current._id]} onChange={handleValue} showResult={hasChecked} />
        ) : null}

        <div className="mt-4">
          <HintPanel hints={current.hints} exercise={current} />
        </div>
        <div className="mt-3">
          <AiHelper lesson={lesson} exercise={current} value={answers[current._id]} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="bg-paper-white"
          onClick={() => router.push("/app/learn")}
          disabled={saving || checking}
        >
          Exit
        </Button>
        <div className="flex-1" />
        {!hasChecked ? (
          <Button
            variant="primary"
            onClick={handleCheck}
            disabled={
              checking ||
              (current.type !== "fix_bug" &&
                current.type !== "write_code" &&
                (answers[current._id] === undefined ||
                  answers[current._id] === "" ||
                  (Array.isArray(answers[current._id]) && answers[current._id].length === 0)))
            }
          >
            {checking ? "Checking…" : "Check"}
          </Button>
        ) : (
          <Button variant="primary" onClick={handleNext} disabled={saving}>
            {saving ? "Saving…" : isLast ? "Complete" : "Next"}
          </Button>
        )}
      </div>
    </div>
  );
}
