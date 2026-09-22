"use client";

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", desc: "For web & apps", icon: "JS", color: "#f7df1e", available: true },
  { id: "python", label: "Python", desc: "For AI & data", icon: "Py", color: "#3776ab", available: true },
  { id: "java", label: "Java", desc: "Coming soon", icon: "Ja", color: "#007396", available: false },
  { id: "cpp", label: "C++", desc: "Coming soon", icon: "C+", color: "#00599c", available: false },
];

export function LanguageGrid({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {LANGUAGES.map((lang) => {
        const selected = value === lang.id;
        const disabled = !lang.available;
        return (
          <button
            key={lang.id}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => !disabled && onChange(lang.id)}
            className={
              disabled
                ? "relative flex flex-col items-start gap-2 rounded-[12px] border-2 border-faded-gray bg-paper-white p-4 text-left opacity-60 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
                : selected
                  ? "relative flex flex-col items-start gap-2 rounded-[12px] border-2 border-eager-green bg-storybook-green p-4 text-left shadow-[0_4px_0_var(--color-deep-leaf)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
                  : "relative flex flex-col items-start gap-2 rounded-[12px] border-2 border-faded-gray bg-paper-white p-4 text-left transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-charcoal"
            }
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-[10px] font-codingo-sans text-[13px] font-black leading-none"
              style={{ background: lang.color, color: lang.id === "javascript" ? "#000" : "#fff" }}
              aria-hidden="true"
            >
              {lang.icon}
            </span>
            <span className="font-codingo-sans text-[15px] font-bold leading-[1.2] text-charcoal">{lang.label}</span>
            <span className="font-codingo-sans text-[12px] font-medium leading-[1.2] text-pencil-gray">{lang.desc}</span>
            {disabled ? (
              <span className="absolute right-2 top-2 rounded-full bg-faded-gray px-2 py-1 font-codingo-sans text-[10px] font-bold uppercase tracking-[0.04em] text-paper-white">Soon</span>
            ) : selected ? (
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-eager-green text-paper-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
