import Link from "next/link";
import {
  BookOpen,
  Layers,
  Code2,
  Trophy,
  Flame,
  Heart,
  Coins,
  MessageCircle,
  Brain,
  Database,
  Server,
  Palette,
  Shield,
  Zap,
  Globe,
  Smartphone,
  ExternalLink,
  ArrowRight,
  ArrowUpRight,
  Search,
  Settings2,
  Rocket,
  Sparkles,
  Check,
  Clock3,
  Boxes,
  Network,
  FileJson,
  Terminal,
} from "lucide-react";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";

/* Static docs — no auth, no client fetch. Fully render-time.
   Design: Paper White canvas, Eager Green display, Charcoal body,
   12px radius, 2px borders, 3D press-edge only on buttons. */

export const metadata = {
  title: "Documentation",
  description:
    "Everything about Codingo — architecture, learning path, gamification, community, AI helper, API, data models, setup and roadmap. A free, Duolingo-style way to learn code.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: `Documentation | ${SITE_NAME}`,
    description:
      "The complete guide to Codingo — how lessons, XP, streaks and the AI helper work, plus the full tech stack and API reference.",
    url: `${siteUrl()}/docs`,
    siteName: SITE_NAME,
    type: "article",
  },
};

const SECTIONS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "how-it-works", label: "How it works", icon: Sparkles },
  { id: "learning-path", label: "Learning path", icon: Layers },
  { id: "exercises", label: "Exercise types", icon: Code2 },
  { id: "gamification", label: "Gamification", icon: Trophy },
  { id: "community-ai", label: "Community & AI", icon: MessageCircle },
  { id: "architecture", label: "Architecture", icon: Boxes },
  { id: "frontend", label: "Frontend", icon: Smartphone },
  { id: "backend", label: "Backend API", icon: Server },
  { id: "data", label: "Data models", icon: Database },
  { id: "offline", label: "Offline & PWA", icon: Globe },
  { id: "runner", label: "Code runner", icon: Terminal },
  { id: "design", label: "Design system", icon: Palette },
  { id: "env", label: "Environment", icon: Settings2 },
  { id: "setup", label: "Setup", icon: Rocket },
  { id: "roadmap", label: "Roadmap", icon: Clock3 },
];

function TocLink({ id, label, Icon }) {
  return (
    <a
      href={`#${id}`}
      className="group flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-left font-codingo-sans text-[13px] font-bold leading-none text-pencil-gray transition-colors hover:bg-storybook-green hover:text-charcoal"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-faded-gray group-hover:text-charcoal" strokeWidth={2} aria-hidden="true" />
      {label}
    </a>
  );
}

function Badge({ children, tone = "green" }) {
  const map = {
    green: "bg-storybook-green text-charcoal border-[#b6e3a0]",
    blue: "bg-[#e6f4ff] text-spark-blue border-[#bbe7fc]",
    gray: "bg-[#f4f4f4] text-charcoal border-faded-gray",
    ink: "bg-charcoal text-paper-white border-charcoal",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-codingo-sans text-[11px] font-black uppercase tracking-[0.04em] ${map[tone] ?? map.gray}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-[12px] border-2 border-faded-gray bg-paper-white p-5 ${className}`}>{children}</div>
  );
}

function Kbd({ children }) {
  return (
    <code className="rounded-[8px] border border-faded-gray bg-[#f8f8f7] px-1.5 py-0.5 font-mono text-[12px] font-bold text-charcoal">
      {children}
    </code>
  );
}

function CodeBlock({ code }) {
  return (
    <pre className="overflow-x-auto rounded-[12px] border-2 border-charcoal bg-charcoal p-4 font-mono text-[12px] leading-[1.6] text-paper-white">
      <code>{code}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-paper-white font-codingo-sans text-charcoal">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b-2 border-faded-gray bg-paper-white/95 backdrop-blur">
        <div className="mx-auto flex h-[64px] w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-eager-green font-feather text-[16px] font-black leading-none text-paper-white">
              C
            </span>
            <span className="font-feather text-[18px] font-black leading-none tracking-[-0.02em] text-charcoal">
              {SITE_NAME}
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full bg-storybook-green px-2 py-1 font-codingo-sans text-[10px] font-black uppercase tracking-[0.05em] text-charcoal">
              Docs
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:inline-flex rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2 font-codingo-sans text-[13px] font-bold leading-none text-charcoal hover:border-charcoal"
            >
              Back to app
            </Link>
            <a
              href="https://github.com/user-synax/codingo"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[12px] border-2 border-charcoal bg-charcoal px-4 py-2 font-codingo-sans text-[13px] font-bold leading-none text-paper-white hover:brightness-110"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b-2 border-faded-gray bg-paper-white">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.85fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="green">Free forever</Badge>
                <Badge tone="blue">Duolingo for code</Badge>
                <Badge tone="gray">Next.js 16 · Bun · MongoDB</Badge>
              </div>
              <h1 className="mt-4 font-feather text-[38px] font-black leading-[0.95] tracking-[-0.03em] text-eager-green sm:text-[48px]">
                Codingo docs
              </h1>
              <p className="mt-3 max-w-[620px] font-codingo-sans text-[17px] font-medium leading-[1.5] text-pencil-gray">
                {SITE_TAGLINE} — bite-sized lessons, real code in your browser, and a community that gets you unstuck. This page explains how the product works and how the codebase is put together.
              </p>
              <p className="mt-2 max-w-[620px] font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                New here? Start at <Link href="/" className="font-bold text-spark-blue underline decoration-2 underline-offset-2 hover:text-charcoal">the landing page</Link> or jump straight to <Link href="/signup" className="font-bold text-spark-blue underline decoration-2 underline-offset-2">sign up</Link>. Already learning? Your path lives at <Link href="/app/learn" className="font-bold text-spark-blue underline">/app/learn</Link>.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#setup"
                  className="inline-flex items-center gap-2 rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-3 font-codingo-sans text-[14px] font-black leading-none text-paper-white shadow-[0_4px_0_var(--color-deep-leaf)] hover:brightness-[0.97] active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-deep-leaf)]"
                >
                  Run it locally <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                </a>
                <a
                  href="#backend"
                  className="inline-flex items-center gap-2 rounded-[12px] border-2 border-faded-gray bg-paper-white px-5 py-3 font-codingo-sans text-[14px] font-bold leading-none text-charcoal shadow-[0_4px_0_var(--color-pale-sky)] hover:border-charcoal active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-pale-sky)]"
                >
                  API reference <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </a>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-3 py-1.5 font-codingo-sans text-[12px] font-bold text-paper-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> 30 lessons
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[12px] font-bold text-charcoal">
                  <Zap className="h-3.5 w-3.5 text-spark-blue" strokeWidth={2} aria-hidden="true" /> 7 exercise types
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[12px] font-bold text-charcoal">
                  <Heart className="h-3.5 w-3.5 text-[#ff3b30]" strokeWidth={2} aria-hidden="true" /> Hearts + CC + streak
                </span>
              </div>
            </div>

            {/* Quick facts card */}
            <Card className="bg-[#fbfbf8]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-eager-green text-paper-white">
                  <Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </div>
                <p className="font-codingo-sans text-[13px] font-black uppercase tracking-[0.05em] text-charcoal">At a glance</p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[10px] border-2 border-faded-gray bg-paper-white px-3 py-3">
                  <dt className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Audience</dt>
                  <dd className="mt-1 font-codingo-sans text-[13px] font-bold leading-[1.3] text-charcoal">Beginners 15–25, first language JS</dd>
                </div>
                <div className="rounded-[10px] border-2 border-faded-gray bg-paper-white px-3 py-3">
                  <dt className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Lesson length</dt>
                  <dd className="mt-1 font-codingo-sans text-[13px] font-bold leading-[1.3] text-charcoal">2–5 min · 5–8 exercises</dd>
                </div>
                <div className="rounded-[10px] border-2 border-faded-gray bg-paper-white px-3 py-3">
                  <dt className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">Hosting</dt>
                  <dd className="mt-1 font-codingo-sans text-[13px] font-bold leading-[1.3] text-charcoal">Vercel + Render + Atlas</dd>
                </div>
                <div className="rounded-[10px] border-2 border-faded-gray bg-paper-white px-3 py-3">
                  <dt className="font-codingo-sans text-[11px] font-bold uppercase tracking-[0.04em] text-pencil-gray">PWA</dt>
                  <dd className="mt-1 font-codingo-sans text-[13px] font-bold leading-[1.3] text-charcoal">Offline + installable</dd>
                </div>
              </dl>
              <div className="mt-4 rounded-[10px] border-2 border-eager-green bg-storybook-green px-3 py-3">
                <p className="font-codingo-sans text-[12px] font-bold leading-[1.4] text-charcoal">
                  Need the markdown? It is the same source at <Kbd>docs.md</Kbd> in the repo root — this page is its human wrapper.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Body with sticky TOC */}
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:gap-10">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[78px] lg:w-[240px] lg:shrink-0">
          <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-3">
            <p className="px-2.5 pb-2 font-codingo-sans text-[11px] font-black uppercase tracking-[0.06em] text-pencil-gray">On this page</p>
            <nav className="flex flex-col gap-0.5" aria-label="Table of contents">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <TocLink key={id} id={id} label={label} Icon={Icon} />
              ))}
            </nav>
            <div className="mt-3 border-t-2 border-faded-gray pt-3">
              <p className="px-2.5 font-codingo-sans text-[11px] font-bold leading-[1.4] text-pencil-gray">
                Tip: every API and model table here mirrors the real Mongoose + Express source.
              </p>
            </div>
          </div>

          <div className="mt-4 hidden rounded-[12px] border-2 border-charcoal bg-charcoal p-4 text-paper-white lg:block">
            <p className="flex items-center gap-2 font-codingo-sans text-[12px] font-black uppercase tracking-[0.05em]">
              <FileJson className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> For AI agents
            </p>
            <p className="mt-2 font-codingo-sans text-[13px] font-medium leading-[1.5] text-[#d7ffb8]">
              These docs are deterministic and complete enough for a coding agent to scaffold features — routes, validators, enums and auth guards are spelled out.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* Overview */}
          <section id="overview" className="scroll-mt-[84px]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-storybook-green text-charcoal">
                <BookOpen className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-feather text-[26px] font-black leading-none tracking-[-0.02em] text-charcoal">Overview</h2>
              <Badge tone="green">What it is</Badge>
            </div>
            <p className="mt-3 max-w-none font-codingo-sans text-[15px] font-medium leading-[1.6] text-pencil-gray">
              Codingo is a <span className="font-bold text-charcoal">free, gamified way to learn programming</span> on the web — modelled on Duolingo’s bite-sized daily habit but for code. A single JavaScript course ships today (30 lessons across 5 units); every exercise runs <span className="font-bold text-charcoal">in your browser</span> so there is no server cost per run.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <Zap className="h-5 w-5 text-spark-blue" strokeWidth={2} aria-hidden="true" />
                <h3 className="mt-2 font-codingo-sans text-[14px] font-black leading-[1.2] text-charcoal">Instant feedback</h3>
                <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">Check answers inline, get XP, see the confetti. Scores below 80% can be retried immediately.</p>
              </Card>
              <Card className="p-4">
                <Flame className="h-5 w-5 text-[#ff9600]" strokeWidth={2} aria-hidden="true" />
                <h3 className="mt-2 font-codingo-sans text-[14px] font-black leading-[1.2] text-charcoal">Daily habit inside</h3>
                <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">Streaks, daily XP goals, hearts that regenerate every 4 hours, and badges that mean something.</p>
              </Card>
              <Card className="p-4">
                <MessageCircle className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" />
                <h3 className="mt-2 font-codingo-sans text-[14px] font-black leading-[1.2] text-charcoal">Never stuck</h3>
                <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">Ask per-lesson doubt threads — peers reply and a hint-first AI answers within three minutes when free.</p>
              </Card>
            </div>
          </section>

          {/* How it works */}
          <section id="how-it-works" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Sparkles className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> How it works — the 60 second tour
            </h2>
            <div className="mt-4 grid gap-3">
              <div className="flex gap-3 rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eager-green font-codingo-sans text-[12px] font-black text-paper-white">1</span>
                <div className="min-w-0">
                  <p className="font-codingo-sans text-[14px] font-black text-charcoal">Create an account → finish onboarding</p>
                  <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                    Email/password or Google. Onboarding asks your name, age, country and language (only JavaScript is live) — then you land on <Kbd>/app</Kbd>.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eager-green font-codingo-sans text-[12px] font-black text-paper-white">2</span>
                <div className="min-w-0">
                  <p className="font-codingo-sans text-[14px] font-black text-charcoal">Open the path → run a lesson</p>
                  <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                    <Kbd>/app/learn</Kbd> shows a vertical skill path. Tap a node, solve 5–8 exercises one screen at a time — your answers, draft and resume point are saved after every tap (even on airplane mode).
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eager-green font-codingo-sans text-[12px] font-black text-paper-white">3</span>
                <div className="min-w-0">
                  <p className="font-codingo-sans text-[14px] font-black text-charcoal">Earn and return</p>
                  <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                    First completion mints XP + Codingo Cash and advances your level, streak and badges. Miss a day? A freeze can save you. Leaderboards live at <Kbd>/app/leaderboard</Kbd>, community at <Kbd>/app/community</Kbd>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Learning path */}
          <section id="learning-path" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Layers className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Learning path
            </h2>
            <p className="mt-2 font-codingo-sans text-[14px] font-medium leading-[1.6] text-pencil-gray">
              One course today: <span className="font-bold text-charcoal">JS from Zero — from zero to advanced, no prior code needed</span>. 5 units, 30 lessons, gentle→code-heavy.
            </p>
            <div className="mt-4 overflow-hidden rounded-[12px] border-2 border-faded-gray">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead className="bg-[#f8f8f7]">
                    <tr>
                      <th className="px-4 py-2.5 font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-pencil-gray">Unit</th>
                      <th className="px-4 py-2.5 font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-pencil-gray">Lessons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-faded-gray/40">
                    <tr><td className="px-4 py-3 font-codingo-sans text-[13px] font-bold text-charcoal">Unit 1 — Fundamentals</td><td className="px-4 py-3 font-codingo-sans text-[13px] font-medium text-pencil-gray">What is Code? · Variables · Types · Operators · Template Literals · Checkpoint</td></tr>
                    <tr><td className="px-4 py-3 font-codingo-sans text-[13px] font-bold text-charcoal">Unit 2 — Control Flow</td><td className="px-4 py-3 font-codingo-sans text-[13px] font-medium text-pencil-gray">If / Else · Comparisons & Logic · Switch & Ternary · For Loops · While Loops · Checkpoint</td></tr>
                    <tr><td className="px-4 py-3 font-codingo-sans text-[13px] font-bold text-charcoal">Unit 3 — Functions & Scope</td><td className="px-4 py-3 font-codingo-sans text-[13px] font-medium text-pencil-gray">Functions Basics · Parameters · Scope · Arrow Functions · Callbacks Intro · Checkpoint</td></tr>
                    <tr><td className="px-4 py-3 font-codingo-sans text-[13px] font-bold text-charcoal">Unit 4 — Data Structures</td><td className="px-4 py-3 font-codingo-sans text-[13px] font-medium text-pencil-gray">Arrays Basics · Array Methods · Objects Basics · Strings & Arrays · Errors & Debugging · Checkpoint</td></tr>
                    <tr><td className="px-4 py-3 font-codingo-sans text-[13px] font-bold text-charcoal">Unit 5 — Async & Project</td><td className="px-4 py-3 font-codingo-sans text-[13px] font-medium text-pencil-gray">DOM Basics · Events · Timers & Callbacks · Promises · Async Await & Fetch · Mini Project: Todo App</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-2 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">
              Seed: <Kbd>bun src/seed/seed.ts --course js-from-zero</Kbd> upserts exactly this curriculum. Order matters — nodes increment strictly by <Kbd>order</Kbd>.
            </p>
          </section>

          {/* Exercises */}
          <section id="exercises" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Code2 className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Seven exercise types
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-spark-blue">Concept</p>
                <h3 className="mt-1 font-codingo-sans text-[14px] font-black text-charcoal">Multiple choice · Fill in the blank</h3>
                <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">One correct option or one blank string. Validated by strict equality against <Kbd>solution.correctIndex/answer</Kbd>.</p>
              </Card>
              <Card className="p-4">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-spark-blue">Recall</p>
                <h3 className="mt-1 font-codingo-sans text-[14px] font-black text-charcoal">Predict output · Arrange blocks</h3>
                <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">Trim-normalized output match; block order is <Kbd>JSON.stringify</Kbd> of the index array.</p>
              </Card>
              <Card className="p-4">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-eager-green">Coding</p>
                <h3 className="mt-1 font-codingo-sans text-[14px] font-black text-charcoal">Fix the bug · Write code</h3>
                <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">Monaco editor + Web Worker <Kbd>runCode</Kbd> against the first <Kbd>tests[0].expected</Kbd> (trim + CRLF normalize).</p>
              </Card>
              <Card className="p-4">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-eager-green">Meta</p>
                <h3 className="mt-1 font-codingo-sans text-[14px] font-black text-charcoal">AI prompt</h3>
                <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">Learner writes a prompt, checks a checklist and marks “asked/example”. Only then is the exercise considered ready.</p>
              </Card>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="blue">Hint per exercise</Badge>
              <Badge tone="gray">Instant right/wrong + explanation</Badge>
              <Badge tone="gray">Exit → save draft → resume</Badge>
            </div>
          </section>

          {/* Gamification */}
          <section id="gamification" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Trophy className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Gamification
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-spark-blue" strokeWidth={2} aria-hidden="true" />
                  <h3 className="font-codingo-sans text-[13px] font-black uppercase tracking-[0.05em] text-charcoal">XP & levels</h3>
                </div>
                <p className="mt-2 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                  First completion only: <Kbd>5 × correct</Kbd> + <Kbd>10 lesson</Kbd> + <Kbd>5 perfect</Kbd>, capped <Kbd>total×5+15</Kbd>. Levels 100 → 250 → 450 → 700 then +150 per level.
                </p>
                <p className="mt-2 font-codingo-sans text-[12px] font-bold text-pencil-gray">
                  Thresholds: <Kbd>lib/level.js</Kbd> and <Kbd>backend/src/utils/level.ts</Kbd> must stay in sync.
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[#ff9600]" strokeWidth={2} aria-hidden="true" />
                  <h3 className="font-codingo-sans text-[13px] font-black uppercase tracking-[0.05em] text-charcoal">Streak & daily goal</h3>
                </div>
                <p className="mt-2 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                  Streak counts in <Kbd>Asia/Kolkata</Kbd> by default. Daily goal is 50 XP (10–200, snaps to 20/30/50/80/100). Fail to hit a day and a freeze is spent if you own one; otherwise the streak resets.
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[#ffb700]" strokeWidth={2} aria-hidden="true" />
                  <h3 className="font-codingo-sans text-[13px] font-black uppercase tracking-[0.05em] text-charcoal">Codingo Cash (CC)</h3>
                </div>
                <p className="mt-2 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                  Start with 50. Earn <Kbd>5</Kbd> per completed lesson + <Kbd>10</Kbd> if perfect. Spend on hearts and freezes — the only purchases.
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-[#ff3b30]" strokeWidth={2} aria-hidden="true" />
                  <h3 className="font-codingo-sans text-[13px] font-black uppercase tracking-[0.05em] text-charcoal">Hearts</h3>
                </div>
                <p className="mt-2 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                  Cap 3, regenerates 1 per 4 hours, single 20 CC, full 50 CC. Checked passively on every auth and progress call.
                </p>
              </Card>
            </div>
            <div className="mt-3 rounded-[12px] border-2 border-faded-gray bg-[#f8f8f7] p-4">
              <p className="flex items-center gap-2 font-codingo-sans text-[12px] font-black uppercase tracking-[0.05em] text-charcoal">
                <Trophy className="h-4 w-4 text-eager-green" strokeWidth={2} aria-hidden="true" /> Badges
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-[#b6e3a0] bg-[#e8f5d8] px-2.5 py-1 font-codingo-sans text-[12px] font-bold text-[#2e7d00]">First Lesson</span>
                <span className="rounded-full border border-[#a8c6ff] bg-[#e6f0ff] px-2.5 py-1 font-codingo-sans text-[12px] font-bold text-[#1e4a8a]">5 Lessons</span>
                <span className="rounded-full border border-[#ffd08a] bg-[#fff4e0] px-2.5 py-1 font-codingo-sans text-[12px] font-bold text-[#8a4a00]">Perfect (100%)</span>
                <span className="rounded-full border border-[#ffb3b3] bg-[#ffe6e6] px-2.5 py-1 font-codingo-sans text-[12px] font-bold text-[#b91c1c]">3-Day Streak</span>
                <span className="rounded-full border border-[#d8b4fe] bg-[#f3e8ff] px-2.5 py-1 font-codingo-sans text-[12px] font-bold text-[#6b21a8]">Week Warrior (7)</span>
                <span className="rounded-full border border-[#a5b4fc] bg-[#e6e6ff] px-2.5 py-1 font-codingo-sans text-[12px] font-bold text-[#3730a3]">Night Owl (after 10pm)</span>
              </div>
              <p className="mt-2 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">
                Unlocked only on first lesson-completion and deduped by a <Kbd>Set</Kbd>. Source of truth lives in <Kbd>utils/badges.ts</Kbd>.
              </p>
            </div>
          </section>

          {/* Community + AI */}
          <section id="community-ai" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <MessageCircle className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Community & AI
            </h2>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <Card className="p-4">
                <p className="flex items-center gap-2 font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">
                  <MessageCircle className="h-4 w-4 text-eager-green" strokeWidth={2} aria-hidden="true" /> Doubt threads
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                  <li>
                    One thread per doubt, optionally linked to a lesson — <Kbd>GET /api/threads?lessonId&sort=new|top&limit&before</Kbd>.
                  </li>
                  <li>Live updates via SSE <Kbd>GET /api/threads/stream?lessonId</Kbd> (heartbeat :/25s).</li>
                  <li>Replies sorted accepted → votes → time; upvotes are toggle + clamp, accepts are asker-only.</li>
                  <li>Reports are deduped (409) and never reveal reporter identity.</li>
                </ul>
              </Card>
              <Card className="p-4">
                <p className="flex items-center gap-2 font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">
                  <Brain className="h-4 w-4 text-spark-blue" strokeWidth={2} aria-hidden="true" /> AI doubt helper
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                  <li>Groq primary, OpenRouter fallback — OpenAI-compatible chat completions, 30s timeout, temp 0.7.</li>
                  <li>
                    Hint-first, ≤130 words + ≤one 6-line snippet, Hinglish-mirroring, never leaks <Kbd>solution</Kbd>. Prompt sources:{" "}
                    <Kbd>lessonTitle + exercise prompt + learner code</Kbd> only.
                  </li>
                  <li>
                    20 per day per user (<Kbd>AI_DAILY_LIMIT</Kbd>), counted in <Kbd>AiUsage</Kbd>. Cache hits in <Kbd>AiCache (sha256)</Kbd> cost nothing.
                  </li>
                  <li>
                    New threads get an auto first reply after ~3 min (<Kbd>AI_AUTO_REPLY_DELAY_MS</Kbd>) only if no peer answered and AI is configured — authored by the system user <Kbd>codingo-ai</Kbd>.
                  </li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Architecture */}
          <section id="architecture" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Boxes className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Architecture
            </h2>
            <p className="mt-2 font-codingo-sans text-[14px] font-medium leading-[1.6] text-pencil-gray">
              Single repo, two deployables, one database. The browser never talks directly to the backend domain — it talks same-origin to Next.js and Next.js rewrites <Kbd>/api/*</Kbd> to <Kbd>BACKEND_URL</Kbd> so the <Kbd>codingo_token</Kbd> cookie stays first-party.
            </p>
            <div className="mt-4">
              <CodeBlock
                code={`browser  →  Next.js (vercel: codingo.synax.me)
           │ rewrite /api/* → BACKEND_URL (render)
           └──────────────→  Express (Bun)  →  MongoDB Atlas
           │  next/font, Tailwind v4, Zustand, Monaco
           │  IndexedDB progressDb + SW (offline-first)
           └  helmet · cors(allowlist) · trust proxy 1 · requireDb`}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <Network className="h-5 w-5 text-spark-blue" strokeWidth={2} aria-hidden="true" />
                <h3 className="mt-2 font-codingo-sans text-[13px] font-black text-charcoal">Monorepo</h3>
                <p className="mt-1 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">
                  <Kbd>frontend/</Kbd> and <Kbd>backend/</Kbd> each have their own <Kbd>package.json</Kbd> and env. No shared build — keep it boring.
                </p>
              </Card>
              <Card className="p-4">
                <Shield className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" />
                <h3 className="mt-2 font-codingo-sans text-[13px] font-black text-charcoal">Auth boundary</h3>
                <p className="mt-1 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">
                  Edge <Kbd>proxy.js</Kbd> does a cookie-existence redirect; the real JWT verify is in server components via <Kbd>GET /api/auth/me</Kbd>.
                </p>
              </Card>
              <Card className="p-4">
                < Database className="h-5 w-5 text-charcoal" strokeWidth={2} aria-hidden="true" />
                <h3 className="mt-2 font-codingo-sans text-[13px] font-black text-charcoal">Data ownership</h3>
                <p className="mt-1 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">
                  MongoDB is the source of truth; IndexedDB is a per-user cache + offline queue that replays when back online.
                </p>
              </Card>
            </div>
          </section>

          {/* Frontend */}
          <section id="frontend" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Smartphone className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Frontend
            </h2>
            <p className="mt-2 font-codingo-sans text-[14px] font-medium leading-[1.6] text-pencil-gray">
              Next.js 16.3.5 App Router, React 19, Tailwind v4 — server components by default, Client islands only where interactive. Public pages (<Kbd>/</Kbd>, <Kbd>/docs</Kbd>, <Kbd>/u/[username]</Kbd>, legal) need no login; <Kbd>/app/*</Kbd> and <Kbd>/onboarding</Kbd> are guarded.
            </p>
            <div className="mt-4 overflow-hidden rounded-[12px] border-2 border-faded-gray">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead className="bg-[#f8f8f7]">
                    <tr>
                      <th className="px-3 py-2.5 font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-pencil-gray">Route</th>
                      <th className="px-3 py-2.5 font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-pencil-gray">File</th>
                      <th className="px-3 py-2.5 font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-pencil-gray">Auth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-faded-gray/30 font-codingo-sans text-[13px]">
                    <tr><td className="px-3 py-2 font-bold text-charcoal">/</td><td className="px-3 py-2 text-pencil-gray"><Kbd>app/page.js</Kbd></td><td className="px-3 py-2 text-pencil-gray">public → redirects if authed</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-charcoal">/login · /signup · /forgot-password</td><td className="px-3 py-2 text-pencil-gray"><Kbd>(auth)/*/page.js</Kbd></td><td className="px-3 py-2 text-pencil-gray">guest (AuthLayout)</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-charcoal">/onboarding</td><td className="px-3 py-2 text-pencil-gray"><Kbd>onboarding/page.js</Kbd></td><td className="px-3 py-2 text-pencil-gray">authed + !completed</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-charcoal">/app</td><td className="px-3 py-2 text-pencil-gray"><Kbd>app/app/page.js</Kbd></td><td className="px-3 py-2 text-pencil-gray">dashboard</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-charcoal">/app/learn · /app/learn/[lessonId]</td><td className="px-3 py-2 text-pencil-gray"><Kbd>app/app/learn/**</Kbd></td><td className="px-3 py-2 text-pencil-gray">path + runner</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-charcoal">/app/community · /app/community/[threadId]</td><td className="px-3 py-2 text-pencil-gray"><Kbd>app/app/community/**</Kbd></td><td className="px-3 py-2 text-pencil-gray">feed + detail (SSE)</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-charcoal">/app/leaderboard</td><td className="px-3 py-2 text-pencil-gray"><Kbd>app/app/leaderboard/page.js</Kbd></td><td className="px-3 py-2 text-pencil-gray">global board</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-charcoal">/app/profile · /app/settings</td><td className="px-3 py-2 text-pencil-gray"><Kbd>app/app/**</Kbd></td><td className="px-3 py-2 text-pencil-gray">self</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-charcoal">/u/[username]</td><td className="px-3 py-2 text-pencil-gray"><Kbd>app/u/[username]/page.js</Kbd></td><td className="px-3 py-2 text-pencil-gray">public showcase</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-charcoal">/docs · /privacy · /terms · /policy · /offline</td><td className="px-3 py-2 text-pencil-gray"><Kbd>app/docs|privacy|…/page.js</Kbd></td><td className="px-3 py-2 text-pencil-gray">public</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <h3 className="font-codingo-sans text-[13px] font-black text-charcoal">Key libs</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                  <li><Kbd>lib/api.js</Kbd> — single API helper (handles FormData, timeout 30s, cookie forwarding)</li>
                  <li><Kbd>lib/progressDb.js v3</Kbd> — 4-store IndexedDB (progress/meta/pending/drafts)</li>
                  <li><Kbd>stores/progressStore.js</Kbd> — Zustand with IDB-first hydration + offline queue</li>
                  <li><Kbd>lib/runner</Kbd> — Worker JS sandbox + <Kbd>compareOutput</Kbd></li>
                </ul>
              </Card>
              <Card className="p-4">
                <h3 className="font-codingo-sans text-[13px] font-black text-charcoal">PWA + perf</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                  <li><Kbd>public/sw.js</Kbd> (must-revalidate) + <Kbd>RegisterSW</Kbd> + <Kbd>InstallApp</Kbd></li>
                  <li><Kbd>site.webmanifest</Kbd> + <Kbd>sitemap.js</Kbd> + <Kbd>robots.js</Kbd> + OG JSON-LD on <Kbd>/</Kbd></li>
                  <li>Images <Kbd>correct/wrong/complete.mp3</Kbd> and confetti on lesson complete</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Backend */}
          <section id="backend" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Server className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Backend — Express on Bun
            </h2>
            <p className="mt-2 font-codingo-sans text-[14px] font-medium leading-[1.6] text-pencil-gray">
              Entry <Kbd>src/index.ts</Kbd> connects Mongoose, builds the Express app via <Kbd>createApp()</Kbd> (trust proxy 1, helmet, parsers, strict CORS in prod, <Kbd>requireDb</Kbd> fail-fast), mounts 8 routers.
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-[12px] border-2 border-faded-gray bg-[#f8f8f7] p-4">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">Auth — <Kbd>/api/auth</Kbd></p>
                <ul className="mt-2 space-y-1 font-mono text-[12px] font-bold leading-[1.6] text-charcoal">
                  <li>POST register · POST login · POST logout · GET me · PATCH onboarding · POST google</li>
                </ul>
                <p className="mt-2 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">Google verifies <Kbd>ID token audience + email_verified</Kbd> via <Kbd>google-auth-library</Kbd>; temp <Kbd>google_user_*</Kbd> is replaced during onboarding. Rate limit 20/15m.</p>
              </div>
              <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">Content — <Kbd>/api/courses</Kbd> · <Kbd>/api/lessons/:id</Kbd></p>
                <p className="mt-2 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">Courses return nested units→lessons sorted by <Kbd>order</Kbd>. Lesson detail needs auth and returns ordered exercises.</p>
              </div>
              <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">Progress — <Kbd>/api/progress</Kbd></p>
                <p className="mt-2 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">POST upserts <Kbd>{"{lessonId, score 0..100, completed?, firstTry?, correctCount, total}"}</Kbd>; awards XP/CC/levels/badges/streak only on first completion. GET me and GET :lessonId for reads.</p>
              </div>
              <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">Community — <Kbd>/api/threads</Kbd> + SSE</p>
                <p className="mt-2 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">Cursor feed (<Kbd>?lessonId&sort&limit&before</Kbd>), SSE <Kbd>/stream?lessonId</Kbd> with <Kbd>: heartbeat</Kbd> every 25s, upvote toggle+clamp, asker-only accept, deduped reports. In-process pub/sub via <Kbd>utils/communityEvents</Kbd>.</p>
              </div>
              <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">Users — <Kbd>/api/users</Kbd> · Leaderboard · Economy · AI</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                  <li><Kbd>PATCH /users/me</Kbd> + <Kbd>POST /users/me/avatar</Kbd> (Appwrite via multer 2MB, 501 until configured) + <Kbd>GET /users/u/:username</Kbd> (email never leaked, private hides stats).</li>
                  <li><Kbd>GET /leaderboard?limit&offset&page</Kbd> (onboardingCompleted, public, sort xp desc + createdAt asc) with viewer rank even when off-page.</li>
                  <li><Kbd>GET /economy/me</Kbd> · <Kbd>PATCH /economy/daily-goal</Kbd> · <Kbd>POST /economy/hearts/consume|refill</Kbd> · <Kbd>POST /economy/freeze/buy</Kbd>.</li>
                  <li><Kbd>GET /ai/status</Kbd> · <Kbd>POST /ai/help</Kbd> (20/m limit, budget 20/day, cached, never leaks <Kbd>solution</Kbd>).</li>
                </ul>
              </div>
              <div className="rounded-[10px] border-2 border-[#bbe7fc] bg-[#e6f4ff] px-3 py-2">
                <p className="font-codingo-sans text-[12px] font-bold leading-[1.5] text-spark-blue">
                  Every non-health route goes through <Kbd>requireDb</Kbd> — if Mongo is down the backend returns <Kbd>503 Database not connected</Kbd> instead of hanging.
                </p>
              </div>
            </div>
          </section>

          {/* Data */}
          <section id="data" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Database className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Data models
            </h2>
            <p className="mt-2 font-codingo-sans text-[13px] font-medium leading-[1.6] text-pencil-gray">
              All Mongoose. <Kbd>username/email</Kbd> unique with collation <Kbd>en strength 2</Kbd> for case-insensitive dedupe; <Kbd>googleId</Kbd> sparse unique; progress unique on <Kbd>{"{userId,lessonId}"}</Kbd>.
            </p>
            <div className="mt-4 grid gap-3">
              <Card className="p-4">
                <p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-eager-green">User</p>
                <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.6] text-pencil-gray">
                  <Kbd>username 3–30 / email / password select:false / googleId / name / avatar / avatarFileId / bio≤160 / isPrivate</Kbd> · <Kbd>xp / level / streak{"{count,lastActiveDate}"} / timezone Asia/Kolkata</Kbd> · <Kbd>badges[] / age 13–80 / country / countryCode / language / onboardingCompleted</Kbd> · <Kbd>cc 50 / hearts 3 / heartsUpdatedAt / dailyGoalXp 50 / dailyXp / dailyXpDate YYYY-MM-DD / freezes</Kbd> + timestamps. Extra indexes on <Kbd>{"{xp:-1,createdAt:1}"}</Kbd> for leaderboard.
                </p>
              </Card>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="p-4"><p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">Course → Unit → Lesson</p><p className="mt-1 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray"><Kbd>course.order / unit{"{courseId,order}"} / lesson{"{unitId,order,xpReward 10}"}</Kbd></p></Card>
                <Card className="p-4"><p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">Exercise</p><p className="mt-1 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray"><Kbd>{"{lessonId, type 7-enum, prompt, content Mixed, solution Mixed, explanation, hints[]}"}</Kbd></p></Card>
                <Card className="p-4"><p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">Progress · XPEvent</p><p className="mt-1 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray"><Kbd>{"{userId,lessonId, status, score, bestScore, attempts, firstTry, completedAt}"}</Kbd> + <Kbd>{"{userId,lessonId?,source,amount}"}</Kbd></p></Card>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="p-4"><p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">Thread · Reply · Report</p><p className="mt-1 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray"><Kbd>{"{lessonId?,authorId,title,body, votes, upvotedBy[], replyCount, acceptedReplyId}"}</Kbd> · <Kbd>{"{threadId,authorId,body,isAi,isAccepted}"}</Kbd> · <Kbd>{"{targetType, targetId, reporterId, reason}"}</Kbd></p></Card>
                <Card className="p-4"><p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">AiUsage · AiCache</p><p className="mt-1 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray"><Kbd>{"{userId, day YYYY-MM-DD, count}"}</Kbd> per user/day. <Kbd>{"{key sha256, answer, provider, modelName}"}</Kbd> global.</p></Card>
                <Card className="p-4"><p className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.04em] text-charcoal">Auth guard</p><p className="mt-1 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">Validators in <Kbd>src/validators/auth.ts</Kbd> (Zod) plus inline Zod per route; JWT in <Kbd>codingo_token</Kbd> httpOnly cookie.</p></Card>
              </div>
            </div>
            <div className="mt-3">
              <CodeBlock
                code={`Course 1──M Unit 1──M Lesson 1──M Exercise
User 1──M Progress M──1 Lesson
User 1──M XPEvent
User 1──M Thread 1──M Reply
AiUsage (per user/day) · AiCache (global, sha256)`}
              />
            </div>
          </section>

          {/* Offline */}
          <section id="offline" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Globe className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Offline & PWA
            </h2>
            <p className="mt-2 font-codingo-sans text-[14px] font-medium leading-[1.6] text-pencil-gray">
              Progress is never lost when a tab is closed mid-lesson. Every layer is built to survive a dropped connection.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <h3 className="font-codingo-sans text-[13px] font-black text-charcoal">IndexedDB v3 — four stores</h3>
                <ul className="mt-2 space-y-1 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">
                  <li><Kbd>progress</Kbd> <Kbd>key userId:lessonId</Kbd> — authoritative docs</li>
                  <li><Kbd>meta userId</Kbd> — cached <Kbd>{"{xp,level,streak,badges,lastSync}"}</Kbd></li>
                  <li><Kbd>pending …:ts:rand</Kbd> — offline queue drained when back online</li>
                  <li><Kbd>lesson_drafts userId:lessonId</Kbd> — runner resume (idx + answers + checked + firstTryCorrect)</li>
                </ul>
                <p className="mt-2 font-codingo-sans text-[12px] font-medium text-pencil-gray">Module: <Kbd>lib/progressDb.js</Kbd> · store: <Kbd>stores/progressStore.js</Kbd> (hydrate → fetch → merge pending → syncPending).</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-codingo-sans text-[13px] font-black text-charcoal">Save flow</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">
                  <li>Optimistic write to memory + <Kbd>putProgress</Kbd> instantly.</li>
                  <li><Kbd>POST /api/progress</Kbd> — on success replace with server doc; on fail push to <Kbd>pending</Kbd> and keep optimistic.</li>
                  <li><Kbd>syncPending</Kbd> on reconnect drains pending; new fetches never clobber pending completions.</li>
                  <li>Drafts persist on every 300ms tick plus <Kbd>beforeunload / visibilitychange / pagehide</Kbd>; back button shows Exit confirm modal.</li>
                </ol>
              </Card>
            </div>
            <div className="mt-3 rounded-[12px] border-2 border-charcoal bg-charcoal p-4">
              <p className="font-codingo-sans text-[13px] font-bold leading-[1.5] text-paper-white">
                Try it: start a lesson, close the tab on exercise 3, reopen — you resume exactly at 3. Go airplane-mode, complete it, see “Saved offline — will sync”, then reconnect.
              </p>
            </div>
          </section>

          {/* Runner */}
          <section id="runner" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Terminal className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Code runner
            </h2>
            <p className="mt-2 font-codingo-sans text-[14px] font-medium leading-[1.6] text-pencil-gray">
              JavaScript runs sandboxed in <Kbd>workers/jsRunner.worker.js</Kbd> via <Kbd>lib/runner/runJS</Kbd> — timeout 2s, output cap 10KB. Python is stubbed for Pyodide lazy-load. Comparison is <Kbd>trim + CRLF normalize</Kbd>.
            </p>
            <div className="mt-3">
              <CodeBlock
                code={`// lib/runner — runCode picks the adapter
await runCode({ code, language: "javascript", timeout: 2000 })
// → { output, error, timedOut, truncated }
compareOutput(actual, expected) // trim + \\r\\n→\\n
// Python today:
// → { notImplemented: true, error: "Python runner not yet loaded..." }`}
              />
            </div>
            <div className="mt-3 rounded-[10px] border-2 border-[#bbe7fc] bg-[#e6f4ff] px-3 py-2">
              <p className="font-codingo-sans text-[12px] font-bold leading-[1.5] text-spark-blue">Pluggable by design — adding a new language is a new branch in <Kbd>runCode</Kbd> without touching any route.</p>
            </div>
          </section>

          {/* Design */}
          <section id="design" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Palette className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Design system
            </h2>
            <p className="mt-2 font-codingo-sans text-[13px] font-medium leading-[1.6] text-pencil-gray">
              Single source <Kbd>DESIGN.md</Kbd> → <Kbd>app/globals.css @theme</Kbd>. One saturated green owns “correct/progress”, one blue owns “interactive” — everything else recedes.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <h3 className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.05em] text-charcoal">Palette</h3>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <span className="flex flex-col items-center gap-1 rounded-[10px] border-2 border-charcoal bg-eager-green px-2 py-3 font-codingo-sans text-[11px] font-black text-paper-white">#58cc02</span>
                  <span className="flex flex-col items-center gap-1 rounded-[10px] border-2 border-faded-gray bg-storybook-green px-2 py-3 font-codingo-sans text-[11px] font-black text-charcoal">#d7ffb8</span>
                  <span className="flex flex-col items-center gap-1 rounded-[10px] border-2 border-faded-gray bg-spark-blue px-2 py-3 font-codingo-sans text-[11px] font-black text-paper-white">#1cb0f6</span>
                  <span className="rounded-[10px] border-2 border-faded-gray bg-paper-white px-2 py-2 text-center font-codingo-sans text-[11px] font-bold text-charcoal">Charcoal #4b4b4b</span>
                  <span className="rounded-[10px] border-2 border-faded-gray bg-[#777777] px-2 py-2 text-center font-codingo-sans text-[11px] font-bold text-paper-white">Pencil #777</span>
                  <span className="rounded-[10px] border-2 border-faded-gray bg-[#afafaf] px-2 py-2 text-center font-codingo-sans text-[11px] font-bold text-paper-white">Faded #afafaf</span>
                </div>
                <p className="mt-3 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">Deep Leaf <Kbd>#58a700</Kbd> and Pale Sky <Kbd>#bbe7fc</Kbd> are the only shadows — as <Kbd>box-shadow: 0 4px 0</Kbd> press edges.</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-codingo-sans text-[12px] font-black uppercase tracking-[0.05em] text-charcoal">Rules</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">
                  <li>12px radius on every button/pill/nav item, 2px borders — no gradients, no glass.</li>
                  <li>Body stays <Kbd>#777777 @ 500</Kbd>; only headings/fills/footer may be <Kbd>#58cc02</Kbd>.</li>
                  <li>Links/outline CTA text only in <Kbd>#1cb0f6</Kbd>; hover is 250ms <Kbd>ease-smooth-out</Kbd>.</li>
                  <li>Base 4px scale: 8/12/16/24/32/40/48/64/80/96. Max content 1200px.</li>
                </ul>
                <p className="mt-2 font-codingo-sans text-[12px] font-bold text-pencil-gray">Fonts: Nunito 800/900 display → <Kbd>--font-feather</Kbd>, Nunito Sans 500/700 body → <Kbd>--font-codingo-sans</Kbd>.</p>
              </Card>
            </div>
          </section>

          {/* Env */}
          <section id="env" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Settings2 className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Environment
            </h2>
            <div className="mt-4 overflow-hidden rounded-[12px] border-2 border-faded-gray">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead className="bg-[#f8f8f7]">
                    <tr>
                      <th className="px-3 py-2.5 font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-pencil-gray">Variable</th>
                      <th className="px-3 py-2.5 font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-pencil-gray">Default</th>
                      <th className="px-3 py-2.5 font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-pencil-gray">Where</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-faded-gray/30 font-codingo-sans text-[13px]">
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">MONGODB_URI</td><td className="px-3 py-2 text-pencil-gray">mongodb://localhost:27017/codingo</td><td className="px-3 py-2 text-pencil-gray">backend — yes in prod</td></tr>
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">JWT_SECRET</td><td className="px-3 py-2 text-pencil-gray">—</td><td className="px-3 py-2 text pencils-gray font-bold text-charcoal">backend — required</td></tr>
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">FRONTEND_URL</td><td className="px-3 py-2 text-pencil-gray">http://localhost:3000</td><td className="px-3 py-2 text-pencil-gray">backend — CSV allowlist</td></tr>
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">COOKIE_DOMAIN</td><td className="px-3 py-2 text-pencil-gray">(none)</td><td className="px-3 py-2 text-pencil-gray">backend — e.g. codingo.synax.me</td></tr>
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">GOOGLE_CLIENT_ID</td><td className="px-3 py-2 text-pencil-gray">(none → 501)</td><td className="px-3 py-2 text-pencil-gray">backend + NEXT_PUBLIC_GOOGLE_CLIENT_ID on frontend</td></tr>
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">GROQ_API_KEY / GROQ_MODEL</td><td className="px-3 py-2 text-pencil-gray">openai/gpt-oss-20b</td><td className="px-3 py-2 text-pencil-gray">backend — AI primary</td></tr>
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">OPENROUTER_API_KEY / MODEL</td><td className="px-3 py-2 text-pencil-gray">llama-3.3-70b:free</td><td className="px-3 py-2 text-pencil-gray">backend — fallback</td></tr>
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">AI_DAILY_LIMIT / AI_AUTO_REPLY_DELAY_MS</td><td className="px-3 py-2 text-pencil-gray">20 · 180000 (3m)</td><td className="px-3 py-2 text-pencil-gray">backend</td></tr>
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">APPWRITE_* (4 keys)</td><td className="px-3 py-2 text-pencil-gray">(all required together)</td><td className="px-3 py-2 text-pencil-gray">backend — avatar upload</td></tr>
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">BACKEND_URL / NEXT_PUBLIC_API_URL</td><td className="px-3 py-2 text-pencil-gray">http://localhost:4000</td><td className="px-3 py-2 text-pencil-gray">frontend — rewrite target (BACKEND_URL server-only)</td></tr>
                    <tr><td className="px-3 py-2 font-mono text-[12px] font-bold text-charcoal">NEXT_PUBLIC_SITE_URL</td><td className="px-3 py-2 text-pencil-gray">VERCEL_URL → localhost</td><td className="px-3 py-2 text-pencil-gray">frontend — canonical + OG</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Setup */}
          <section id="setup" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Rocket className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Setup
            </h2>
            <div className="mt-3">
              <CodeBlock
                code={`git clone https://github.com/user-synax/codingo.git
cd codingo

# backend — Bun 1.3.14 needs MONGODB_URI + JWT_SECRET
cd backend && bun install
# create backend/.env — see table above
bun dev                    # http://localhost:4000

# new shell — frontend
cd ../frontend && bun install
# optional: frontend/.env.local (NEXT_PUBLIC_API_URL etc.)
bun dev                    # http://localhost:3000`}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <h3 className="font-codingo-sans text-[13px] font-black text-charcoal">Seed the course</h3>
                <div className="mt-2">
                  <CodeBlock code={`cd backend\nbun src/seed/seed.ts --list\nbun src/seed/seed.ts --course js-from-zero`} />
                </div>
                <p className="mt-2 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">Scoped per course and upserted: only the selected course is written, existing lessons keep their <Kbd>_id</Kbd>, and learner progress survives.</p>
              </Card>
              <Card className="p-4">
                <h3 className="font-codingo-sans text-[13px] font-black text-charcoal">Build</h3>
                <div className="mt-2">
                  <CodeBlock code={`# backend\nbun run build   # tsc → dist/\nbun start\n# frontend\nnpx next build\nnpx next start`} />
                </div>
                <p className="mt-2 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">Frontend on Vercel honors <Kbd>BACKEND_URL</Kbd>. Backend on Render needs <Kbd>trust proxy 1</Kbd> already set.</p>
              </Card>
            </div>
          </section>

          {/* Roadmap */}
          <section id="roadmap" className="mt-10 scroll-mt-[84px]">
            <h2 className="flex items-center gap-2 font-feather text-[24px] font-black tracking-[-0.02em] text-charcoal">
              <Clock3 className="h-5 w-5 text-eager-green" strokeWidth={2} aria-hidden="true" /> Roadmap
            </h2>
            <div className="mt-4 overflow-hidden rounded-[12px] border-2 border-faded-gray">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-left">
                  <thead className="bg-[#f8f8f7]">
                    <tr>
                      <th className="px-4 py-2.5 font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-pencil-gray">Milestone</th>
                      <th className="px-4 py-2.5 font-codingo-sans text-[11px] font-black uppercase tracking-[0.05em] text-pencil-gray">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-faded-gray/30 font-codingo-sans text-[13px]">
                    <tr><td className="px-4 py-3 font-bold text-charcoal">Foundation — monorepo, DESIGN.md, auth, landing</td><td className="px-4 py-3"><Badge tone="green">Done</Badge></td></tr>
                    <tr><td className="px-4 py-3 font-bold text-charcoal">Lesson engine — 7 types, Monaco, Worker, drafts, offline queue, confetti</td><td className="px-4 py-3"><Badge tone="green">Done</Badge></td></tr>
                    <tr><td className="px-4 py-3 font-bold text-charcoal">Content — JS from Zero (30 lessons, 5 units)</td><td className="px-4 py-3"><Badge tone="green">Done</Badge></td></tr>
                    <tr><td className="px-4 py-3 font-bold text-charcoal">Gamification — XP, levels, streak+freeze, hearts, CC, badges, daily goal, leaderboard</td><td className="px-4 py-3"><Badge tone="green">Done</Badge></td></tr>
                    <tr><td className="px-4 py-3 font-bold text-charcoal">Community & AI — threads/SSE, hint-first Groq/OpenRouter, auto first reply, budget+cache</td><td className="px-4 py-3"><Badge tone="green">Done</Badge></td></tr>
                    <tr><td className="px-4 py-3 font-bold text-charcoal">Polish — PWA, legal pages, SEO/sitemap/robots/OG, 3D button edge, motion</td><td className="px-4 py-3"><Badge tone="green">Done</Badge></td></tr>
                    <tr><td className="px-4 py-3 font-bold text-charcoal">Launch — perf pass, moderation tooling, soft launch</td><td className="px-4 py-3"><Badge tone="blue">Next</Badge></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-3 rounded-[12px] border-2 border-faded-gray bg-paper-white p-4">
              <p className="font-codingo-sans text-[13px] font-bold text-charcoal">Post-MVP ideas from PRD</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-codingo-sans text-[13px] font-medium leading-[1.5] text-pencil-gray">
                <li>Second language (Python Pyodide stub exists — lazy-load planned).</li>
                <li>Weekly leagues, study groups, push reminders, voice tutor.</li>
                <li>Server-side solution verification before ranked leagues (client runner is trusted for MVP).</li>
              </ul>
            </div>
          </section>

          {/* Closing */}
          <div className="mt-10 rounded-[12px] border-2 border-eager-green bg-storybook-green p-6">
            <h3 className="font-feather text-[20px] font-black leading-none tracking-[-0.02em] text-charcoal">Want to build with this?</h3>
            <p className="mt-2 font-codingo-sans text-[14px] font-medium leading-[1.6] text-charcoal">
              Read <Kbd>PRD.md</Kbd> for product intent, <Kbd>DESIGN.md</Kbd> for visual law, and <Kbd>docs.md</Kbd> for the full reference. Questions — open an issue on GitHub, or say hi at the footer of the landing page.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://github.com/user-synax/codingo"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-[12px] border-2 border-charcoal bg-charcoal px-4 py-2.5 font-codingo-sans text-[13px] font-black text-paper-white"
              >
                <ExternalLink className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> View on GitHub
              </a>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-[12px] border-2 border-eager-green bg-eager-green px-4 py-2.5 font-codingo-sans text-[13px] font-black text-paper-white shadow-[0_4px_0_var(--color-deep-leaf)]"
              >
                Start learning <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <p className="mt-8 border-t-2 border-faded-gray pt-4 font-codingo-sans text-[12px] font-medium leading-[1.5] text-pencil-gray">
            Last updated April 2026 · Source-checked against the running codebase. If something here disagrees with <Kbd>frontend/</Kbd> or <Kbd>backend/src/</Kbd>, the code wins — please open a PR against <Kbd>docs.md</Kbd>.
          </p>
        </main>
      </div>

      {/* Footer band */}
      <footer className="mt-8 border-t-2 border-[#3d9100] bg-eager-green">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-codingo-sans text-[13px] font-bold leading-[1.4] text-paper-white">
            Made with care by <span className="font-black">Ayush</span> · <a href="https://github.com/user-synax" target="_blank" rel="noreferrer" className="underline decoration-2 underline-offset-2">user-synax</a>
          </p>
          <nav className="flex flex-wrap gap-3 font-codingo-sans text-[13px] font-bold text-[#d7ffb8]">
            <Link href="/" className="hover:text-paper-white hover:underline">Home</Link>
            <Link href="/docs" className="text-paper-white">Docs</Link>
            <Link href="/privacy" className="hover:text-paper-white">Privacy</Link>
            <Link href="/terms" className="hover:text-paper-white">Terms</Link>
            <Link href="/policy" className="hover:text-paper-white">Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
