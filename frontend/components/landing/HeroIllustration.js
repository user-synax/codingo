/* TEMPORARY placeholder illustration for the hero.
   TODO: swap with the final Codingo mascot/hero artwork.
   Original flat SVG (no third-party or Duolingo assets): a rounded
   code window with sticker-style 2px outlines. Secondary-palette
   shapes (orange/purple/pink/blue) live ONLY inside this artwork,
   never in UI chrome, per design.md. */

export function HeroIllustration({ className }) {
  return (
    <svg
      viewBox="0 0 480 400"
      role="img"
      aria-label="Illustration of a code editor with playful shapes"
      className={className}
    >
      {/* floating backdrop shapes */}
      <circle cx="70" cy="70" r="34" fill="#ff9600" />
      <circle cx="414" cy="92" r="22" fill="#ce82ff" />
      <rect x="392" y="300" width="52" height="52" rx="12" fill="#ff86d0" />
      <path d="M52 300l22-38 22 38z" fill="#1cb0f6" />

      {/* code window */}
      <rect
        x="96"
        y="80"
        width="288"
        height="240"
        rx="12"
        fill="#ffffff"
        stroke="#000437"
        strokeWidth="2"
      />
      <line x1="96" y1="124" x2="384" y2="124" stroke="#000437" strokeWidth="2" />
      <circle cx="120" cy="102" r="7" fill="#58cc02" />
      <circle cx="142" cy="102" r="7" fill="#1cb0f6" />
      <circle cx="164" cy="102" r="7" fill="#afafaf" />

      {/* code lines */}
      <rect x="120" y="148" width="120" height="14" rx="7" fill="#58cc02" />
      <rect x="120" y="174" width="200" height="14" rx="7" fill="#afafaf" />
      <rect x="120" y="200" width="160" height="14" rx="7" fill="#1cb0f6" />
      <rect x="140" y="226" width="180" height="14" rx="7" fill="#777777" />
      <rect x="140" y="252" width="96" height="14" rx="7" fill="#a5ed6e" />
      <rect x="120" y="278" width="140" height="14" rx="7" fill="#d7ffb8" />

      {/* play badge */}
      <circle cx="352" cy="296" r="40" fill="#58cc02" stroke="#000437" strokeWidth="2" />
      <path d="M342 274l32 22-32 22z" fill="#ffffff" />
    </svg>
  );
}
