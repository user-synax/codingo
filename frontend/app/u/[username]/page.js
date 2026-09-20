import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenCheck, CalendarDays, EyeOff, Flame, Pencil } from "lucide-react";
import { API_BASE, fetchPublicProfile } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getXpProgress } from "@/lib/level";
import { BADGE_DEFS, ALL_BADGES } from "@/lib/badges";
import { UserAvatar } from "@/components/app/UserAvatar";
import { ShareButton } from "@/components/profile/ShareButton";

async function getProfile(username) {
  const { res, data } = await fetchPublicProfile(username);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load profile");
  return data?.user ?? null;
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  return {
    title: `@${username} — Codingo`,
    description: `See @${username}'s coding progress on Codingo.`,
  };
}

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const [profile, viewer] = await Promise.all([getProfile(username), getCurrentUser()]);
  if (!profile) notFound();
  const isOwn = viewer?.username?.toLowerCase() === profile.username?.toLowerCase();
  const isPrivate = Boolean(profile.isPrivate);

  return (
    <div className="min-h-screen bg-paper-white font-codingo-sans text-charcoal">
      {/* Minimal public header */}
      <header className="border-b-2 border-faded-gray bg-paper-white">
        <div className="mx-auto flex h-[60px] w-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-feather text-[22px] font-black tracking-[-0.02em] text-eager-green">
            Codingo
          </Link>
          {viewer ? (
            <Link
              href="/app"
              className="codingo-btn codingo-btn-primary rounded-[12px] border-2 border-eager-green bg-eager-green px-4 py-2 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95"
            >
              Open app
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-[12px] px-3 py-2 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-pencil-gray hover:text-charcoal"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="codingo-btn codingo-btn-primary rounded-[12px] border-2 border-eager-green bg-eager-green px-4 py-2 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-4 py-8 sm:px-6">
        {/* Identity card */}
        <div className="overflow-hidden rounded-[20px] border-2 border-faded-gray bg-paper-white">
          <div className="h-[72px] bg-storybook-green" aria-hidden="true" />
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="-mt-10 flex items-end justify-between gap-3">
              <UserAvatar
                src={profile.avatar}
                name={profile.name}
                username={profile.username}
                boxClass="h-20 w-20 rounded-[20px] text-[30px]"
              />
              <div className="flex gap-2 pb-1">
                <ShareButton />
                {isOwn ? (
                  <Link
                    href="/app/settings"
                    className="inline-flex items-center gap-1.5 rounded-[12px] border-2 border-charcoal bg-charcoal px-4 py-2 font-codingo-sans text-[13px] font-bold leading-none text-paper-white"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                    Edit
                  </Link>
                ) : null}
              </div>
            </div>
            <h1 className="mt-3 font-codingo-sans text-[24px] font-bold leading-[1.15] text-charcoal">
              {profile.name ?? profile.username}
            </h1>
            <p className="font-codingo-sans text-[14px] font-medium leading-[1.3] text-pencil-gray">@{profile.username}</p>
            {!isPrivate && profile.bio ? (
              <p className="mt-2 max-w-[560px] font-codingo-sans text-[15px] font-medium leading-[1.45] text-charcoal">
                {profile.bio}
              </p>
            ) : null}
            <p className="mt-2 inline-flex items-center gap-1.5 font-codingo-sans text-[12px] font-bold text-pencil-gray">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              {isPrivate ? "Member" : `Learning since ${new Date(profile.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
            </p>
          </div>
        </div>

        {isPrivate && !isOwn ? (
          <div className="mt-4 rounded-[16px] border-2 border-dashed border-faded-gray bg-paper-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-faded-gray/20 text-pencil-gray">
              <EyeOff className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            </div>
            <h2 className="mt-3 font-codingo-sans text-[17px] font-bold text-charcoal">This profile is private</h2>
            <p className="mx-auto mt-1 max-w-[360px] font-codingo-sans text-[14px] font-medium leading-[1.45] text-pencil-gray">
              @{profile.username} keeps their stats hidden — only the name shows here.
            </p>
          </div>
        ) : isPrivate && isOwn ? (
          <div className="mt-4 rounded-[16px] border-2 border-faded-gray bg-paper-white p-5 text-center">
            <p className="inline-flex items-center gap-1.5 font-codingo-sans text-[13px] font-bold text-pencil-gray">
              <EyeOff className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Only you see this — your profile is private. Turn it off in Settings to show your showcase.
            </p>
          </div>
        ) : (
          <Showcase profile={profile} />
        )}

        {!viewer ? (
          <div className="mt-6 rounded-[16px] border-2 border-eager-green bg-storybook-green p-5 text-center sm:p-6">
            <h2 className="font-codingo-sans text-[17px] font-bold text-charcoal">Learn to code free, like @{profile.username}</h2>
            <p className="mx-auto mt-1 max-w-[420px] font-codingo-sans text-[14px] font-medium text-charcoal">
              Bite-sized lessons, real code in your browser, and a streak that keeps you going.
            </p>
            <Link
              href="/signup"
              className="codingo-btn codingo-btn-primary mt-4 inline-flex items-center justify-center rounded-[12px] border-2 border-eager-green bg-eager-green px-6 py-3 font-codingo-sans text-[14px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95"
            >
              Start learning free
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Showcase({ profile }) {
  const xpInfo = getXpProgress(profile.xp ?? 0);
  const badges = profile.badges ?? [];
  const stats = [
    { label: "Day streak", value: String(profile.streak?.count ?? 0), icon: Flame, tile: "bg-[#fff4e6] text-[#ff9600]" },
    { label: "Total XP", value: String(profile.xp ?? 0), icon: BookOpenCheck, tile: "bg-storybook-green text-eager-green" },
    { label: "Level", value: String(profile.level ?? 1), icon: CalendarDays, tile: "bg-[#e6f4ff] text-spark-blue" },
  ];

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-3 text-center sm:p-4">
            <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-[12px] ${s.tile}`} aria-hidden="true">
              <s.icon className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <p className="mt-2 font-codingo-sans text-[20px] font-black leading-none text-charcoal sm:text-[22px]">{s.value}</p>
            <p className="mt-1 font-codingo-sans text-[10px] font-bold uppercase leading-none tracking-[0.05em] text-pencil-gray sm:text-[11px]">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[16px] border-2 border-faded-gray bg-paper-white p-5">
        <div className="flex items-center justify-between">
          <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.04em] text-pencil-gray">
            Level {xpInfo.level} → {xpInfo.nextLevel}
          </p>
          <p className="font-codingo-sans text-[13px] font-bold text-pencil-gray">
            {profile.completedLessons ?? 0} lessons done
          </p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-faded-gray/20">
          <div className="h-full rounded-full bg-eager-green" style={{ width: `${Math.round(xpInfo.progress * 100)}%` }} />
        </div>
      </div>

      <div className="mt-4 rounded-[16px] border-2 border-faded-gray bg-paper-white p-5">
        <h2 className="font-codingo-sans text-[16px] font-black text-charcoal">
          Badges <span className="font-bold text-pencil-gray">{badges.length}/{ALL_BADGES.length}</span>
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {ALL_BADGES.map((id) => {
            const def = BADGE_DEFS[id];
            const unlocked = badges.includes(id);
            return (
              <div
                key={id}
                title={`${def.title} — ${unlocked ? "unlocked" : "locked"}`}
                className={
                  unlocked
                    ? `rounded-[12px] border-2 ${def.border} ${def.bg} p-2.5 text-center`
                    : "rounded-[12px] border-2 border-faded-gray bg-faded-gray/10 p-2.5 text-center opacity-50 grayscale"
                }
              >
                <p className={`font-codingo-sans text-[11px] font-black leading-[1.2] ${unlocked ? "text-charcoal" : "text-pencil-gray"}`}>
                  {def.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
