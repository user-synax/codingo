import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function AppHome() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      {/* Greeting */}
      <div className="mb-6 rounded-[12px] border-2 border-faded-gray bg-paper-white p-[20px] sm:p-[28px]">
        <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Welcome back</p>
        <h1 className="mt-1 font-codingo-sans text-[28px] font-bold leading-[1.15] text-charcoal sm:text-[32px]">
          Hey, {user?.username ?? "learner"} — ready to code?
        </h1>
        <p className="mt-2 max-w-[560px] font-codingo-sans text-[15px] font-medium leading-[1.4] text-pencil-gray">
          Bite-sized lessons, real code in your browser, and a community that helps you get unstuck. Pick up where you left off.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/app/learn"
            className="codingo-btn codingo-btn-primary inline-flex items-center justify-center rounded-[12px] border-2 border-eager-green bg-eager-green px-6 py-3 font-codingo-sans text-[15px] font-bold uppercase tracking-[0.053em] leading-[1.33] text-paper-white hover:brightness-95"
          >
            Continue learning
          </Link>
          <Link
            href="/app/community"
            className="codingo-btn codingo-btn-outline inline-flex items-center justify-center rounded-[12px] border-2 border-faded-gray bg-paper-white px-6 py-3 font-codingo-sans text-[14px] font-bold leading-[1.4] text-spark-blue hover:border-spark-blue hover:bg-spark-blue/5"
          >
            Ask the community
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">XP</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-storybook-green text-eager-green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
          </div>
          <p className="mt-2 font-codingo-sans text-[28px] font-bold leading-none text-charcoal">{user?.xp ?? 0}</p>
          <p className="mt-1 font-codingo-sans text-[13px] font-medium text-pencil-gray">Total points earned</p>
        </div>
        <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Streak</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#fff4e6] text-[#ff9600]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.2-4.5 2-5 1.5 1.5 2.5 3.5 1.5 5.5-.5 1-1 2-1 3a2.5 2.5 0 0 0 2.5 2.5" />
                <path d="M12 18a3 3 0 0 0 3-3" />
              </svg>
            </span>
          </div>
          <p className="mt-2 font-codingo-sans text-[28px] font-bold leading-none text-charcoal">{user?.streak?.count ?? 0} days</p>
          <p className="mt-1 font-codingo-sans text-[13px] font-medium text-pencil-gray">Keep it going</p>
        </div>
        <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Level</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#e6f4ff] text-spark-blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </span>
          </div>
          <p className="mt-2 font-codingo-sans text-[28px] font-bold leading-none text-charcoal">Lv {user?.level ?? 1}</p>
          <p className="mt-1 font-codingo-sans text-[13px] font-medium text-pencil-gray">{user?.badges?.length ?? 0} badges</p>
        </div>
      </div>

      {/* Path preview placeholder */}
      <div className="mt-6 rounded-[12px] border-2 border-faded-gray bg-paper-white p-6">
        <h2 className="font-codingo-sans text-[19px] font-bold leading-[1.4] text-charcoal">Your path</h2>
        <p className="mt-1 font-codingo-sans text-[14px] font-medium leading-[1.4] text-pencil-gray">
          Course content lands here — vertical skill path, lesson nodes, checkpoints. This layout is ready for it.
        </p>
        <div className="mt-4 flex gap-3">
          <div className="h-12 w-12 rounded-[12px] border-2 border-faded-gray bg-storybook-green" aria-hidden="true" />
          <div className="h-12 w-12 rounded-[12px] border-2 border-faded-gray bg-paper-white" aria-hidden="true" />
          <div className="h-12 w-12 rounded-[12px] border-2 border-faded-gray bg-paper-white" aria-hidden="true" />
          <div className="h-12 w-12 rounded-[12px] border-2 border-faded-gray bg-paper-white opacity-60" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
