"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Download, Share } from "lucide-react";

/* Install CTA card for Settings. Captures the browser's install prompt and
   fires it from our own button; shows installed state via display-mode;
   falls back to platform instructions (iOS Safari has no install prompt —
   it needs Share → Add to Home Screen). No emoji — lucide icons only. */

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window).MSStream;
}

export function InstallApp() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ios] = useState(isIos);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const sync = () => setInstalled(mq.matches || window.navigator.standalone === true);
    sync();
    mq.addEventListener?.("change", sync);

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      mq.removeEventListener?.("change", sync);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferred || busy) return;
    setBusy(true);
    try {
      deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* dismissed or failed — prompt stays available */
    } finally {
      setDeferred(null);
      setBusy(false);
    }
  }, [deferred, busy]);

  return (
    <div className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-5">
      <div className="flex items-center gap-3">
        <span
          className={
            installed
              ? "flex h-10 w-10 items-center justify-center rounded-[12px] bg-storybook-green text-eager-green"
              : "flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#e6f4ff] text-spark-blue"
          }
          aria-hidden="true"
        >
          {installed ? (
            <Check className="h-5 w-5" strokeWidth={2.6} />
          ) : (
            <Download className="h-5 w-5" strokeWidth={2.2} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-codingo-sans text-[15px] font-bold leading-[1.3] text-charcoal">Install the app</h2>
          <p className="font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">
            {installed
              ? "Installed — launch Codingo from your home screen, works offline."
              : "Add Codingo to your home screen for one-tap lessons and offline mode."}
          </p>
        </div>
      </div>

      {!installed && deferred ? (
        <button
          type="button"
          onClick={handleInstall}
          disabled={busy}
          className="codingo-btn codingo-btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-3 font-codingo-sans text-[14px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95 disabled:opacity-60 sm:w-auto"
        >
          <Download className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          {busy ? "Installing…" : "Install app"}
        </button>
      ) : null}

      {!installed && !deferred ? (
        <p className="mt-3 inline-flex items-start gap-1.5 rounded-[12px] bg-faded-gray/15 px-3 py-2 font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">
          <Share className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          {ios
            ? "On iPhone: tap Share, then “Add to Home Screen”."
            : "Open your browser menu and tap “Install app” or “Add to Home Screen”."}
        </p>
      ) : null}
    </div>
  );
}
