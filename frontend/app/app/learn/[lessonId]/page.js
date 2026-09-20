import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { LessonRunner } from "@/components/lesson/LessonRunner";
import { Check, Eye, Lock, MessageCircle } from "lucide-react";

async function getLesson(lessonId) {
  const cookieStore = await cookies();
  const res = await fetch(`${API_BASE}/api/lessons/${lessonId}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load lesson");
  const data = await res.json();
  return data;
}

async function getProgress(lessonId) {
  const cookieStore = await cookies();
  const res = await fetch(`${API_BASE}/api/progress/${lessonId}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.progress ?? null;
}

function ViewOnlyExercise({ exercise, index }) {
  const typeLabel = {
    multiple_choice: "Multiple choice",
    fill_blank: "Fill in the blank",
    arrange: "Arrange",
    predict_output: "Predict output",
    fix_bug: "Fix the bug",
    write_code: "Write code",
  }[exercise.type] ?? exercise.type;

  return (
    <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-faded-gray/20 px-2.5 py-1 font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">
          {index + 1}. {typeLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-storybook-green px-2 py-1 font-codingo-sans text-[11px] font-bold leading-none text-charcoal">
          <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
          View only
        </span>
      </div>
      <h3 className="mt-3 font-codingo-sans text-[15px] font-bold leading-[1.4] text-charcoal">{exercise.prompt}</h3>

      {/* Content preview — show code/options in muted style */}
      {exercise.content?.code ? (
        <pre className="mt-3 overflow-x-auto rounded-[10px] border-2 border-faded-gray bg-faded-gray/10 p-3 font-mono text-[13px] leading-[1.5] text-charcoal">
          <code>{exercise.content.code}</code>
        </pre>
      ) : null}
      {exercise.content?.snippet ? (
        <pre className="mt-3 overflow-x-auto rounded-[10px] border-2 border-faded-gray bg-faded-gray/10 p-3 font-mono text-[13px] leading-[1.5] text-charcoal">
          <code>{exercise.content.snippet}</code>
        </pre>
      ) : null}
      {exercise.content?.blocks ? (
        <div className="mt-3 flex flex-col gap-1.5">
          {exercise.content.blocks.map((b, i) => (
            <div key={i} className="rounded-[10px] border-2 border-faded-gray bg-paper-white px-3 py-2 font-mono text-[12px] text-charcoal">
              {b}
            </div>
          ))}
        </div>
      ) : null}
      {exercise.content?.options ? (
        <div className="mt-3 flex flex-col gap-1.5">
          {exercise.content.options.map((o, i) => {
            const isCorrect =
              (exercise.type === "multiple_choice" && i === exercise.solution?.correctIndex) ||
              (exercise.type === "predict_output" && String(o) === String(exercise.solution?.answer)) ||
              (exercise.type === "fill_blank" && String(o) === String(exercise.solution?.answer));
            return (
              <div
                key={i}
                className={
                  isCorrect
                    ? "rounded-[10px] border-2 border-eager-green bg-storybook-green px-3 py-2 font-mono text-[13px] font-bold text-charcoal"
                    : "rounded-[10px] border-2 border-faded-gray bg-paper-white px-3 py-2 font-mono text-[13px] text-charcoal opacity-70"
                }
              >
                {o} {isCorrect ? " — correct" : ""}
              </div>
            );
          })}
        </div>
      ) : null}
      {exercise.content?.starterCode ? (
        <pre className="mt-3 overflow-x-auto rounded-[10px] border-2 border-faded-gray bg-paper-white p-3 font-mono text-[12px] leading-[1.5] text-charcoal">
          <code>{exercise.content.starterCode}</code>
        </pre>
      ) : null}

      <div className="mt-3 rounded-[10px] border-2 border-eager-green bg-storybook-green px-3 py-2">
        <p className="font-codingo-sans text-[13px] font-bold text-charcoal">
          Answer:{" "}
          <span className="font-mono font-medium">
            {exercise.type === "multiple_choice"
              ? exercise.content?.options?.[exercise.solution?.correctIndex]
              : exercise.type === "fill_blank"
                ? String(exercise.solution?.answer)
                : exercise.type === "arrange"
                  ? `Order ${JSON.stringify(exercise.solution?.order)}`
                  : exercise.type === "predict_output"
                    ? String(exercise.solution?.answer)
                    : exercise.type === "fix_bug"
                      ? exercise.solution?.fixed?.slice(0, 80) + "…"
                      : exercise.solution?.code?.slice(0, 80) + "…"}
          </span>
        </p>
        <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.4] text-charcoal">{exercise.explanation}</p>
      </div>
    </div>
  );
}

export default async function LessonPage({ params }) {
  const { lessonId } = await params;
  const [data, progress] = await Promise.all([getLesson(lessonId), getProgress(lessonId)]);
  if (!data) notFound();

  const { lesson, exercises } = data;
  const isCompleted = progress?.status === "completed";

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/app/learn"
          className="inline-flex items-center gap-1 rounded-[12px] border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[13px] font-bold text-charcoal hover:border-charcoal"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Path
        </Link>
        <span className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.04em] text-pencil-gray">
          {lesson.title} · {exercises.length} exercises
        </span>
        <Link
          href={`/app/community?lessonId=${String(lesson._id)}`}
          className="inline-flex items-center gap-1.5 rounded-[12px] border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[13px] font-bold text-spark-blue transition-colors hover:border-spark-blue"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          Discuss
        </Link>
        {isCompleted ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-storybook-green px-3 py-1 font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-charcoal">
            <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            View only
          </span>
        ) : null}
      </div>

      {isCompleted ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-[12px] border-2 border-eager-green bg-storybook-green p-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-eager-green text-paper-white">
              <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h1 className="mt-3 font-codingo-sans text-[20px] font-bold leading-[1.2] text-charcoal">You’ve completed this lesson</h1>
            <p className="mt-1 font-codingo-sans text-[14px] font-medium leading-[1.4] text-charcoal">
              Score {progress?.score ?? 100}% · {progress?.bestScore ?? progress?.score ?? 100}% best · {lesson.xpReward ?? 10} XP earned
            </p>
            <p className="mx-auto mt-2 max-w-[520px] font-codingo-sans text-[13px] font-medium leading-[1.4] text-charcoal">
              This lesson is now view-only — you can’t redo it, but you can review the exercises and correct answers below.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/app/learn"
                className="inline-flex items-center justify-center rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-2.5 font-codingo-sans text-[14px] font-bold text-paper-white shadow-[0_4px_0_var(--color-deep-leaf)]"
              >
                Back to path
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {exercises.map((ex, i) => (
              <ViewOnlyExercise key={String(ex._id)} exercise={ex} index={i} />
            ))}
          </div>

          <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-4 text-center">
            <p className="inline-flex items-center gap-1.5 font-codingo-sans text-[13px] font-bold text-pencil-gray">
              <Lock className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              View-only — progress already saved
            </p>
          </div>
        </div>
      ) : (
        <LessonRunner lesson={lesson} exercises={exercises} />
      )}
    </div>
  );
}
