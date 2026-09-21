"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Heart, Gem, Snowflake, Target, ShoppingBag, Zap, Trophy, Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import { fetchEconomy, refillHearts, buyFreeze, updateDailyGoal } from "@/lib/api";

function msToHMS(ms) {
  if (ms <= 0) return "ready";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${Math.floor(s % 60)}s`;
  return `${s}s`;
}

const GOALS = [20, 30, 50, 80, 100];

export function ShopClient({ user, initialEconomy }) {
  const [eco, setEco] = useState(initialEconomy);
  const [loading, setLoading] = useState(null); // 'single' | 'full' | 'freeze' | 'goal'
  const [msg, setMsg] = useState(null);
  const [tick, setTick] = useState(0);

  // Live tick for regen countdown
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Refresh economy silently every 30s or on focus
  async function refresh() {
    const { ok, data } = await fetchEconomy();
    if (ok && data) setEco(data);
  }

  const hearts = eco.hearts ?? 3;
  const cc = eco.cc ?? 0;
  const freezes = eco.freezes ?? 0;
  const dailyGoalXp = eco.dailyGoalXp ?? 50;
  const dailyXp = eco.dailyXp ?? 0;
  const regenIn = eco.regenInMs ?? 0;
  const fullIn = eco.fullInMs ?? 0;

  // Adjust regen for tick
  const liveRegen = useMemo(() => Math.max(0, regenIn - tick * 1000), [regenIn, tick]);
  const liveFull = useMemo(() => Math.max(0, fullIn - tick * 1000), [fullIn, tick]);

  const dailyPct = Math.min(100, Math.round((dailyXp / Math.max(1, dailyGoalXp)) * 100));

  async function handleRefill(type) {
    setLoading(type);
    setMsg(null);
    const { ok, data } = await refillHearts(type);
    if (ok) {
      setMsg({ type: "ok", text: data.message ?? "Hearts refilled!" });
      await refresh();
    } else {
      setMsg({ type: "err", text: data?.message ?? "Could not refill." });
    }
    setLoading(null);
  }

  async function handleBuyFreeze() {
    setLoading("freeze");
    setMsg(null);
    const { ok, data } = await buyFreeze();
    if (ok) {
      setMsg({ type: "ok", text: data.message ?? "Freeze purchased!" });
      await refresh();
    } else {
      setMsg({ type: "err", text: data?.message ?? "Could not buy freeze." });
    }
    setLoading(null);
  }

  async function handleGoal(v) {
    setLoading("goal");
    setMsg(null);
    const { ok, data } = await updateDailyGoal(v);
    if (ok) {
      setMsg({ type: "ok", text: `Daily goal set to ${v} XP.` });
      setEco((s) => ({ ...s, dailyGoalXp: v }));
      // also refresh to get dailyXp correctly
      await refresh();
    } else {
      setMsg({ type: "err", text: data?.message ?? "Could not update goal." });
    }
    setLoading(null);
  }

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      {/* Header */}
      <header className="w-full overflow-hidden rounded-[16px] border-2 border-faded-gray bg-paper-white md:rounded-[20px]">
        <div className="relative p-5 sm:p-6 md:p-7">
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#fff8e6]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-[#ffe6f0]/60" aria-hidden="true" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[16px] border-2 border-charcoal bg-[#ffd60a] text-charcoal shadow-[0_4px_0_var(--color-charcoal)] sm:h-[64px] sm:w-[64px]">
                <ShoppingBag className="h-[22px] w-[22px] sm:h-[24px] sm:w-[24px]" strokeWidth={2.2} aria-hidden="true" />
              </div>
              <div>
                <p className="inline-flex items-center rounded-full bg-charcoal px-3 py-1 font-codingo-sans text-[11px] font-black uppercase leading-none tracking-[0.06em] text-paper-white">Shop</p>
                <h1 className="mt-2 font-codingo-sans text-[26px] font-black leading-[1.1] text-charcoal sm:text-[30px]">Codingo Shop</h1>
                <p className="mt-1 max-w-[520px] font-codingo-sans text-[14px] font-medium leading-[1.45] text-pencil-gray">Spend your Codingo Cash (CC) — earned 5 CC per lesson + 10 CC for perfect 100%. Use CC to stay alive and protect your streak.</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#ffec99] bg-[#fff8e6] px-4 py-2 font-codingo-sans text-[13px] font-black leading-none text-charcoal">
                <Gem className="h-4 w-4 text-[#d4a017]" strokeWidth={2.4} aria-hidden="true" />
                {cc} CC
              </div>
              <p className="font-codingo-sans text-[12px] font-medium text-pencil-gray">Earn: 5 CC / lesson · 15 CC if perfect</p>
              <Link href="/app" className="hidden md:inline-flex items-center gap-1 font-codingo-sans text-[13px] font-bold text-spark-blue hover:underline">
                <ArrowLeft className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" /> Back to dashboard
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t-2 border-faded-gray/40 bg-[#fff8e6] px-5 py-2.5 sm:px-6">
          <p className="font-codingo-sans text-[12px] font-bold uppercase tracking-[0.053em] text-pencil-gray">CC = Codingo Cash · Hearts 1/4h · Freeze saves streak</p>
          <p className="hidden font-codingo-sans text-[12px] font-medium text-pencil-gray sm:block">Tap to buy instantly</p>
        </div>
      </header>

      {msg ? (
        <div className={`mt-4 rounded-[12px] border-2 px-4 py-3 font-codingo-sans text-[13px] font-bold leading-[1.4] ${msg.type === "ok" ? "border-[#b5e39a] bg-storybook-green text-[#2b7a00]" : "border-[#ffb3b3] bg-[#ffe6e6] text-[#b91c1c]"}`}>{msg.text}</div>
      ) : null}

      {/* Hearts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border-2 border-faded-gray bg-paper-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#ffe6f0] text-[#c9184a] border-2 border-[#ffb3c6]">
                <Heart className="h-[22px] w-[22px]" strokeWidth={2.2} fill={hearts > 0 ? "currentColor" : "none"} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-codingo-sans text-[18px] font-black leading-[1.1] text-charcoal">Hearts</h2>
                <p className="font-codingo-sans text-[12px] font-bold text-pencil-gray">{hearts}/3 · 1 heart / 4h · cap 3</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 font-codingo-sans text-[11px] font-black leading-none ${hearts === 0 ? "bg-[#c9184a] text-paper-white animate-pulse" : hearts < 3 ? "bg-[#ffd60a] text-charcoal" : "bg-storybook-green text-charcoal"}`}>
              {hearts === 0 ? "Out!" : hearts === 3 ? "Full" : `${msToHMS(liveRegen)} to +1`}
            </span>
          </div>

          {/* Visual hearts */}
          <div className="mt-4 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`flex h-12 w-12 items-center justify-center rounded-[14px] border-2 text-[22px] font-black leading-none ${i < hearts ? "border-[#ff4d6d] bg-[#ffe6f0] text-[#c9184a]" : "border-faded-gray bg-faded-gray/10 text-pencil-gray grayscale"}`}>
                <Heart className={`h-[22px] w-[22px] ${i < hearts ? "fill-[#ff4d6d] text-[#ff4d6d]" : "text-faded-gray"}`} strokeWidth={i < hearts ? 2 : 1.5} aria-hidden="true" />
              </span>
            ))}
            <span className="ml-2 font-codingo-sans text-[12px] font-medium leading-[1.3] text-pencil-gray">
              {hearts < 3 ? `Full in ${msToHMS(liveFull)}` : "You’re full — go learn!"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRefill("single")}
              disabled={loading === "single" || hearts >= 3 || cc < 20}
              className="flex flex-col items-center gap-1 rounded-[16px] border-2 border-faded-gray bg-paper-white p-4 hover:border-charcoal disabled:opacity-50 disabled:grayscale"
            >
              <Heart className="h-[22px] w-[22px] text-[#ff4d6d]" strokeWidth={2} fill="currentColor" aria-hidden="true" />
              <span className="font-codingo-sans text-[14px] font-black leading-none text-charcoal">+1 Heart</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e6] px-2 py-1 font-codingo-sans text-[11px] font-black leading-none text-charcoal">
                <Gem className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> 20 CC
              </span>
              <span className="font-codingo-sans text-[11px] font-bold text-pencil-gray">{loading === "single" ? "Buying…" : cc < 20 ? "Need 20 CC" : "Instant"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleRefill("full")}
              disabled={loading === "full" || hearts >= 3 || cc < 50}
              className="flex flex-col items-center gap-1 rounded-[16px] border-2 border-eager-green bg-storybook-green/30 p-4 hover:brightness-95 disabled:opacity-50 disabled:grayscale"
            >
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <Heart key={i} className="h-5 w-5 text-[#ff4d6d]" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
                ))}
              </span>
              <span className="font-codingo-sans text-[14px] font-black leading-none text-charcoal">Full Refill</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-charcoal px-2 py-1 font-codingo-sans text-[11px] font-black leading-none text-paper-white">
                <Gem className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> 50 CC
              </span>
              <span className="font-codingo-sans text-[11px] font-bold text-pencil-gray">{loading === "full" ? "Buying…" : cc < 50 ? "Need 50 CC" : "Best value"}</span>
            </button>
          </div>
          <p className="mt-3 text-center font-codingo-sans text-[11px] font-medium leading-[1.3] text-pencil-gray">Hearts refill 1 per 4h automatically. At 0 hearts you can’t start a lesson until you refill.</p>
        </div>

        {/* Freeze */}
        <div className="rounded-[20px] border-2 border-faded-gray bg-paper-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#e6f7ff] text-spark-blue border-2 border-[#b3e5ff]">
                <Snowflake className="h-[22px] w-[22px]" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-codingo-sans text-[18px] font-black leading-[1.1] text-charcoal">Streak Freeze</h2>
                <p className="font-codingo-sans text-[12px] font-bold text-pencil-gray">{freezes} owned · max 5 · auto-use</p>
              </div>
            </div>
            <span className="rounded-full bg-spark-blue px-3 py-1 font-codingo-sans text-[11px] font-black leading-none text-paper-white">{freezes} ❄️</span>
          </div>
          <div className="mt-4 rounded-[14px] border-2 border-faded-gray bg-faded-gray/10 p-4">
            <p className="flex items-center gap-2 font-codingo-sans text-[13px] font-bold leading-[1.3] text-charcoal">
              <ShieldCheck className="h-4 w-4 text-spark-blue" strokeWidth={2.4} aria-hidden="true" /> How it works
            </p>
            <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.45] text-pencil-gray">If you miss exactly one day, your freeze is used automatically and your streak lives. Miss 2+ days → streak resets even with freezes. Buy freezes only with CC.</p>
          </div>
          <button
            type="button"
            onClick={handleBuyFreeze}
            disabled={loading === "freeze" || cc < 50 || freezes >= 5}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border-2 border-spark-blue bg-spark-blue px-5 py-3 font-codingo-sans text-[14px] font-black leading-none text-paper-white hover:brightness-95 disabled:opacity-50 disabled:grayscale"
          >
            <Snowflake className="h-[22px] w-[22px]" strokeWidth={2.4} aria-hidden="true" />
            {loading === "freeze" ? "Buying…" : freezes >= 5 ? "Max 5 reached" : cc < 50 ? "Need 50 CC" : "Buy 1 Freeze — 50 CC"}
          </button>
          <p className="mt-2 text-center font-codingo-sans text-[11px] font-medium text-pencil-gray">Premium only — no free freezes. Stock up before you need it.</p>
        </div>
      </div>

      {/* Daily goal */}
      <div className="mt-4 rounded-[20px] border-2 border-faded-gray bg-paper-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-storybook-green text-eager-green border-2 border-[#b5e39a]">
              <Target className="h-[22px] w-[22px]" strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-codingo-sans text-[18px] font-black leading-[1.1] text-charcoal">Daily Goal</h2>
              <p className="font-codingo-sans text-[12px] font-bold text-pencil-gray">Earn XP every day — builds streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-charcoal px-3 py-1.5 font-codingo-sans text-[12px] font-black leading-none text-paper-white">
              {dailyXp}/{dailyGoalXp} XP
            </span>
            <span className={`rounded-full px-3 py-1.5 font-codingo-sans text-[11px] font-black leading-none ${dailyXp >= dailyGoalXp ? "bg-eager-green text-paper-white" : "bg-[#ffd60a] text-charcoal"}`}>
              {dailyPct}%
            </span>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-faded-gray/20">
          <div className={`h-full rounded-full transition-all duration-500 ${dailyXp >= dailyGoalXp ? "bg-eager-green" : "bg-[#ffd60a]"}`} style={{ width: `${dailyPct}%` }} />
        </div>
        <p className="mt-2 text-center font-codingo-sans text-[12px] font-bold text-pencil-gray">
          {dailyXp >= dailyGoalXp ? "Daily goal completed — keep the streak!" : `${dailyGoalXp - dailyXp} XP to daily goal`}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {GOALS.map((v) => {
            const active = v === dailyGoalXp;
            return (
              <button
                key={v}
                type="button"
                onClick={() => handleGoal(v)}
                disabled={loading === "goal"}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-[14px] border-2 border-eager-green bg-eager-green px-3 py-3 font-codingo-sans text-[14px] font-black leading-none text-paper-white shadow-[0_3px_0_var(--color-deep-leaf)]"
                    : "rounded-[14px] border-2 border-faded-gray bg-paper-white px-3 py-3 font-codingo-sans text-[14px] font-bold leading-none text-charcoal hover:border-charcoal"
                }
              >
                {v} XP
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center font-codingo-sans text-[11px] font-medium leading-[1.4] text-pencil-gray">Goal resets at midnight in your timezone ({user?.timezone ?? "Asia/Kolkata"}). Pick a goal you can hit daily.</p>
      </div>

      <div className="mt-4 rounded-[16px] border-2 border-faded-gray bg-paper-white p-4 text-center">
        <p className="font-codingo-sans text-[12px] font-bold uppercase tracking-[0.053em] text-pencil-gray">How to earn CC faster</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2 font-codingo-sans text-[12px] font-black">
          <span className="inline-flex items-center gap-1 rounded-full bg-storybook-green px-3 py-1.5 text-charcoal">
            <Zap className="h-3.5 w-3.5 text-eager-green" strokeWidth={2.4} aria-hidden="true" /> 5 CC per lesson
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ffd60a] px-3 py-1.5 text-charcoal">
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" /> +10 CC if perfect 100%
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e6] px-3 py-1.5 text-[#e8590c]">
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" /> Spend in Shop
          </span>
        </div>
        <Link href="/app/learn" className="mt-4 inline-flex items-center gap-2 rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-2.5 font-codingo-sans text-[13px] font-black leading-none text-paper-white hover:brightness-95">
          Earn CC — start a lesson
        </Link>
      </div>
    </div>
  );
}
