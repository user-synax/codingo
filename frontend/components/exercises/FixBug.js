"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { runCode } from "@/lib/runner";

/* Fix the bug — Monaco editor + Run. Check is driven by parent LessonRunner
   via onChecked so the outer Next/Complete flow stays single-screen. */

export function FixBug({ exercise, value, onChange, showResult, onChecked }) {
  const initial = exercise.content?.code ?? "";
  const code = value ?? initial;
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  async function handleRun() {
    setRunning(true);
    setRunError(null);
    setOutput("");
    const res = await runCode({ code, language: "javascript", timeout: 2000 });
    if (res.timedOut) {
      setRunError(res.error);
      setOutput("");
    } else if (res.error) {
      setRunError(res.error);
      setOutput(res.output);
    } else {
      setOutput(res.output);
      setRunError(null);
    }
    setRunning(false);
  }

  // Expose a check that parent can call — but also allow inner Run to hint
  // Parent will call onChecked via its Check button; we just need to run and report.
  // Keep a hidden Check for standalone use, but parent controls showResult feedback.

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-codingo-sans text-[19px] font-bold leading-[1.4] text-charcoal">{exercise.prompt}</h2>

      <div className="overflow-hidden rounded-[12px] border-2 border-faded-gray bg-paper-white">
        <div className="flex items-center justify-between border-b-2 border-faded-gray bg-faded-gray/10 px-3 py-2">
          <p className="font-mono text-[12px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Fix it</p>
          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="rounded-[10px] border-2 border-faded-gray bg-paper-white px-3 py-1 font-codingo-sans text-[12px] font-bold text-charcoal hover:border-charcoal disabled:opacity-60"
          >
            {running ? "Running…" : "Run"}
          </button>
        </div>
        <div className="h-[180px]">
          <Editor
            height="180px"
            language="javascript"
            value={code}
            onChange={(v) => {
              if (!showResult) onChange(v ?? "");
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              scrollBeyondLastLine: false,
              roundedSelection: false,
              padding: { top: 8, bottom: 8 },
            }}
          />
        </div>
      </div>

      {(output || runError) && (
        <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-3">
          <p className="font-mono text-[12px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Output</p>
          <pre className="mt-1 max-h-[120px] overflow-auto whitespace-pre-wrap font-mono text-[13px] leading-[1.5] text-charcoal">
            {runError ? <span className="text-destructive">{runError}</span> : output || "(no output)"}
          </pre>
        </div>
      )}

      {showResult ? (
        <p className="rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-3 font-codingo-sans text-[14px] font-bold text-charcoal">
          Fixed! {exercise.explanation}
        </p>
      ) : null}
    </div>
  );
}
