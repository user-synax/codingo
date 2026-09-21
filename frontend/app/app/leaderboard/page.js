import Link from "next/link";
import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { UserAvatar } from "@/components/app/UserAvatar";
import {
  Trophy,
  Crown,
  Medal,
  Zap,
  Flame,
  ArrowLeft,
  ArrowRight,
  Lock,
  EyeOff,
  BookOpenCheck,
} from "lucide-react";

export const metadata = {
  title: "Leaderboard — Codingo",
  robots: { index: false, follow: false },
};

const LIMIT = 25;

async function getLeaderboard(page) {
  const cookieStore = await cookies();
  const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
  const res = await fetch(`${API_BASE}/api/leaderboard?${params.toString()}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, text, leaderboard: [], total: 0, me: null, meMeta: null, page, totalPages: 1, hasMore: false };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: true, ...data };
}

function RankBadge({ rank }) {
  if (rank === 1)
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ffd700] text-charcoal shadow-[0_2px_0_rgba(0,0,0,0.15)]">
        <Crown className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e8e8e8] text-charcoal shadow-[0_2px_0_rgba(0,0,0,0.12)]">
        <Medal className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ffb86b] text-charcoal shadow-[0_2px_0_rgba(0,0,0,0.12)]">
        <Trophy className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
      </span>
    );
  return (
    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-faded-gray/15 px-2 font-codingo-sans text-[13px] font-black leading-none text-pencil-gray">
      #{rank}
    </span>
  );
}

function PodiumCard({ entry, place, highlight }) {
  const isFirst = place === 1;
  const border = isFirst
    ? "border-eager-green bg-storybook-green/25"
    : "border-faded-gray bg-paper-white";
  const height = isFirst ? "sm:min-h-[210px] sm:pt-6" : "sm:min-h-[185px] sm:pt-5";
  return (
    <div
      className={`relative flex flex-col items-center rounded-[20px] border-2 p-4 text-center sm:p-5 ${border} ${height} ${highlight ? "ring-2 ring-eager-green ring-offset-2 ring-offset-paper-white" : ""}`}
    >
      {isFirst ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#ffd700] px-3 py-1 font-codingo-sans text-[11px] font-black uppercase tracking-[0.06em] leading-none text-charcoal shadow-[0_2px_0_rgba(0,0,0,0.15)]">
          Champion
        </span>
      ) : null}
      <div className="absolute -top-2 right-3 hidden sm:block" aria-hidden="true">
        <RankBadge rank={place} />
      </div>
      <div className="sm:hidden" aria-hidden="true">
        <RankBadge rank={place} />
      </div>
      <Link href={`/u/${entry.username}`} className="mt-3 flex flex-col items-center gap-2">
        <UserAvatar src={entry.avatar} name={entry.name} username={entry.username} boxClass="h-20 w-20 rounded-[20px] text-[26px] sm:h-[84px] sm:w-[84px] sm:rounded-[22px] sm:text-[32px] border-2 border-faded-gray/40" />
        <div>
          <p className="max-w-[140px] truncate font-codingo-sans text-[15px] font-black leading-[1.2] text-charcoal">{entry.name}</p>
          <p className="max-w-[140px] truncate font-codingo-sans text-[12px] font-bold leading-[1.2] text-pencil-gray">@{entry.username}</p>
          {entry.countryCode ? (
            <span className="mt-1 inline-flex items-center rounded-full bg-faded-gray/15 px-2 py-0.5 font-codingo-sans text-[10px] font-black uppercase leading-none tracking-[0.05em] text-pencil-gray">
              {entry.countryCode}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-eager-green px-2.5 py-1 font-codingo-sans text-[12px] font-black leading-none text-paper-white">
          <Zap className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
          {entry.xp} XP
        </span>
        <span className="inline-flex items-center rounded-full bg-charcoal px-2.5 py-1 font-codingo-sans text-[12px] font-black leading-none text-paper-white">Lv {entry.level}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 font-codingo-sans text-[11px] font-bold leading-none text-pencil-gray">
        <Flame className="h-4 w-4 text-[#ff9600]" strokeWidth={2.2} aria-hidden="true" />
        {entry.streak?.count ?? 0} streak
        <span className="mx-1 h-1 w-1 rounded-full bg-faded-gray" aria-hidden="true" />
        {entry.badgesCount} badges
      </div>
    </div>
  );
}

export default async function LeaderboardPage({ searchParams }) {
  const sp = searchParams ? await searchParams : {};
  const page = Math.max(1, Number.parseInt(String(sp?.page ?? "1"), 10) || 1);

  const [user, data] = await Promise.all([getCurrentUser(), getLeaderboard(page)]);

  const leaderboard = data.leaderboard ?? [];
  const total = data.total ?? 0;
  const totalPages = data.totalPages ?? 1;
  const me = data.me ?? null;
  const meMeta = data.meMeta ?? null;
  const hasMore = Boolean(data.hasMore);
  const isFirstPage = page === 1;

  // Split podium vs list on first page
  const podium = isFirstPage ? leaderboard.slice(0, 3) : [];
  const list = isFirstPage ? leaderboard.slice(3) : leaderboard;

  const meRank = me?.rank ?? 0;
  const isMeVisible = meRank > 0 && leaderboard.some((e) => String(e.id) === String(me?.id));
  const showMeStrip = me && meRank > 0 && !isMeVisible && page !== Math.ceil(meRank / LIMIT);

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      {/* Header — minimal: single subtle decoration, no overlap with chip row */}
      <header className="relative isolate w-full overflow-hidden rounded-[16px] border-2 border-faded-gray bg-paper-white md:rounded-[20px]">
        <div className="relative z-10 p-5 sm:p-6 md:p-7">
          {/* single decoration — top-right, behind content only */}
          <div className="pointer-events-none absolute -right-14 -top-14 z-0 h-44 w-44 rounded-full bg-storybook-green/50" aria-hidden="true" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[16px] border-2 border-charcoal bg-[#ffd700] text-charcoal shadow-[0_3px_0_var(--color-charcoal)] sm:h-[68px] sm:w-[68px]">
                <Trophy className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={2.3} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-charcoal px-3 py-1 font-codingo-sans text-[11px] font-black uppercase leading-none tracking-[0.06em] text-paper-white">All-time</span>
                  <span className="inline-flex items-center rounded-full bg-storybook-green px-3 py-1 font-codingo-sans text-[11px] font-black leading-none text-charcoal">{total} learners ranked</span>
                </div>
                <h1 className="mt-2 font-codingo-sans text-[26px] font-black leading-[1.1] text-charcoal sm:text-[30px]">Leaderboard</h1>
                <p className="mt-1 max-w-[520px] font-codingo-sans text-[14px] font-medium leading-[1.45] text-pencil-gray sm:text-[15px]">
                  Global ranking by total XP. Finish lessons, keep your streak, and climb.
                </p>
              </div>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-2 md:flex">
              <Link
                href="/app/learn"
                className="codingo-btn codingo-btn-primary inline-flex items-center gap-2 rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-3 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95"
              >
                <Zap className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
                Earn XP
              </Link>
              <p className="font-codingo-sans text-[12px] font-medium text-pencil-gray">25 per page · updated live</p>
            </div>
          </div>
        </div>
        {/* chip row — solid, above decorations */}
        <div className="relative z-10 flex items-center justify-between gap-3 border-t-2 border-faded-gray/30 bg-paper-white px-5 py-2.5 sm:px-6">
          <p className="font-codingo-sans text-[12px] font-bold uppercase leading-none tracking-[0.053em] text-pencil-gray">Ranked by XP · tie → earlier member wins</p>
          <p className="hidden shrink-0 font-codingo-sans text-[12px] font-medium text-pencil-gray sm:block">
            Page {page} of {totalPages}
          </p>
        </div>
      </header>

      {/* Your rank — minimal card */}
      {me && meRank > 0 ? (
        <div className="mt-4 overflow-hidden rounded-[16px] border-2 border-eager-green bg-storybook-green/30 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-eager-green text-paper-white">
                <Trophy className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.053em] leading-none text-pencil-gray">Your rank</p>
                <p className="mt-1 font-codingo-sans text-[18px] font-black leading-none text-charcoal">
                  #{meRank} <span className="font-medium text-pencil-gray">of {total}</span>
                  <span className="mx-2 inline-flex items-center rounded-full bg-eager-green px-2.5 py-1 font-codingo-sans text-[11px] font-black leading-none text-paper-white">
                    {me.xp} XP
                  </span>
                  <span className="inline-flex items-center rounded-full bg-charcoal px-2.5 py-1 font-codingo-sans text-[11px] font-black leading-none text-paper-white">Lv {me.level}</span>
                </p>
                <p className="mt-1 truncate font-codingo-sans text-[13px] font-medium text-pencil-gray">
                  @{me.username} · {me.name} {me.countryCode ? `· ${me.countryCode}` : ""}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4e6] px-3 py-2 font-codingo-sans text-[12px] font-black leading-none text-[#b91c1c]">
                <Flame className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                {me.streak?.count ?? 0} day streak
              </span>
              <Link
                href={meRank > 0 ? `/app/leaderboard?page=${Math.ceil(meRank / LIMIT)}` : "/app/leaderboard"}
                className="hidden rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2 font-codingo-sans text-[13px] font-bold leading-none text-charcoal transition-colors hover:border-charcoal sm:inline-flex"
              >
                Jump to your row
              </Link>
            </div>
          </div>
        </div>
      ) : meMeta?.notRankedReason === "private_profile" ? (
        <div className="mt-4 flex items-start gap-3 rounded-[16px] border-2 border-faded-gray bg-paper-white p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border-2 border-faded-gray bg-faded-gray/15 text-pencil-gray">
            <EyeOff className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-codingo-sans text-[14px] font-black leading-[1.2] text-charcoal">You&apos;re hidden from the leaderboard</p>
            <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">
              Your profile is private — public rankings only show completed, public learners. Make it public to appear and keep climbing.
            </p>
          </div>
          <Link
            href="/app/settings"
            className="hidden shrink-0 items-center justify-center rounded-[12px] border-2 border-charcoal bg-charcoal px-4 py-2.5 font-codingo-sans text-[13px] font-bold leading-none text-paper-white sm:inline-flex"
          >
            Make public
          </Link>
        </div>
      ) : meMeta?.notRankedReason === "complete_onboarding" ? (
        <div className="mt-4 flex items-start gap-3 rounded-[16px] border-2 border-faded-gray bg-paper-white p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border-2 border-eager-green bg-storybook-green text-eager-green">
            <BookOpenCheck className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-codingo-sans text-[14px] font-black leading-[1.2] text-charcoal">Complete onboarding to enter the ranking</p>
            <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">
              Finish the setup steps — then every XP you earn counts toward the global leaderboard.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="hidden shrink-0 items-center justify-center rounded-[12px] border-2 border-eager-green bg-eager-green px-4 py-2.5 font-codingo-sans text-[13px] font-bold leading-none text-paper-white sm:inline-flex"
          >
            Continue setup
          </Link>
        </div>
      ) : null}

      {/* Empty state */}
      {!leaderboard.length && total === 0 ? (
        <div className="mt-4 rounded-[16px] border-2 border-dashed border-faded-gray bg-paper-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-storybook-green text-eager-green">
            <Trophy className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
          </div>
          <p className="mt-3 font-codingo-sans text-[16px] font-black leading-[1.2] text-charcoal">No ranked learners yet</p>
          <p className="mx-auto mt-1 max-w-[420px] font-codingo-sans text-[14px] font-medium leading-[1.45] text-pencil-gray">
            Be the first to climb — complete a lesson to earn XP and appear here.
          </p>
          <Link
            href="/app/learn"
            className="mt-4 inline-flex items-center gap-2 rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-2.5 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95"
          >
            <Zap className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
            Start learning
          </Link>
        </div>
      ) : (
        <>
          {/* Podium — page 1 only */}
          {podium.length ? (
            <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-3 sm:items-end">
              {/* Mobile order: 1,2,3 — desktop order: 2,1,3 via order trick so 1 stays tallest in center */}
              <div className="sm:order-2">
                {podium[0] ? <PodiumCard entry={podium[0]} place={podium[0].rank} highlight={String(podium[0].id) === String(me?.id)} /> : null}
              </div>
              <div className="sm:order-1">
                {podium[1] ? <PodiumCard entry={podium[1]} place={podium[1].rank} highlight={String(podium[1].id) === String(me?.id)} /> : null}
              </div>
              <div className="sm:order-3">
                {podium[2] ? <PodiumCard entry={podium[2]} place={podium[2].rank} highlight={String(podium[2].id) === String(me?.id)} /> : null}
              </div>
            </div>
          ) : null}

          {/* Table header */}
          <div className="mt-4 overflow-hidden rounded-[16px] border-2 border-faded-gray bg-paper-white">
            <div className="flex items-center justify-between border-b-2 border-faded-gray/20 bg-faded-gray/5 px-4 py-3 sm:px-5">
              <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.053em] leading-none text-pencil-gray">
                {isFirstPage && podium.length ? `Rank 4–${Math.min(total, LIMIT)}` : `Rank ${leaderboard[0]?.rank ?? 0}–${leaderboard[leaderboard.length - 1]?.rank ?? 0}`}
                <span className="ml-2 font-medium normal-case tracking-normal text-pencil-gray">· {total} total</span>
              </p>
              <p className="hidden font-codingo-sans text-[12px] font-bold text-pencil-gray sm:block">XP → Level · Streak · Badges</p>
            </div>

            <ul className="divide-y divide-faded-gray/20" aria-label="Leaderboard">
              {list.map((entry) => {
                const isMe = String(entry.id) === String(me?.id);
                return (
                  <li
                    key={entry.id}
                    className={isMe ? "flex items-center gap-3 bg-storybook-green/30 px-4 py-3 sm:px-5" : "flex items-center gap-3 bg-paper-white px-4 py-3 sm:px-5 hover:bg-faded-gray/5"}
                  >
                    <span className="hidden w-[56px] shrink-0 items-center justify-center sm:flex">
                      <RankBadge rank={entry.rank} />
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-faded-gray/15 font-codingo-sans text-[12px] font-black leading-none text-pencil-gray sm:hidden">
                      {entry.rank}
                    </span>

                    <Link href={`/u/${entry.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <UserAvatar src={entry.avatar} name={entry.name} username={entry.username} boxClass="h-14 w-14 rounded-[14px] text-[18px] sm:h-[56px] sm:w-[56px] sm:rounded-[16px] sm:text-[19px] border-2 border-faded-gray/30" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-codingo-sans text-[14px] font-black leading-[1.2] text-charcoal sm:text-[15px]">
                          {entry.name}
                          {isMe ? <span className="ml-1.5 rounded-full bg-eager-green px-2 py-0.5 font-codingo-sans text-[10px] font-black uppercase leading-none tracking-[0.04em] text-paper-white">You</span> : null}
                        </p>
                        <p className="truncate font-codingo-sans text-[12px] font-bold leading-[1.2] text-pencil-gray sm:text-[13px]">
                          @{entry.username}
                          {entry.countryCode ? ` · ${entry.countryCode}` : ""}
                        </p>
                      </div>
                    </Link>

                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-faded-gray/10 px-2.5 py-1.5 font-codingo-sans text-[12px] font-black leading-none text-charcoal">
                        <Zap className="h-4 w-4 text-eager-green" strokeWidth={2.4} aria-hidden="true" />
                        {entry.xp}
                      </span>
                      <span className="inline-flex min-w-[52px] justify-center rounded-full bg-charcoal px-2.5 py-1.5 font-codingo-sans text-[12px] font-black leading-none text-paper-white">
                        Lv {entry.level}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e6] px-2.5 py-1.5 font-codingo-sans text-[12px] font-black leading-none text-[#b91c1c]">
                        <Flame className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                        {entry.streak?.count ?? 0}
                      </span>
                    </div>

                    {/* Mobile compact stats */}
                    <div className="flex shrink-0 flex-col items-end gap-1 sm:hidden">
                      <span className="inline-flex items-center gap-1 rounded-full bg-eager-green px-2 py-1 font-codingo-sans text-[11px] font-black leading-none text-paper-white">
                        <Zap className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
                        {entry.xp}
                      </span>
                      <span className="font-codingo-sans text-[11px] font-bold leading-none text-pencil-gray">Lv {entry.level}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {showMeStrip && me ? (
              <div className="border-t-2 border-eager-green bg-storybook-green/20 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="hidden w-[56px] shrink-0 items-center justify-center sm:flex">
                    <RankBadge rank={me.rank} />
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eager-green font-codingo-sans text-[11px] font-black leading-none text-paper-white sm:hidden">
                    {me.rank}
                  </span>
                  <UserAvatar src={me.avatar} name={me.name} username={me.username} boxClass="h-14 w-14 rounded-[14px] text-[18px] sm:h-[56px] sm:w-[56px] sm:rounded-[16px] sm:text-[19px] border-2 border-faded-gray" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-codingo-sans text-[14px] font-black leading-[1.2] text-charcoal">
                      {me.name} <span className="rounded-full bg-eager-green px-2 py-0.5 font-codingo-sans text-[10px] font-black uppercase leading-none tracking-[0.04em] text-paper-white">You</span>
                    </p>
                    <p className="truncate font-codingo-sans text-[12px] font-bold leading-[1.2] text-pencil-gray">@{me.username} · #{me.rank} of {total}</p>
                  </div>
                  <Link
                    href={`/app/leaderboard?page=${Math.ceil(meRank / LIMIT)}`}
                    className="shrink-0 rounded-[12px] border-2 border-eager-green bg-eager-green px-3 py-2 font-codingo-sans text-[12px] font-black leading-none text-paper-white hover:brightness-95"
                  >
                    View
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {/* Pagination — minimal */}
          <nav aria-label="Leaderboard pages" className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={`/app/leaderboard?page=${page - 1}`}
                  className="inline-flex items-center gap-1.5 rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2.5 font-codingo-sans text-[13px] font-bold leading-none text-charcoal transition-colors hover:border-charcoal"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  Prev
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-[12px] border-2 border-faded-gray bg-faded-gray/10 px-4 py-2.5 font-codingo-sans text-[13px] font-bold leading-none text-pencil-gray">
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  Prev
                </span>
              )}
              <span className="hidden rounded-full bg-charcoal px-3 py-1.5 font-codingo-sans text-[12px] font-black leading-none text-paper-white sm:inline-flex">
                Page {page} / {totalPages}
              </span>
              <span className="rounded-full bg-faded-gray/15 px-3 py-1.5 font-codingo-sans text-[12px] font-black leading-none text-pencil-gray sm:hidden">
                {page}/{totalPages}
              </span>
              {hasMore ? (
                <Link
                  href={`/app/leaderboard?page=${page + 1}`}
                  className="inline-flex items-center gap-1.5 rounded-[12px] border-2 border-charcoal bg-charcoal px-4 py-2.5 font-codingo-sans text-[13px] font-bold leading-none text-paper-white hover:brightness-110"
                >
                  Next
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-[12px] border-2 border-faded-gray bg-faded-gray/10 px-4 py-2.5 font-codingo-sans text-[13px] font-bold leading-none text-pencil-gray">
                  Next
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                </span>
              )}
            </div>

            <div className="hidden items-center gap-1.5 sm:flex">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show window around current page
                let start = Math.max(1, page - 2);
                let end = Math.min(totalPages, start + 4);
                if (end - start < 4) start = Math.max(1, end - 4);
                const p = start + i;
                if (p > end) return null;
                const active = p === page;
                return (
                  <Link
                    key={p}
                    href={`/app/leaderboard?page=${p}`}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "inline-flex h-9 w-9 items-center justify-center rounded-[12px] border-2 border-eager-green bg-eager-green font-codingo-sans text-[13px] font-black leading-none text-paper-white"
                        : "inline-flex h-9 w-9 items-center justify-center rounded-[12px] border-2 border-faded-gray bg-paper-white font-codingo-sans text-[13px] font-bold leading-none text-pencil-gray hover:border-charcoal hover:text-charcoal"
                    }
                  >
                    {p}
                  </Link>
                );
              })}
            </div>

            <p className="hidden font-codingo-sans text-[12px] font-medium text-pencil-gray lg:block">
              {total} ranked · tie → earlier member wins · private profiles hidden
            </p>
          </nav>

          <p className="mt-3 text-center font-codingo-sans text-[12px] font-medium leading-[1.4] text-pencil-gray lg:hidden">
            {total} ranked · tie → earlier member wins · private profiles hidden
          </p>
        </>
      )}

      {!data.ok ? (
        <div className="mt-4 rounded-[12px] border-2 border-[#ffb3b3] bg-[#ffe6e6] p-4">
          <p className="font-codingo-sans text-[14px] font-bold leading-[1.3] text-[#b91c1c]">Leaderboard couldn&apos;t load ({data.status ?? "unknown"}).</p>
          <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.4] text-charcoal">{data.text ? String(data.text).slice(0, 240) : "Try refreshing — the server may be waking up."}</p>
        </div>
      ) : null}
    </div>
  );
}
