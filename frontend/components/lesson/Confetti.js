"use client";

/* Confetti burst — flat sticker palette from design.md + HeroIllustration.
   28 pieces, CSS-only, respects prefers-reduced-motion (hidden).
   No external deps, no canvas. */

const COLORS = ["#58cc02", "#1cb0f6", "#ff9600", "#ce82ff", "#ff86d0", "#ffe500"];

export function Confetti({ show }) {
  if (!show) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden max-md:bottom-[64px]"
      style={{ contain: "layout" }}
    >
      {Array.from({ length: 28 }).map((_, i) => {
        const left = (i * 37) % 100; // pseudo-random spread
        const delay = (i % 7) * 0.06;
        const duration = 0.9 + (i % 5) * 0.18;
        const color = COLORS[i % COLORS.length];
        const rotate = (i * 47) % 360;
        const w = 8 + (i % 3) * 4;
        const h = 10 + (i % 4) * 3;
        return (
          <span
            key={i}
            className="confetti-piece absolute top-[-12px] rounded-[3px] will-change-transform"
            style={{
              left: `${left}%`,
              width: `${w}px`,
              height: `${h}px`,
              background: color,
              border: "2px solid #000437",
              transform: `rotate(${rotate}deg)`,
              animation: `confetti-fall ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-12px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-piece { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}
