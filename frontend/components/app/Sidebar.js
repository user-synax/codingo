"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";
import { getXpProgress } from "@/lib/level";
import { SidebarStats } from "@/components/app/UserStats";
import { UserAvatar } from "@/components/app/UserAvatar";
import { useProgressStore } from "@/stores/progressStore";

const NAV = [
  {
    label: "Dashboard",
    href: "/app",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} />
      </svg>
    ),
  },
  {
    label: "Learn",
    href: "/app/learn",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: "Community",
    href: "/app/community",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" fill={active ? "currentColor" : "none"} />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Shop",
    href: "/app/shop",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: "Leaderboard",
    href: "/app/leaderboard",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v9a6 6 0 0 0 12 0V2Z" fill={active ? "currentColor" : "none"} />
      </svg>
    ),
  },
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

export function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(null);

  useEffect(() => {
    for (const item of NAV) {
      try {
        router.prefetch(item.href);
      } catch {}
    }
  }, [router]);

  useEffect(() => {
    if (pending && isActive(pathname, pending)) setPending(null);
    if (pending && pathname !== pending && !isActive(pathname, pending)) {
      const t = setTimeout(() => setPending(null), 300);
      return () => clearTimeout(t);
    }
  }, [pathname, pending]);

  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      // Clear IndexedDB-backed progress cache for privacy on shared devices
      try {
        useProgressStore.getState().reset();
        // Keep the persistent IDB for offline reload? Wipe in-memory only.
        // Uncomment to hard-wipe cached progress on logout:
        // const { clearProgress, clearPending } = await import("@/lib/progressDb");
        // await clearProgress(user?._id ?? user?.id);
      } catch {}
      router.push("/login");
      router.refresh();
    }
  }

  const xpInfo = getXpProgress(user?.xp ?? 0);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r-2 border-faded-gray bg-paper-white md:flex">
      <div className="flex h-[64px] shrink-0 items-center border-b-2 border-faded-gray px-6">
        <BrandLogo href="/app" size={36} wordmarkSize="text-[22px]" />
      </div>
      <div className="border-b-2 border-faded-gray px-4 py-4">
        <SidebarStats streakCount={user?.streak?.count ?? 0} xp={user?.xp ?? 0} level={xpInfo.level} xpInfo={xpInfo} />
      </div>

      <nav aria-label="App" className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="flex flex-col gap-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href) || pending === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  onClick={() => setPending(item.href)}
                  className={
                    active
                      ? "flex items-center gap-3 rounded-[12px] border-2 border-eager-green bg-eager-green px-4 py-3 font-codingo-sans text-[15px] font-bold leading-[1.4] text-paper-white shadow-[0_4px_0_var(--color-deep-leaf)] transition-all duration-[var(--duration-micro)] ease-[var(--ease-smooth-out)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--color-deep-leaf)]"
                      : "flex items-center gap-3 rounded-[12px] border-2 border-transparent px-4 py-3 font-codingo-sans text-[15px] font-bold leading-[1.4] text-pencil-gray transition-colors duration-[var(--duration-micro)] ease-[var(--ease-smooth-out)] hover:border-faded-gray hover:bg-paper-white hover:text-charcoal active:scale-[0.98]"
                  }
                >
                  {item.icon(active)}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t-2 border-faded-gray p-4">
        <div className="flex items-center gap-3 rounded-[12px] border-2 border-faded-gray bg-paper-white px-3 py-3">
          <UserAvatar src={user?.avatar} name={user?.name} username={user?.username} boxClass="h-10 w-10 rounded-[12px] text-[14px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-codingo-sans text-[14px] font-bold leading-[1.2] text-charcoal">{user?.username ?? "Learner"}</p>
            <p className="truncate font-codingo-sans text-[13px] font-medium leading-[1.2] text-pencil-gray">{user?.email ?? ""}</p>
          </div>
          <div className="hidden items-center gap-1 rounded-full bg-storybook-green px-2.5 py-1 font-codingo-sans text-[12px] font-bold leading-none text-charcoal sm:flex">
            <span className="h-2 w-2 rounded-full bg-eager-green" aria-hidden="true" />
            Lv {user?.level ?? 1}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="codingo-btn-outline mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2.5 font-codingo-sans text-[14px] font-bold leading-[1.4] text-charcoal transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-charcoal hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}
