/* Learning Path section — visual skill path preview showing locked,
   available, and completed lesson nodes. Server component.
   Alternates layout: illustration left, text right. */

import { Button } from "@/components/ui/button";

function PathIllustration() {
  return (
    <svg
      viewBox="0 0 480 400"
      role="img"
      aria-label="Illustration of a learning path with locked and completed lessons"
      className="h-auto w-full max-w-[440px]"
    >
      {/* vertical path line */}
      <line x1="240" y1="40" x2="240" y2="360" stroke="#d7ffb8" strokeWidth="4" strokeLinecap="round" />

      {/* completed node */}
      <circle cx="240" cy="80" r="32" fill="#58cc02" stroke="#000437" strokeWidth="2" />
      <path d="M228 80l8 8 16-16" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="290" y="85" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#58cc02">Lesson 1 · Done</text>

      {/* available node */}
      <circle cx="240" cy="180" r="32" fill="#ffffff" stroke="#1cb0f6" strokeWidth="2" />
      <text x="240" y="186" fontFamily="sans-serif" fontSize="24" textAnchor="middle" fill="#1cb0f6">▶</text>
      <text x="290" y="185" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#1cb0f6">Lesson 2</text>

      {/* locked node */}
      <circle cx="240" cy="280" r="32" fill="#f4f4f4" stroke="#afafaf" strokeWidth="2" />
      <rect x="230" y="268" width="20" height="16" rx="3" fill="#afafaf" />
      <circle cx="240" cy="274" r="5" fill="#f4f4f4" />
      <text x="290" y="285" fontFamily="sans-serif" fontSize="14" fontWeight="700" fill="#afafaf">Lesson 3 · Locked</text>

      {/* decorative shapes */}
      <circle cx="80" cy="100" r="16" fill="#ff9600" />
      <circle cx="400" cy="300" r="12" fill="#ce82ff" />
      <rect x="60" y="280" width="32" height="32" rx="8" fill="#ff86d0" />
    </svg>
  );
}

export function LearningPath() {
  return (
    <section className="bg-paper-white">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28 lg:gap-[64px]">
        {/* Text — first on mobile, right on desktop */}
        <div className="flex max-w-[480px] flex-col items-start gap-6 order-2 md:order-1">
          <h2 className="font-feather text-[32px] leading-[1.2] font-black tracking-[-0.02em] text-eager-green sm:text-[40px] md:text-[48px]">
            your path, your pace
          </h2>
          <p className="font-codingo-sans text-body leading-body font-medium text-pencil-gray">
            Follow a visual skill path designed to keep you moving. Each lesson
            builds on the last — lock in your progress and never lose your place.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" href="/signup">
              Start learning
            </Button>
          </div>
        </div>

        {/* Illustration — second on mobile, left on desktop */}
        <div className="flex justify-center order-1 md:order-2 md:justify-start">
          <PathIllustration />
        </div>
      </div>
    </section>
  );
}
