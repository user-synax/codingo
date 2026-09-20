/* Community section — doubt threads, AI first responder, shared
   solutions. Server component. Two-column layout alternating
   direction from LearningPath. */

import { Button } from "@/components/ui/button";

function CommunityIllustration() {
  return (
    <svg
      viewBox="0 0 480 400"
      role="img"
      aria-label="Illustration of a community chat with AI helper"
      className="h-auto w-full max-w-[440px]"
    >
      {/* chat bubble 1 — user */}
      <rect x="60" y="60" width="240" height="60" rx="16" fill="#d7ffb8" stroke="#58cc02" strokeWidth="2" />
      <circle cx="100" cy="90" r="16" fill="#ff9600" />
      <text x="130" y="95" fontFamily="sans-serif" fontSize="13" fontWeight="500" fill="#4b4b4b">How does a loop work?</text>

      {/* chat bubble 2 — AI */}
      <rect x="140" y="140" width="280" height="70" rx="16" fill="#bbe7fc" stroke="#1cb0f6" strokeWidth="2" />
      <circle cx="180" cy="175" r="16" fill="#1cb0f6" />
      <text x="180" y="180" fontFamily="sans-serif" fontSize="10" textAnchor="middle" fill="#ffffff" fontWeight="700">AI</text>
      <text x="210" y="170" fontFamily="sans-serif" fontSize="13" fontWeight="500" fill="#4b4b4b">A loop repeats code until a</text>
      <text x="210" y="190" fontFamily="sans-serif" fontSize="13" fontWeight="500" fill="#4b4b4b">condition is met. Try it below!</text>

      {/* chat bubble 3 — user reply */}
      <rect x="60" y="230" width="200" height="50" rx="16" fill="#d7ffb8" stroke="#58cc02" strokeWidth="2" />
      <circle cx="100" cy="255" r="16" fill="#ce82ff" />
      <text x="130" y="260" fontFamily="sans-serif" fontSize="13" fontWeight="500" fill="#4b4b4b">Got it, thanks!</text>

      {/* decorative */}
      <circle cx="420" cy="50" r="16" fill="#ff9600" />
      <rect x="380" y="320" width="40" height="40" rx="8" fill="#ff86d0" />
      <path d="M80 320l16-28 16 28z" fill="#ce82ff" />
    </svg>
  );
}

export function Community() {
  return (
    <section id="community" className="bg-paper-white">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28 lg:gap-[64px]">
        {/* Illustration */}
        <div className="flex justify-center md:justify-end">
          <CommunityIllustration />
        </div>

        {/* Text */}
        <div className="flex max-w-[480px] flex-col items-start gap-6">
          <h2 className="font-feather text-[32px] leading-[1.2] font-black tracking-[-0.02em] text-eager-green sm:text-[40px] md:text-[48px]">
            never get stuck
          </h2>
          <p className="font-codingo-sans text-body leading-body font-medium text-pencil-gray">
            Every lesson has a community thread where you can ask doubts and get help.
            An AI assistant answers first, and peers jump in too.
            Supports English and Hinglish.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" href="/signup">
              Join the community
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
