"use client";

import Link from "next/link";
import { useState } from "react";
import { RotateCw, WifiOff } from "lucide-react";

/* Offline fallback screen — cached by the service worker on install and
   shown when a navigation has no network. No emoji — lucide icons only. */

export function OfflineView() {
  const [checking, setChecking] = useState(false);

  function retry() {
    if (checking) return;
    setChecking(true);
    window.location.reload();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-white px-4 py-12 font-codingo-sans text-charcoal">
      <div className="w-full max-w-[440px] rounded-[20px] border-2 border-faded-gray bg-paper-white p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border-2 border-charcoal bg-storybook-green text-charcoal shadow-[0_4px_0_var(--color-charcoal)]">
          <WifiOff className="h-8 w-8" strokeWidth={2.2} aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-feather text-[28px] font-black leading-[1.1] tracking-[-0.01em]">
          You are offline
        </h1>
        <p className="mt-2 font-codingo-sans text-[15px] font-medium leading-[1.5] text-pencil-gray">
          No connection right now. Your progress is saved on your device — reconnect and keep the streak going.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={retry}
            disabled={checking}
            className="codingo-btn codingo-btn-primary inline-flex items-center justify-center gap-2 rounded-[12px] border-2 border-eager-green bg-eager-green px-6 py-3 font-codingo-sans text-[14px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95 disabled:opacity-60"
          >
            <RotateCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} strokeWidth={2.4} aria-hidden="true" />
            {checking ? "Checking…" : "Try again"}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[12px] border-2 border-faded-gray bg-paper-white px-6 py-3 font-codingo-sans text-[14px] font-bold leading-none text-charcoal transition-colors hover:border-charcoal"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
