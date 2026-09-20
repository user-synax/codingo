/* Avatar with graceful fallback — plain <img> (Appwrite URLs are remote,
   so next/image would need remotePatterns config) plus initial-letter
   fallback when missing or failed. No emoji. */
/* eslint-disable @next/next/no-img-element -- remote Appwrite URLs; next/image needs remotePatterns + provider cost */
"use client";

import { useState } from "react";

export function UserAvatar({ src, name, username, boxClass = "h-20 w-20 rounded-[16px] text-[28px]", ring = true }) {
  const [failed, setFailed] = useState(false);
  const initial = ((name?.[0] ?? username?.[0] ?? "?") || "?").toUpperCase();
  // Guard: only strings ever reach <img>. A non-string src would render as
  // "[object ...]" and resolve to a broken relative URL (once caused a
  // GET /app/[object%20Promise] 404 from a stringified promise).
  const validSrc = typeof src === "string" && /^(https?:|blob:|data:)/.test(src) ? src : null;

  if (!validSrc || failed) {
    return (
      <div
        aria-hidden={!name && !username}
        className={`flex shrink-0 items-center justify-center border-2 border-faded-gray bg-charcoal font-feather font-black leading-none text-paper-white ${boxClass}`}
      >
        {initial}
      </div>
    );
  }
  return (
    <img
      src={validSrc}
      alt={name ? `${name}'s avatar` : "User avatar"}
      onError={() => setFailed(true)}
      loading="lazy"
      className={`shrink-0 border-2 object-cover ${ring ? "border-faded-gray" : "border-transparent"} ${boxClass}`}
    />
  );
}
