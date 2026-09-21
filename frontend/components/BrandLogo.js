import Image from "next/image";
import Link from "next/link";

/* BrandLogo — shared Codingo logo + wordmark lockup.
   Single source of truth so the landing Navbar, app Sidebar,
   mobile top bar, footer and mobile menu stay consistent.
   Logo art lives in `public/` (master: /apple-touch-icon.png).
   Server component; next/image optimizes the local file. */

const WORDMARK_COLORS = {
  default: "text-eager-green",
  inverted: "text-paper-white",
};

export function BrandMark({ size = 32, className = "", priority = false }) {
  return (
    <Image
      src="/apple-touch-icon.png"
      alt="Codingo logo"
      width={size}
      height={size}
      priority={priority}
      className={`rounded-[8px]${className ? ` ${className}` : ""}`}
    />
  );
}

export function BrandLogo({
  href = "/",
  size = 32,
  showWordmark = true,
  variant = "default",
  wordmarkSize = "text-[22px]",
  priority = false,
}) {
  return (
    <Link
      href={href}
      aria-label="Codingo home"
      className="inline-flex items-center gap-2"
    >
      <BrandMark size={size} priority={priority} />
      {showWordmark ? (
        <span
          className={`font-feather leading-none font-black tracking-[-0.02em] ${WORDMARK_COLORS[variant] ?? WORDMARK_COLORS.default} ${wordmarkSize}`}
        >
          Codingo
        </span>
      ) : null}
    </Link>
  );
}
