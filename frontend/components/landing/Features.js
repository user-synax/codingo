/* Features section — three pillars of Codingo: bite-sized lessons,
   in-browser code execution, and gamification. Server component.
   Two-column text-left / illustration-right from md, stacked mobile.
   Section headline uses feather 48px Eager Green per design.md. */

export function Features() {
  const features = [
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" role="img" aria-hidden="true">
          <rect x="4" y="8" width="40" height="32" rx="8" fill="#d7ffb8" stroke="#58cc02" strokeWidth="2" />
          <path d="M18 20l-6 4 6 4" stroke="#58cc02" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 20l6 4-6 4" stroke="#58cc02" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="24" y1="16" x2="24" y2="32" stroke="#58cc02" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
      title: "Bite-sized lessons",
      description:
        "Complete a lesson in 2 to 5 minutes. Short, focused exercises that fit into your day — on the bus, between classes, or before bed.",
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" role="img" aria-hidden="true">
          <rect x="6" y="6" width="36" height="36" rx="8" fill="#bbe7fc" stroke="#1cb0f6" strokeWidth="2" />
          <path d="M16 18h4v4h-4zM28 18h4v4h-4zM22 28h4v4h-4z" fill="#1cb0f6" />
          <rect x="16" y="26" width="16" height="2" rx="1" fill="#1cb0f6" />
        </svg>
      ),
      title: "Real code, in your browser",
      description:
        "Write and run Python and JavaScript code right in the app. No installs, no setup — just hit run and see your code work instantly.",
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" role="img" aria-hidden="true">
          <circle cx="24" cy="24" r="18" fill="#d7ffb8" stroke="#58cc02" strokeWidth="2" />
          <path d="M24 14v10l7 5" stroke="#58cc02" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="24" r="3" fill="#58cc02" />
        </svg>
      ),
      title: "Earn XP & keep streaks",
      description:
        "Track your progress with XP, streaks, and levels. Build a daily habit and watch your skills grow day by day.",
    },
  ];

  return (
    <section id="learn" className="bg-paper-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6 md:py-28">
        <h2 className="font-feather text-[32px] leading-[1.2] font-black tracking-[-0.02em] text-eager-green sm:text-[40px] md:text-[48px]">
          free. fun. effective.
        </h2>
        <p className="mt-3 max-w-[520px] font-codingo-sans text-body leading-body font-medium text-pencil-gray">
          Everything you need to learn programming — without the price tag or the boredom.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:gap-10 md:mt-16 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-4">
              <div>{feature.icon}</div>
              <h3 className="font-codingo-sans text-[19px] leading-[1.4] font-bold text-charcoal">
                {feature.title}
              </h3>
              <p className="font-codingo-sans text-body leading-body font-medium text-pencil-gray">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
