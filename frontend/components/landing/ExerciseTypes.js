/* Exercise Types section — showcases the seven exercise types (PRD 5.2 + AI prompt).
   Server component. Three-column grid of exercise type cards.
   Uses secondary palette only inside illustrations (design.md). */

export function ExerciseTypes() {
  const exercises = [
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" role="img" aria-hidden="true">
          <circle cx="20" cy="20" r="18" fill="#d7ffb8" stroke="#58cc02" strokeWidth="2" />
          <circle cx="14" cy="20" r="4" fill="#58cc02" />
          <circle cx="26" cy="20" r="4" fill="#58cc02" />
        </svg>
      ),
      title: "Multiple Choice",
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" role="img" aria-hidden="true">
          <rect x="4" y="8" width="32" height="24" rx="6" fill="#bbe7fc" stroke="#1cb0f6" strokeWidth="2" />
          <rect x="10" y="14" width="14" height="3" rx="1.5" fill="#1cb0f6" />
          <rect x="10" y="22" width="20" height="3" rx="1.5" fill="#1cb0f6" />
        </svg>
      ),
      title: "Fill in the Blank",
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" role="img" aria-hidden="true">
          <rect x="6" y="6" width="28" height="28" rx="6" fill="#d7ffb8" stroke="#58cc02" strokeWidth="2" />
          <path d="M14 14l6 6-6 6" stroke="#58cc02" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="22" y1="26" x2="28" y2="26" stroke="#58cc02" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
      title: "Arrange Code",
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" role="img" aria-hidden="true">
          <circle cx="20" cy="20" r="18" fill="#d7ffb8" stroke="#58cc02" strokeWidth="2" />
          <text x="20" y="26" fontFamily="sans-serif" fontSize="18" textAnchor="middle" fontWeight="700" fill="#58cc02">?</text>
        </svg>
      ),
      title: "Predict Output",
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" role="img" aria-hidden="true">
          <rect x="4" y="8" width="32" height="24" rx="6" fill="#ffe0e8" stroke="#ff86d0" strokeWidth="2" />
          <path d="M16 18l-4 2 4 2" stroke="#ff86d0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="20" y1="20" x2="28" y2="20" stroke="#ff86d0" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: "Fix the Bug",
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" role="img" aria-hidden="true">
          <rect x="4" y="8" width="32" height="24" rx="6" fill="#d7ffb8" stroke="#58cc02" strokeWidth="2" />
          <path d="M14 20l4 4 8-8" stroke="#58cc02" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Write Code",
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" role="img" aria-hidden="true">
          <rect x="4" y="8" width="32" height="24" rx="6" fill="#bbe7fc" stroke="#1cb0f6" strokeWidth="2" />
          <path d="M13 15h14M13 20h9M13 25h14" stroke="#1cb0f6" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="28" cy="26" r="5" fill="#1cb0f6" />
          <path d="M26 26l1.5 1.5L30 25" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "AI Prompt",
    },
  ];

  return (
    <section className="bg-paper-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6 md:py-28">
        <h2 className="font-feather text-[32px] leading-[1.2] font-black tracking-[-0.02em] text-eager-green sm:text-[40px] md:text-[48px]">
          practice makes progress
        </h2>
        <p className="mt-3 max-w-[520px] font-codingo-sans text-body leading-body font-medium text-pencil-gray">
          Seven types of exercises keep things fresh — from multiple choice to writing real code,
          plus AI-prompt challenges where a live AI answers you.
          Every exercise gives instant feedback so you always know where you stand.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:mt-16 md:grid-cols-3">
          {exercises.map((ex) => (
            <div
              key={ex.title}
              className="flex flex-col items-center gap-3 rounded-[12px] border-2 border-faded-gray bg-paper-white p-5 text-center sm:p-6"
            >
              {ex.icon}
              <span className="font-codingo-sans text-[15px] leading-[1.33] font-bold text-charcoal">
                {ex.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
