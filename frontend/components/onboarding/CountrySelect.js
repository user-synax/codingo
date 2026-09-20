"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { COUNTRIES } from "@/lib/countries";
import { Label } from "@/components/ui/label";

/* Searchable country dropdown — design.md: 12px radius, 2px border, Paper White.
   Flat, no shadows except button edge. Keyboard accessible. */
export function CountrySelect({ value, onChange, errorId, invalid }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  const selected = useMemo(() => COUNTRIES.find((c) => c.name === value) ?? null, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES.slice(0, 80); // show first 80 by default for perf
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 80);
  }, [query]);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1.5">
      <Label htmlFor="onboarding-country">Country</Label>
      <button
        id="onboarding-country"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={errorId}
        data-invalid={invalid ? "true" : undefined}
        onClick={() => setOpen((v) => !v)}
        className={
          invalid
            ? "flex h-[44px] w-full items-center justify-between rounded-[12px] border-2 border-destructive bg-paper-white px-4 text-left font-codingo-sans text-[15px] font-medium leading-[1.4] text-charcoal outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]"
            : "flex h-[44px] w-full items-center justify-between rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 text-left font-codingo-sans text-[15px] font-medium leading-[1.4] text-charcoal outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] focus:border-spark-blue"
        }
      >
        <span className={selected ? "text-charcoal" : "text-pencil-gray/60"}>{selected ? `${selected.name} (${selected.code})` : "Select country"}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-pencil-gray">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[68px] z-20 max-h-[260px] overflow-hidden rounded-[12px] border-2 border-faded-gray bg-paper-white shadow-none">
          <div className="border-b-2 border-faded-gray p-2">
            <input
              autoFocus
              type="text"
              placeholder="Search country…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-[36px] w-full rounded-[10px] border-2 border-faded-gray bg-paper-white px-3 font-codingo-sans text-[14px] font-medium text-charcoal placeholder:text-pencil-gray/60 outline-none focus:border-spark-blue"
            />
          </div>
          <ul role="listbox" className="max-h-[180px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 font-codingo-sans text-[14px] text-pencil-gray">No results</li>
            ) : (
              filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === c.name}
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={
                      value === c.name
                        ? "flex w-full items-center justify-between rounded-[10px] bg-storybook-green px-3 py-2 text-left font-codingo-sans text-[14px] font-bold text-charcoal"
                        : "flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left font-codingo-sans text-[14px] font-medium text-charcoal hover:bg-faded-gray/20"
                    }
                  >
                    <span>{c.name}</span>
                    <span className="font-codingo-sans text-[12px] font-bold text-pencil-gray">{c.code}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
