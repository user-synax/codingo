/* Footer — full-bleed Eager Green band per design.md.
   Beautiful, polished footer with logo, tagline, link columns,
   social links, and owner credit. Server component.
   White + #d7ffb8 text on green fill. */

import Link from "next/link";

const LINK_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Learn", href: "#learn" },
      { label: "Community", href: "#community" },
      { label: "Courses", href: "/app" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
      { label: "Forgot password", href: "/forgot-password" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

function GithubIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-forest">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
        {/* Top section — logo + tagline */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <Link
            href="/"
            aria-label="Codingo home"
            className="font-feather text-[32px] leading-none font-black tracking-[-0.02em] text-paper-white"
          >
            Codingo
          </Link>
          <p className="mt-2 max-w-[320px] font-codingo-sans text-[15px] leading-[1.4] font-medium text-paper-white/80">
            Learn programming for free — bite-sized lessons, real code, and a
            community that has your back.
          </p>
        </div>

        {/* Link columns */}
        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3 md:mt-12">
          {LINK_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="font-codingo-sans text-[13px] leading-[1.23] font-bold uppercase tracking-[0.795px] text-paper-white/60">
                {col.heading}
              </h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-codingo-sans text-[15px] leading-[1.33] font-medium text-paper-white transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:text-night-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr className="mt-12 border-paper-white/15" />

        {/* Bottom bar — logo mark, social, credit */}
        <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between">
          {/* Left — small logo + copyright */}
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-feather text-[20px] leading-none font-black tracking-[-0.02em] text-paper-white"
            >
              Learn Fast with Community
            </Link>
            <p className="font-codingo-sans text-[13px] leading-[1.23] text-paper-white/50">
              © {new Date().getFullYear()} Codingo. All rights reserved.
            </p>
          </div>

          {/* Right — social + credit */}
          <div className="flex flex-col items-center gap-3 sm:items-end">
            {/* GitHub link */}
            <a
              href="https://github.com/user-synax"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Codingo on GitHub"
              className="inline-flex items-center gap-2 rounded-[12px] border-2 border-paper-white/25 bg-paper-white/10 px-3 py-1.5 font-codingo-sans text-[13px] leading-[1.23] font-bold text-paper-white transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-paper-white/40 hover:bg-paper-white/20"
            >
              <GithubIcon className="size-4" />
              @user-synax
            </a>
            <p className="font-codingo-sans text-[13px] leading-[1.23] text-paper-white/60">
              Made with{" "}
              <span className="text-paper-white" aria-label="love">
                ♥
              </span>{" "}
              by{" "}
              <span className="font-bold text-paper-white">Ayush</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
