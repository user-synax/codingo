"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";
import { UserAvatar } from "@/components/app/UserAvatar";
import { getXpProgress } from "@/lib/level";
import { useProgressStore } from "@/stores/progressStore";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/* Primary tabs shown directly in the bottom bar (icon-only, no labels).
   Menu sheet holds the full list with labels. */
const PRIMARY = [
  {
    label: "Home",
    href: "/app",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} />
      </svg>
    ),
  },
  {
    label: "Learn",
    href: "/app/learn",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: "Community",
    href: "/app/community",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" fill={active ? "currentColor" : "none"} />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Board",
    href: "/app/leaderboard",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v9a6 6 0 0 0 12 0V2Z" fill={active ? "currentColor" : "none"} />
      </svg>
    ),
  },
];

const ALL = [
  ...PRIMARY,
  {
    label: "Profile",
    href: "/app/profile",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" fill={active ? "currentColor" : "none"} />
      </svg>
    ),
  },
];

function isActive(pathname, href) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

export function BottomNav({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);

  // Prefetch all tabs immediately so switching is instant
  useEffect(() => {
    for (const item of ALL) {
      try {
        router.prefetch(item.href);
      } catch {}
    }
  }, [router]);

  // Clear optimistic pending once navigation completes
  useEffect(() => {
    if (pending && isActive(pathname, pending)) setPending(null);
    // If pathname changed to something else, also clear
    if (pending && pathname !== pending && !isActive(pathname, pending)) {
      // keep pending only until next pathname settles, then timeout clear
      const t = setTimeout(() => setPending(null), 300);
      return () => clearTimeout(t);
    }
  }, [pathname, pending]);

  // Also clear pending on open change (menu nav)
  useEffect(() => {
    if (!open) return;
  }, [open]);

  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    } finally {
      try {
        useProgressStore.getState().reset();
      } catch {}
      setOpen(false);
      router.push("/login");
      router.refresh();
    }
  }

  const xpInfo = user ? getXpProgress(user.xp ?? 0) : null;

  return (
    <>
      <nav
        aria-label="App bottom"
        className="fixed inset-x-0 bottom-0 z-40 flex h-[64px] items-center justify-around border-t-2 border-faded-gray bg-paper-white px-1 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {PRIMARY.map((item) => {
          const active = isActive(pathname, item.href) || pending === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              onClick={() => setPending(item.href)}
              className={
                active
                  ? "flex h-11 w-11 items-center justify-center rounded-[14px] bg-eager-green text-paper-white shadow-[0_3px_0_var(--color-deep-leaf)] transition-all duration-[var(--duration-micro)] ease-[var(--ease-smooth-out)] active:translate-y-[1px] active:shadow-[0_1px_0_var(--color-deep-leaf)]"
                  : "flex h-11 w-11 items-center justify-center rounded-[14px] text-pencil-gray transition-colors duration-[var(--duration-micro)] ease-[var(--ease-smooth-out)] hover:bg-faded-gray/15 hover:text-charcoal active:scale-95"
              }
            >
              {item.icon(active)}
            </Link>
          );
        })}

        {/* Menu button — icon only, opens bottom sheet */}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-[14px] text-pencil-gray transition-colors duration-[var(--duration-micro)] ease-[var(--ease-smooth-out)] hover:bg-faded-gray/15 hover:text-charcoal active:scale-95"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" aria-describedby={undefined} className="max-h-[84vh] overflow-hidden p-0">
          {/* Drag handle */}
          <div className="flex justify-center pt-3">
            <span className="h-1.5 w-10 rounded-full bg-faded-gray/40" aria-hidden="true" />
          </div>

          <div className="flex max-h-[84vh] flex-col overflow-y-auto px-5 pb-8 pt-4">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>

            {/* Header — logo (close is handled by SheetContent's single X) */}
            <div className="flex items-center justify-start pr-10">
              <BrandLogo href="/app" size={28} wordmarkSize="text-[20px]" />
            </div>

            {user ? (
              <div className="mt-4 flex items-center gap-4 rounded-[16px] border-2 border-faded-gray bg-paper-white p-4">
                <UserAvatar src={user.avatar} name={user.name} username={user.username} boxClass="h-[64px] w-[64px] rounded-[18px] text-[24px] sm:h-[72px] sm:w-[72px] sm:rounded-[20px] sm:text-[26px] border-2 border-faded-gray" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-codingo-sans text-[15px] font-black leading-[1.1] text-charcoal">{user.name ?? user.username}</p>
                  <p className="truncate font-codingo-sans text-[12px] font-bold leading-[1.2] text-pencil-gray">@{user.username}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-storybook-green px-2 py-0.5 font-codingo-sans text-[11px] font-black leading-none text-charcoal">
                      {user.xp ?? 0} XP
                    </span>
                    <span className="inline-flex items-center rounded-full bg-charcoal px-2 py-0.5 font-codingo-sans text-[11px] font-black leading-none text-paper-white">
                      Lv {xpInfo?.level ?? user.level ?? 1}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#fff4e6] px-2 py-0.5 font-codingo-sans text-[11px] font-black leading-none text-[#b91c1c]">
                      {user.streak?.count ?? 0}d streak
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Full nav with labels */}
            <nav aria-label="Menu" className="mt-5">
              <ul className="flex flex-col gap-1.5">
                {ALL.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        prefetch
                        aria-current={active ? "page" : undefined}
                        onClick={() => {
                          setPending(item.href);
                          setOpen(false);
                        }}
                        className={
                          active
                            ? "flex items-center gap-3 rounded-[14px] border-2 border-eager-green bg-eager-green px-4 py-3 font-codingo-sans text-[15px] font-black leading-[1.2] text-paper-white shadow-[0_3px_0_var(--color-deep-leaf)]"
                            : "flex items-center gap-3 rounded-[14px] border-2 border-faded-gray bg-paper-white px-4 py-3 font-codingo-sans text-[15px] font-bold leading-[1.2] text-charcoal hover:border-charcoal"
                        }
                      >
                        <span
                          className={
                            active
                              ? "flex h-9 w-9 items-center justify-center rounded-[12px] bg-paper-white text-eager-green"
                              : "flex h-9 w-9 items-center justify-center rounded-[12px] bg-faded-gray/15 text-pencil-gray"
                          }
                        >
                          {item.icon(active)}
                        </span>
                        {item.label}
                        <span className="ml-auto text-pencil-gray" aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Secondary actions */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/app/settings"
                prefetch
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-[14px] border-2 border-faded-gray bg-paper-white px-4 py-3 font-codingo-sans text-[14px] font-bold leading-none text-charcoal hover:border-charcoal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a1.65 1.65 0 0 0 1-1.51 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 13 7.27a1.65 1.65 0 0 0 1-1.51V5a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.49.14 1.02 0 1.51V15Z" />
                </svg>
                Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-[14px] border-2 border-faded-gray bg-paper-white px-4 py-3 font-codingo-sans text-[14px] font-bold leading-none text-charcoal hover:border-charcoal hover:text-[#b91c1c]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log out
              </button>
            </div>

            <p className="mt-4 text-center font-codingo-sans text-[11px] font-medium leading-[1.3] text-pencil-gray">
              Tap a tab to switch instantly — prefetch is on
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
