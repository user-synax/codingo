"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LessonProgressBar } from "@/components/lesson/LessonProgressBar";
import { MultipleChoice } from "@/components/exercises/MultipleChoice";
import { FillBlank } from "@/components/exercises/FillBlank";
import { ArrangeBlocks } from "@/components/exercises/ArrangeBlocks";
import { PredictOutput } from "@/components/exercises/PredictOutput";
import { FixBug } from "@/components/exercises/FixBug";
import { WriteCode } from "@/components/exercises/WriteCode";
import { AiPrompt } from "@/components/exercises/AiPrompt";
import { useProgressStore } from "@/stores/progressStore";
import { runCode, compareOutput } from "@/lib/runner";
import { playCorrect, playWrong, playComplete, isMuted, toggleMuted } from "@/lib/sound";
import { Confetti } from "@/components/lesson/Confetti";
import { AiHelper } from "@/components/lesson/AiHelper";
import { Volume2, VolumeX, Flame, Clock, PauseCircle } from "lucide-react";
import * as progressDb from "@/lib/progressDb";

/* Single-screen lesson runner — one exercise at a time, distraction-free.
   Draft resume (idx + answers + checked) + exit confirm modal, no hearts/CC.
   Follows design.md (Paper White, 12px radius, 2px borders, 3D buttons) */

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

function aiPromptReady(v, ex) {
  if (!v || typeof v !== "object") return false;
  if (!(v.prompt ?? "").trim()) return false;
  if (!v.asked && !v.usedExample) return false;
  const n = ex?.content?.checklist?.length ?? 0;
  const checks = Array.isArray(v.checks) ? v.checks : [];
  if (checks.length !== n) return false;
  return checks.every((c) => c === true || c === false);
}

function ExitConfirmModal({ open, onStay, onLeave, current, total }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onStay} className="absolute inset-0 bg-night-ink/60 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-[420px] rounded-[16px] border-2 border-faded-gray bg-paper-white p-6 shadow-[0_16px_32px_rgba(0,0,0,0.18)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f4ff] text-spark-blue">
          <PauseCircle className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-center font-codingo-sans text-[20px] font-black leading-[1.2] text-charcoal">Leave lesson?</h2>
        <p className="mt-2 text-center font-codingo-sans text-[14px] font-medium leading-[1.4] text-pencil-gray">
          Your progress up to exercise <span className="font-bold text-charcoal">{current}</span> of <span className="font-bold text-charcoal">{total}</span> will be saved. You can continue later from where you left.
        </p>
        <div className="mt-1.5 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-storybook-green px-3 py-1 font-codingo-sans text-[11px] font-bold text-charcoal">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            Resume anytime
          </span>
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onStay} className="flex-1 rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-3 font-codingo-sans text-[14px] font-bold text-charcoal hover:border-charcoal">
            Stay
          </button>
          <button type="button" onClick={onLeave} className="flex-1 rounded-[12px] border-2 border-eager-green bg-eager-green px-4 py-3 font-codingo-sans text-[14px] font-bold text-paper-white shadow-[0_4px_0_var(--color-deep-leaf)] hover:brightness-95">
            Leave &amp; save
          </button>
        </div>
        <p className="mt-2 text-center font-codingo-sans text-[11px] font-medium text-pencil-gray">Progress saved locally — syncs when you return.</p>
      </div>
    </div>
  );
}

export function LessonRunner({ lesson, exercises, nextLesson }) {
  const router = useRouter();
  const save = useProgressStore((s) => s.save);
  const storeUserId = useProgressStore((s) => s.userId);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [firstTryCorrect, setFirstTryCorrect] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftLoadedRef = useRef(false);
  const pendingSaveRef = useRef(null);
  const userIdRef = useRef(storeUserId);

  useEffect(() => {
    userIdRef.current = storeUserId;
  }, [storeUserId]);

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

  // ----- Draft: load on mount (IndexedDB only) -----
  useEffect(() => {
    if (!progressDb.isSupported() || !lesson?._id) return;
    let alive = true;
    (async () => {
      try {
        const uid = storeUserId ?? userIdRef.current ?? "anon";
        let draft = await progressDb.getLessonDraft(String(lesson._id), uid).catch(() => null);
        if (!draft && uid && uid !== "anon") {
          draft = await progressDb.getLessonDraft(String(lesson._id), "anon").catch(() => null);
        }
        if (!draft && !uid) {
          const all = await progressDb.getAllDrafts().catch(() => []);
          draft = all.find((d) => String(d.lessonId) === String(lesson._id)) ?? null;
        }
        if (!alive || !draft) {
          draftLoadedRef.current = true;
          return;
        }
        const draftIdx = typeof draft.idx === "number" ? draft.idx : 0;
        const draftTotal = draft.total ?? exercises.length;
        if (draftIdx >= 0 && draftIdx < exercises.length && draftTotal === exercises.length) {
          const hasProgress = draft.answers && Object.keys(draft.answers).length > 0;
          const shouldRestore = hasProgress || draftIdx > 0;
          if (shouldRestore) {
            setIdx(Math.min(draftIdx, exercises.length - 1));
            if (draft.answers) setAnswers(draft.answers);
            if (draft.checked) setChecked(draft.checked);
            if (draft.firstTryCorrect) setFirstTryCorrect(draft.firstTryCorrect);
            setDraftRestored(true);
          }
        }
      } catch {}
      draftLoadedRef.current = true;
    })();
    return () => {
      alive = false;
    };
  }, [lesson?._id, exercises.length, storeUserId]);

  const total = exercises.length;
  const current = exercises[idx];

  // ----- Draft: persist on every change (debounced) -----
  const saveDraft = useRef(async (next) => {
    if (!progressDb.isSupported() || !lesson?._id || done) return;
    if (!draftLoadedRef.current) return;
    const hasAnyAnswer = next.answers && Object.keys(next.answers).length > 0;
    const isAtStartWithNoProgress = next.idx === 0 && !hasAnyAnswer && Object.keys(next.checked).length === 0;
    if (isAtStartWithNoProgress) return;
    try {
      const uid = userIdRef.current ?? storeUserId ?? "anon";
      await progressDb.putLessonDraft({
        lessonId: String(lesson._id),
        userId: uid,
        idx: next.idx,
        answers: next.answers,
        checked: next.checked,
        firstTryCorrect: next.firstTryCorrect,
        total,
        lessonTitle: lesson.title,
      });
      window.dispatchEvent(new Event("codingo:draft-update"));
    } catch {}
  }).current;

  useEffect(() => {
    if (!draftLoadedRef.current) return;
    if (done) return;
    if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current);
    pendingSaveRef.current = setTimeout(() => {
      saveDraft({ idx, answers, checked, firstTryCorrect });
    }, 300);
    return () => {
      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current);
    };
  }, [idx, answers, checked, firstTryCorrect, done, total, lesson._id, lesson.title, saveDraft]);

  useEffect(() => {
    if (!progressDb.isSupported()) return;
    const handleBeforeUnload = () => {
      const uid = userIdRef.current ?? storeUserId ?? "anon";
      if (!done && draftLoadedRef.current) {
        try {
          progressDb.putLessonDraft({
            lessonId: String(lesson._id),
            userId: uid,
            idx,
            answers,
            checked,
            firstTryCorrect,
            total,
            lessonTitle: lesson.title,
          });
        } catch {}
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && !done) {
        const uid = userIdRef.current ?? storeUserId ?? "anon";
        progressDb.putLessonDraft({
          lessonId: String(lesson._id),
          userId: uid,
          idx,
          answers,
          checked,
          firstTryCorrect,
          total,
          lessonTitle: lesson.title,
        }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, [idx, answers, checked, firstTryCorrect, done, total, lesson._id, lesson.title, storeUserId]);

  // Intercept browser Back button to show confirm modal instead of instant leave
  useEffect(() => {
    if (done) return;
    const pushDummy = () => {
      try {
        history.pushState({ codingoLessonGuard: true }, "", window.location.href);
      } catch {}
    };
    let pushed = false;
    const onPopState = (e) => {
      if (showExitModal) return;
      if (!done) {
        e.preventDefault?.();
        setShowExitModal(true);
        setTimeout(() => {
          try {
            history.pushState({ codingoLessonGuard: true }, "", window.location.href);
          } catch {}
        }, 0);
      }
    };
    const t = setTimeout(() => {
      if (!done) {
        pushDummy();
        pushed = true;
      }
    }, 500);
    window.addEventListener("popstate", onPopState);
    return () => {
      clearTimeout(t);
      window.removeEventListener("popstate", onPopState);
      if (pushed) {
        try {
          if (!showExitModal) history.back();
        } catch {}
      }
    };
  }, [done, showExitModal]);

  const score = useMemo(() => {
    let c = 0;
    for (const ex of exercises) {
      if (ex.type === "multiple_choice") { if (checked[ex._id] === true) c++; }
      else if (ex.type === "fill_blank") { if (checked[ex._id] === true) c++; }
      else if (ex.type === "arrange") { if (checked[ex._id] === true) c++; }
      else if (ex.type === "predict_output") { if (checked[ex._id] === true) c++; }
      else if (ex.type === "fix_bug" || ex.type === "write_code") { if (firstTryCorrect[ex._id] === true) c++; }
      else if (ex.type === "ai_prompt") { if (checked[ex._id] === true) c++; }
    }
    return total ? Math.round((c / total) * 100) : 0;
  }, [checked, firstTryCorrect, exercises, total]);

  const isLast = idx === total - 1;
  const hasChecked = checked[current?._id] !== undefined;

  function starterFor(ex) {
    if (!ex) return "";
    if (ex.type === "fix_bug") return ex.content?.code ?? "";
    if (ex.type === "write_code") return ex.content?.starterCode ?? "";
    return "";
  }
  const isCodeType = current?.type === "fix_bug" || current?.type === "write_code";
  const codeEdited =
    !isCodeType ||
    (answers[current._id] !== undefined && answers[current._id] !== starterFor(current));
  const needsAnswer =
    current?.type === "ai_prompt"
      ? !aiPromptReady(answers[current?._id], current)
      : answers[current?._id] === undefined ||
        answers[current?._id] === "" ||
        (Array.isArray(answers[current?._id]) && answers[current._id].length === 0);

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
    else if (current.type === "ai_prompt") {
      const v = answers[current._id];
      const want = current.solution?.checklist ?? [];
      const got = Array.isArray(v?.checks) ? v.checks : [];
      correct = aiPromptReady(v, current) && JSON.stringify(got) === JSON.stringify(want);
    }
    else if (current.type === "fix_bug" || current.type === "write_code") {
      const code = answers[current._id] ?? current.content?.starterCode ?? current.content?.code ?? "";
      const expected = current.content?.tests?.[0]?.expected ?? null;
      const res = await runCode({ code, language: "javascript", timeout: 2000 });
      if (expected !== null) {
        correct = !res.error && !res.timedOut && compareOutput(res.output, expected);
      } else {
        correct = !res.error && !res.timedOut;
      }
    }

    setChecked((s) => ({ ...s, [current._id]: correct }));
    if (!(current._id in firstTryCorrect)) {
      setFirstTryCorrect((s) => ({ ...s, [current._id]: correct }));
    }
    try {
      if (correct) playCorrect();
      else playWrong();
    } catch {}
    setChecking(false);
  }

  const [xpResult, setXpResult] = useState(null);
  const [offlineSaved, setOfflineSaved] = useState(false);

  async function handleNext() {
    if (!hasChecked) return;
    if (isLast) {
      setSaving(true);
      const allCorrectFirstTry = exercises.every((ex) => firstTryCorrect[ex._id] === true);
      let correctCount = 0;
      for (const ex of exercises) if (checked[ex._id] === true) correctCount++;
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
        setOfflineSaved(false);
        setCelebrate(true);
        setDone(true);
        try {
          const uid = userIdRef.current ?? storeUserId ?? "anon";
          await progressDb.removeLessonDraft(String(lesson._id), uid).catch(() => {});
          await progressDb.removeLessonDraft(String(lesson._id), "anon").catch(() => {});
          window.dispatchEvent(new Event("codingo:draft-update"));
        } catch {}
        try {
          playComplete();
        } catch {}
      } catch (e) {
        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        const msg = e?.message ?? "";
        const looksOffline = isOffline || /offline|Failed to fetch|NetworkError|Load failed/i.test(msg);
        setOfflineSaved(looksOffline);
        setXpResult(null);
        setCelebrate(true);
        setDone(true);
        try {
          const uid = userIdRef.current ?? storeUserId ?? "anon";
          await progressDb.removeLessonDraft(String(lesson._id), uid).catch(() => {});
          window.dispatchEvent(new Event("codingo:draft-update"));
        } catch {}
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

  const handleExitRequest = () => {
    if (done) {
      router.push("/app/learn");
      return;
    }
    const hasAnyProgress = idx > 0 || Object.keys(answers).length > 0;
    if (!hasAnyProgress) {
      router.push("/app/learn");
      return;
    }
    setShowExitModal(true);
  };

  const handleStay = () => setShowExitModal(false);

  const handleLeaveConfirm = async () => {
    setShowExitModal(false);
    try {
      const uid = userIdRef.current ?? storeUserId ?? "anon";
      await progressDb.putLessonDraft({
        lessonId: String(lesson._id),
        userId: uid,
        idx,
        answers,
        checked,
        firstTryCorrect,
        total,
        lessonTitle: lesson.title,
      });
      window.dispatchEvent(new Event("codingo:draft-update"));
    } catch {}
    router.push("/app/learn");
  };

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
        {offlineSaved ? (
          <div className="w-full max-w-[480px] rounded-[12px] border-2 border-[#ffd8a8] bg-[#fff4e6] px-4 py-3">
            <p className="font-codingo-sans text-[13px] font-bold leading-[1.4] text-[#e8590c]">Saved offline — will sync when you’re back online.</p>
            <p className="mt-1 font-codingo-sans text-[12px] font-medium leading-[1.4] text-charcoal">Your progress is in IndexedDB and your path is already unlocked locally.</p>
          </div>
        ) : null}

        <div className="grid w-full max-w-[480px] grid-cols-2 gap-3 sm:grid-cols-3">
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
          {nextLesson ? (
            <Button variant="primary" className="min-w-0 flex-1 truncate" href={`/app/learn/${nextLesson.id}`} title={`Next: ${nextLesson.title}`}>
              Next: {nextLesson.title}
            </Button>
          ) : (
            <Button variant="primary" className="flex-1" onClick={() => router.push("/app/learn")}>
              Back to path
            </Button>
          )}
          <Button variant="outline" className="flex-1 bg-paper-white" onClick={() => router.push("/app/learn")}>
            {nextLesson ? "Path" : "Back to path"}
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
      <ExitConfirmModal open={showExitModal} onStay={handleStay} onLeave={handleLeaveConfirm} current={idx + 1} total={total} />

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1">
          <LessonProgressBar current={idx + 1} total={total} />
        </div>
        {draftRestored ? (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-storybook-green px-2.5 py-1 font-codingo-sans text-[11px] font-black leading-none text-charcoal">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            Resumed
          </span>
        ) : null}
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

      {draftRestored ? (
        <div className="rounded-[12px] border-2 border-spark-blue bg-[#e6f4ff] px-4 py-2.5">
          <p className="flex items-center gap-2 font-codingo-sans text-[13px] font-bold text-spark-blue">
            <Clock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Resumed from exercise {idx + 1} — your answers were restored.
            <button type="button" onClick={async () => {
              setIdx(0);
              setAnswers({});
              setChecked({});
              setFirstTryCorrect({});
              setDraftRestored(false);
              try {
                const uid = userIdRef.current ?? storeUserId ?? "anon";
                await progressDb.removeLessonDraft(String(lesson._id), uid);
                window.dispatchEvent(new Event("codingo:draft-update"));
              } catch {}
            }} className="ml-auto font-codingo-sans text-[12px] font-black text-spark-blue underline hover:no-underline">Restart</button>
          </p>
        </div>
      ) : null}

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
        {current.type === "ai_prompt" ? (
          <AiPrompt
            exercise={current}
            value={answers[current._id]}
            onChange={handleValue}
            showResult={hasChecked}
            lessonId={lesson?._id ? String(lesson._id) : null}
          />
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
          onClick={handleExitRequest}
          disabled={saving || checking}
        >
          Exit
        </Button>
        <div className="flex-1" />
        {!hasChecked ? (
          <div className="flex flex-col items-end gap-1.5">
            {isCodeType && !codeEdited ? (
              <p className="font-codingo-sans text-[12px] font-bold text-pencil-gray">
                Edit the code above to enable Check
              </p>
            ) : null}
            <Button
              variant="primary"
              onClick={handleCheck}
              disabled={checking || (!isCodeType && needsAnswer) || (isCodeType && !codeEdited)}
              title={isCodeType && !codeEdited ? "Edit the code first" : undefined}
            >
              {checking ? "Checking…" : "Check"}
            </Button>
          </div>
        ) : (
          <Button variant="primary" onClick={handleNext} disabled={saving}>
            {saving ? "Saving…" : isLast ? "Complete" : "Next"}
          </Button>
        )}
      </div>
    </div>
  );
}
