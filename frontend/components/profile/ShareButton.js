/* Copy-link share button for public profiles. No emoji — lucide only. */
"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2 font-codingo-sans text-[13px] font-bold leading-none text-charcoal transition-colors hover:border-charcoal"
    >
      {copied ? (
        <Check className="h-4 w-4 text-eager-green" strokeWidth={2.6} aria-hidden="true" />
      ) : (
        <Link2 className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
      )}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
