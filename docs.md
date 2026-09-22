# Codingo — Documentation

> **Project:** Codingo — a free, Duolingo-style web app for learning programming
> **Domain:** codingo.synax.me
> **Version:** 1.1
> **Owner:** Ayush — [github.com/user-synax](https://github.com/user-synax)
> **Status:** Active development
> **Docs site:** [/docs](/docs) — static, public, no login required

---

## 1. Table of Contents

- [2. Project Overview](#2-project-overview)
- [3. Tech Stack](#3-tech-stack)
- [4. Monorepo Structure](#4-monorepo-structure)
- [5. Frontend Architecture](#5-frontend-architecture)
- [6. Backend Architecture](#6-backend-architecture)
- [7. Database & Data Models](#7-database--data-models)
- [8. Authentication & Security](#8-authentication--security)
- [9. Learning Path & Content](#9-learning-path--content)
- [10. Gamification, Economy & Progress](#10-gamification-economy--progress)
- [11. AI Doubt Helper & Community](#11-ai-doubt-helper--community)
- [12. Offline, Caching & Sync](#12-offline-caching--sync)
- [13. Code Execution](#13-code-execution)
- [14. Design System](#14-design-system)
- [15. Environment Variables](#15-environment-variables)
- [16. Development Setup](#16-development-setup)
- [17. Key Files Quick Reference](#17-key-files-quick-reference)
- [Appendix: Milestones & Open Questions](#appendix-milestones--open-questions)

---

## 2. Project Overview

Codingo teaches programming through short, gamified lessons inspired by Duolingo:

- **Bite-sized lessons** — 2–5 minutes each, 5–8 exercises per lesson
- **Real code in the browser** — JavaScript runs sandboxed in a Web Worker; Python via Pyodide is lazy-load planned
- **Gamification** — XP, levels, streaks (Asia/Kolkata), daily goals, hearts, Codingo Cash (CC), badges
- **Community per lesson** — threaded Q&A with upvotes, accepted answers, reporting, and live SSE updates
- **AI first responder** — hint-first tutor (Groq primary, OpenRouter fallback), Hinglish-aware, 20/day budget, cached
- **Offline-first progress** — IndexedDB caches every save; pending queue syncs when back online; lesson drafts resume where you left
- **PWA** — `sw.js`, `site.webmanifest`, offline page, `RegisterSW` + `InstallApp` + `OfflineView`
- **100% free** — no hearts paywall at MVP, no paywalls ever; client-side execution keeps infra cost near zero

Monorepo: `frontend/` (Next.js 16 App Router, port 3000) and `backend/` (Express on Bun, port 4000) under one repo.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript everywhere (frontend `.js` with JSDoc + TS checks, backend strict TS) |
| **Runtime / PM** | Bun v1.3.14 |
| **Frontend** | Next.js 16.3.5 App Router (React 19.2.8), Tailwind CSS v4, shadcn/ui (Radix Dialog/Sheet), Zustand |
| **Fonts** | Nunito 800/900 → `--font-feather` (display), Nunito Sans 500/700 → `--font-codingo-sans` (body) via `next/font` |
| **Code Editor** | `@monaco-editor/react` for write-code exercises |
| **Auth (client)** | `@react-oauth/google` + JWT httpOnly cookie `codingo_token` |
| **Backend** | Express 4, Bun + TypeScript ESM, `helmet`, `cors`, `cookie-parser`, `express-rate-limit` |
| **Database** | MongoDB + Mongoose 8 |
| **Auth (server)** | `jsonwebtoken`, `bcryptjs` (10 rounds), `google-auth-library` for ID-token verify |
| **Validation** | Zod (backend), inline (frontend) |
| **Storage (avatars)** | Appwrite Storage via `node-appwrite` + `multer` (optional, graceful 501 until configured) |
| **AI** | Provider-agnostic OpenAI-compatible layer — Groq primary, OpenRouter fallback, cached, rate-limited |
| **Code Runner** | Web Worker (`workers/jsRunner.worker.js`) with timeout + output cap; `lib/runner` adapter |
| **Offline** | IndexedDB (`lib/progressDb.js` v3, 4 stores), Zustand `stores/progressStore.js` |
| **Deployment** | Frontend → Vercel (`BACKEND_URL` rewrite), Backend → Render/Bun host, DB → MongoDB Atlas |

---

## 4. Monorepo Structure

```
/ (repo root)
├── frontend/                 # Next.js 16 App Router — port 3000
│   ├── app/
│   │   ├── layout.js         # Root layout — fonts, metadata, RegisterSW, OG, PWA manifest
│   │   ├── page.js           # Landing — Navbar/Hero/Features/.../Footer + JSON-LD
│   │   ├── globals.css       # Tailwind @theme, CSS vars, motion tokens, button press-edge
│   │   ├── sitemap.js        # /sitemap.xml (canonical + /docs, /privacy, /terms, /policy)
│   │   ├── robots.js         # /robots.txt
│   │   ├── proxy.js          # Edge proxy — redirects authed guests / guards /app
│   │   ├── next.config.mjs   # /api/* → BACKEND_URL rewrite, sw.js no-cache header
│   │   ├── (auth)/           # login, signup, forgot-password — AuthLayout
│   │   ├── onboarding/       # 3-step wizard — OnboardingLayout
│   │   ├── app/              # Authenticated shell — AppLayout (Sidebar + BottomNav)
│   │   │   ├── page.js       # Dashboard — XP/streak/level + path preview
│   │   │   ├── learn/        # Path + [lessonId] runner
│   │   │   ├── community/    # Feed + [threadId] detail
│   │   │   ├── leaderboard/  # Global XP board
│   │   │   ├── profile/      # Self profile
│   │   │   └── settings/     # Edit profile (name/bio/country/timezone/privacy/avatar)
│   │   ├── docs/             # /docs — static documentation site (this file rendered)
│   │   ├── u/[username]/     # Public showcase — no login required
│   │   ├── offline/          # Offline fallback page
│   │   ├── privacy/ terms/ policy/ # Legal pages via components/legal/LegalPage
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ui/               # Button, Input, Label, Sheet (shadcn + 3D press edge)
│   │   ├── landing/          # Navbar, Hero, Features, LearningPath, ExerciseTypes, Community, Stats, CTA, Footer
│   │   ├── auth/             # AuthCard, SignupForm, LoginForm, GoogleIcon
│   │   ├── onboarding/       # OnboardingWizard, LanguageGrid, CountrySelect
│   │   ├── app/              # Sidebar, BottomNav
│   │   ├── lesson/           # LessonRunner, LessonProgressBar, Confetti, AiHelper
│   │   ├── exercises/        # MultipleChoice, FillBlank, ArrangeBlocks, PredictOutput, FixBug, WriteCode, AiPrompt
│   │   ├── learn/            # LearnPathClient — vertical skill path
│   │   ├── community/        # Thread list, composer, reply, vote, SSE hook
│   │   ├── legal/            # LegalPage
│   │   ├── pwa/              # RegisterSW, InstallApp, OfflineView
│   │   ├── progress/         # ProgressHydrator
│   │   ├── profile/          # ShareButton
│   │   └── settings/         # SettingsForm
│   ├── lib/
│   │   ├── api.js            # API_BASE + apiFetch + all typed helpers (auth/courses/lessons/progress/threads/ai/users/leaderboard)
│   │   ├── auth.js           # getCurrentUser() — server-only cookie → GET /api/auth/me
│   │   ├── site.js           # siteUrl(), SITE_NAME/TAGLINE/DESCRIPTION, OG_IMAGE
│   │   ├── level.js          # getLevelForXp / getXpForLevel / getXpProgress (mirrors backend)
│   │   ├── badges.js         # BADGE_DEFS + ALL_BADGES (6 badges)
│   │   ├── countries.js      # 230+ countries + DEFAULT_COUNTRY (IN)
│   │   ├── timezones.js      # IANA list for settings
│   │   ├── utils.js          # cn() — clsx + tailwind-merge
│   │   ├── appwrite.js       # Avatar stub — null until env set
│   │   ├── sound.js          # playCorrect/Wrong/Complete + mute toggle
│   │   ├── shuffle.js        # Shuffle helper for options
│   │   ├── progressDb.js     # IndexedDB v3 — progress/meta/pending/drafts (see §12)
│   │   └── runner/           # runJS / runCode / compareOutput — Worker sandbox
│   ├── stores/
│   │   └── progressStore.js  # Zustand global progress — IDB-first, network-revalidates, offline queue
│   ├── workers/
│   │   └── jsRunner.worker.js # Sandboxed JS eval — captures console.log, times out
│   ├── public/
│   │   ├── sw.js             # Service worker — cache shell, stale-while-revalidate
│   │   ├── site.webmanifest, apple-touch-icon.png, android-chrome-*.png, favicon.ico
│   │   ├── og-image.png, correct.mp3 / wrong.mp3 / complete.mp3
│   │   └── ...
│   └── package.json
├── backend/                  # Express API — port 4000
│   ├── src/
│   │   ├── index.ts          # Connect DB → createApp() → listen + SIGINT/SIGTERM shutdown
│   │   ├── app.ts            # Express factory — trust proxy 1, helmet, parsers, CORS allowlist, /api/health, requireDb, routers, 404 + error handler
│   │   ├── config/
│   │   │   ├── env.ts        # All env + isGoogleConfigured / isAppwriteConfigured
│   │   │   └── db.ts         # connectDb / disconnectDb (Mongoose)
│   │   ├── routes/
│   │   │   ├── auth.ts       # register/login/logout/me/onboarding/google
│   │   │   ├── courses.ts    # list courses + units/lessons
│   │   │   ├── lessons.ts    # lesson + exercises
│   │   │   ├── progress.ts   # upsert + XP/streak/badges/level/CC/dailyXp
│   │   │   ├── community.ts  # threads/replies/upvotes/accept/reports + SSE /stream
│   │   │   ├── users.ts      # PATCH /me, POST /me/avatar (Appwrite), GET /u/:username
│   │   │   ├── leaderboard.ts# global XP board ?limit&offset&page
│   │   │   ├── economy.ts    # GET /me, PATCH daily-goal, POST hearts/consume|refill, POST freeze/buy
│   │   │   └── ai.ts         # GET /status, POST /help (cached, budgeted)
│   │   ├── models/
│   │   │   ├── User.ts, Course.ts, Unit.ts, Lesson.ts, Exercise.ts, Progress.ts
│   │   │   ├── XPEvent.ts, Thread.ts, Reply.ts, Report.ts, AiUsage.ts, AiCache.ts
│   │   │   └── (indexes detailed in §7)
│   │   ├── middleware/
│   │   │   ├── auth.ts       # requireAuth / optionalAuth — reads codingo_token, verifies JWT, attaches req.userId
│   │   │   └── db.ts         # requireDb — 503 if Mongo not connected (except /health)
│   │   ├── validators/
│   │   │   └── auth.ts       # Zod: register/login/onboarding/googleCredential + TEMP_USERNAME_PREFIX
│   │   ├── utils/
│   │   │   ├── jwt.ts        # signJwt / cookieName / cookieOptions(NODE_ENV, COOKIE_DOMAIN) + clearCookieOptions
│   │   │   ├── streak.ts     # calcStreak (timezone Asia/Kolkata, freeze support)
│   │   │   ├── level.ts      # getLevelForXpPrecise / getXpForLevel — 100/250/450/700 then +150/level
│   │   │   ├── badges.ts     # checkBadges — first_lesson, five_lessons, perfect, streak_3/7, night_owl
│   │   │   ├── hearts.ts     # calcHeartsState/applyHeartsRegen, HEART_CAP 3, REGEN 4h, prices, CC_PER_LESSON 5 + perfect 10
│   │   │   ├── ai.ts         # chatComplete (Groq→OpenRouter fallback), isAiConfigured, TUTOR_SYSTEM, runnerPrompt/threadPrompt, budget, cache, scheduleAiFirstReply, ensureAiUser
│   │   │   └── communityEvents.ts # in-process pub/sub for SSE (emit/subscribe)
│   │   └── seed/
│   │       └── seed.ts       # Per-course seeder — `--course <slug>`, upserts so learner progress survives
│   └── package.json
├── docs.md                   # This file (also rendered at /docs)
├── PRD.md                    # Product requirements + roadmap
├── DESIGN.md                 # Visual source of truth
└── README.md                 # Landing docs + quick start
```

---

## 5. Frontend Architecture

### 5.1 Framework & Routing

- **Next.js 16.3.5 App Router** with React 19.2.8, server components by default, `"use client"` only for interactive islands
- **Tailwind CSS v4** via `@theme` in `app/globals.css` — Eager Green / Spark Blue tokens, 12px radius, motion tokens
- **Fonts** — `Nunito` (800/900 → `--font-feather`) + `Nunito_Sans` (500/700 → `--font-codingo-sans`) via `next/font`
- **Edge proxy** — `proxy.js` (`matcher: ["/", "/app/:path*", "/onboarding", "/login", "/signup", "/forgot-password"]`) does a fast cookie-existence check; real JWT verify happens in server layouts via `GET /api/auth/me`
- **Rewrite** — `next.config.mjs` maps `/api/:path*` → `${BACKEND_URL}/api/:path*` (defaults to `http://localhost:4000`) so the cookie stays first-party; no CORS on the browser path
- **SEO** — `layout.js` `metadataBase` + `openGraph`/`twitter` + `sitemap.js`/`robots.js` + JSON-LD `WebApplication` on `/`; every canonical comes from `lib/site.js` `siteUrl()` (explicit `NEXT_PUBLIC_SITE_URL` → `VERCEL_URL` → `localhost`)

### 5.2 Page Route Map

| Route | File | Auth | Description |
|---|---|---|---|
| `/` | `app/page.js` | Public (redirects if authed) | Landing — Navbar, Hero, Features, LearningPath, ExerciseTypes, Community, Stats, CTA, Footer |
| `/login` | `(auth)/login/page.js` | Guest | Email/password + Google button + forgot link |
| `/signup` | `(auth)/signup/page.js` | Guest | Username/email/password + Google + legal consent |
| `/forgot-password` | `(auth)/forgot-password/page.js` | Guest | Placeholder — directs to email reset |
| `/onboarding` | `onboarding/page.js` | Authed, `!onboardingCompleted` | 3-step wizard (profile → details → language) |
| `/app` | `app/app/page.js` | Authed+onboarded | Dashboard — XP, streak, level, daily goal, hearts/CC, frozen streaks, continue path |
| `/app/learn` | `app/app/learn/page.js` | Authed | Vertical skill path — `LearnPathClient` with course switcher + progress map |
| `/app/learn/[lessonId]` | `app/app/learn/[lessonId]/page.js` | Authed | Runner if not completed; read-only completed view with score + next lesson |
| `/app/community` | `app/app/community/page.js` | Authed | Question feed — `?lessonId&sort=new|top&before&limit` + composer + SSE live |
| `/app/community/[threadId]` | `app/app/community/[threadId]/page.js` | Authed | Thread + replies (accepted→votes→date), upvote/accept/report |
| `/app/leaderboard` | `app/app/leaderboard/page.js` | Authed | Global XP board — paginated `?page&limit`, `me` rank even when off-page |
| `/app/profile` | `app/app/profile/page.js` | Authed | Own profile — badges, stats, share |
| `/app/settings` | `app/app/settings/page.js` | Authed | `SettingsForm` — name/bio/avatar/country/timezone/privacy + danger zone |
| `/u/[username]` | `app/u/[username]/page.js` | Public | Public showcase — stats hidden when `isPrivate`; email never exposed |
| `/docs` | `app/docs/page.js` | Public | Static docs — this file rendered as a browsable site |
| `/privacy` `/terms` `/policy` | `app/privacy|terms|policy/page.js` | Public | `LegalPage` — wrapper around markdown/legal copy |
| `/offline` | `app/offline/page.js` | Public | Offline fallback shown by SW / `OfflineView` |

### 5.3 Key Components

**Layout**

| Component | File | Description |
|---|---|---|
| RootLayout | `app/layout.js` | Injects fonts, metadata, viewport `themeColor #58cc02`, mounts `RegisterSW` |
| AuthLayout | `app/(auth)/layout.js` | Centered card; redirects authed users to `/app` or `/onboarding` |
| OnboardingLayout | `app/onboarding/layout.js` | Full-screen centered card |
| AppLayout | `app/app/layout.js` | Fixed Sidebar (280px desktop) + BottomNav (mobile 4 items); hydrates `useProgressStore.fetchAll()` |

**Landing**

Navbar (sticky, logo, nav links, auth buttons, hamburger → `MobileMenu` Sheet), Hero (staggered `hero-reveal--1..5` + `HeroIllustration`), MobileMenu (shadcn Sheet from right), Features (3 pillars), LearningPath (node states), ExerciseTypes (7 cards), Community (AI+peer), Stats, CTA, Footer (green band `#58cc02`, links, GitHub, credit).

**Auth / Onboarding / App**

`AuthCard`, `SignupForm`/`LoginForm` (Zod-ish inline validation, field errors, Google button), `GoogleIcon`, `OnboardingWizard` (country search + `CountrySelect` + `LanguageGrid` — only `javascript` enabled), `Sidebar`/`BottomNav`, `LessonRunner`, `ProgressHydrator`.

**Lesson & Exercises**

`LessonRunner` — single-screen runner (§10), `LessonProgressBar`, `Confetti`, `AiHelper` (calls `POST /api/ai/help` with lesson/code context). Exercises: `MultipleChoice`, `FillBlank`, `ArrangeBlocks` (tap/drag), `PredictOutput`, `FixBug`, `WriteCode` (Monaco + `runCode`), `AiPrompt` (checklist — learner must ask + tick checks).

**Community**

`ThreadComposer`, `ThreadCard`, `ReplyComposer`, `ReplyItem`, `SortToggle`, SSE hook using `threadsStreamUrl()` + `withCredentials`.

**UI**

`Button` (`primary` green + `Deep Leaf` edge / `outline` white + `Pale Sky` edge, 12px radius, `codingo-btn*` in `globals.css`), `Input` (44px, Spark Blue focus), `Label` (bold 14px Charcoal), `Sheet`.

**PWA / Progress / Legal**

`RegisterSW` (registers `/sw.js`, `must-revalidate`), `InstallApp`, `OfflineView`, `ProgressHydrator` (IDB→Zustand→network), `ShareButton` (Web Share API → clipboard), `LegalPage`.

### 5.4 Library Modules

| Module | File | Description |
|---|---|---|
| `api.js` | `lib/api.js` | `API_BASE` (server: `BACKEND_URL` else `NEXT_PUBLIC_API_URL` else `localhost:4000`; browser: `""`), `apiFetch({timeoutMs 30s, AbortSignal, FormData aware})`, helpers: `registerUser`, `loginUser`, `fetchMe`, `logoutUser`, `googleSignIn`, `patchOnboarding`, `fetchCourses`, `fetchLesson`, `fetchProgressMe`, `saveProgress`, `fetchThreads`, `createThread`, `fetchThread`, `createReply`, `upvoteThread/Reply`, `acceptReply`, `reportContent`, `threadsStreamUrl`, `askAi`, `aiStatus`, `updateMe`, `uploadAvatarFile`, `fetchPublicProfile`, `fetchLeaderboard` |
| `auth.js` | `lib/auth.js` | `getCurrentUser()` — `cookies().toString()` → `GET /api/auth/me` `no-store` |
| `site.js` | `lib/site.js` | `siteUrl()` normalization, `SITE_NAME ("Codingo")`, `SITE_TAGLINE`, `SITE_DESCRIPTION`, `OG_IMAGE` |
| `level.js` | `lib/level.js` | `getLevelForXp(xp)` thresholds 0/100/250/450/700 then +150, `getXpForLevel`, `getXpProgress` |
| `badges.js` | `lib/badges.js` | `BADGE_DEFS` (first_lesson, five_lessons, perfect, streak_3, streak_7/week warrior, night_owl) |
| `countries.js` | `lib/countries.js` | 230+ entries, `DEFAULT_COUNTRY = IN` |
| `timezones.js` | `lib/timezones.js` | IANA list for settings timezone picker |
| `progressDb.js` | `lib/progressDb.js` | IndexedDB v3 — progress/meta/pending/drafts (see §12) |
| `runner/` | `lib/runner/index.js` | `runJS` (Worker sandbox, OUTPUT_LIMIT 10KB, timeout 2s) + `runCode` (python stub) + `compareOutput` (trim + `\r\n` normalize) |
| `utils.js` | `lib/utils.js` | `cn()` — `clsx` + `tailwind-merge` |
| `appwrite.js` | `lib/appwrite.js` | Avatar stub — returns `null` until backend Appwrite env set |
| `sound.js` | `lib/sound.js` | `playCorrect/Wrong/Complete`, `isMuted/toggleMuted` (localStorage + `/correct.mp3` etc.) |
| `shuffle.js` | `lib/shuffle.js` | Fisher–Yates for option shuffling |

### 5.5 State & Data Flow

- No Redux. **Zustand** `stores/progressStore.js` (`byLessonId`, `loading/syncing/error`, `hydratedFromCache`, `lastSync`, `pendingCount`, `isOffline`, `userId`, `userStats`) — methods: `setUserId`, `setProgress`, `hydrateFromCache`, `fetchAll`, `syncPending`, `save` (optimistic + IDB + pending queue), `clearCache`, `reset`.
- Hydration: `ProgressHydrator` + `AppLayout` call `fetchAll({userId})` → `hydrateFromCache` (instant IDB) → `fetch /api/progress/me` + `GET /api/auth/me` for `userId/stats` → merge pending local completions (never clobber optimistic) → cache to IDB → `syncPending()`.
- Saving: `LessonRunner` calls `progressStore.save({lessonId, score, completed, firstTry, correctCount, total})` → optimistic doc + `putProgress` → `POST /api/progress` → on ok replace with authoritative doc + cache + `removePendingForLesson`; on network fail → `addPending` + throw to show “Saved offline — will sync”.

---

## 6. Backend Architecture

### 6.1 Server & Framework

- **Bun + TypeScript ESM** (`"type":"module"`), **Express 4** — `src/index.ts` connects Mongoose, `createApp()` builds the pipeline, listens on `PORT` (default 4000), handles `SIGINT/SIGTERM`.
- `app.ts` pipeline: `trust proxy 1` (Render single hop) → `helmet()` → `cookieParser()` → `express.json({limit:"100kb"})` + `urlencoded` → CORS with `Set( FRONTEND_URL csv + https://codingo.synax.me + https://www.codingo.synax.me + localhost:3000 + 127.0.0.1:3000 )` — dev: allow all; prod: strict else `origin not allowed` → `GET /api/health` → `requireDb` for every other `/api/*` (503 fail-fast) → 8 routers → 404 → error handler (JSON parse guard, `status/statusCode` → `message`).

### 6.2 API Routes

All under `/api`. Cookies are `httpOnly` `codingo_token` (`sameSite:lax`, `secure` in prod, `domain=COOKIE_DOMAIN` when set, `maxAge 7d`). Rate limits use `express-rate-limit` + `trust proxy`.

| Method | Path | Auth | Rate | Description |
|---|---|---|---|---|
| `GET` | `/api/health` | No | — | `{ok, service, env}` — works even when DB down |
| `POST` | `/api/auth/register` | No | 20/15m | `{username, email, password}` → field errors 409 → bcrypt → create (xp 0 lv1 streak0 Asia/Kolkata) → JWT cookie → `{user, message}` |
| `POST` | `/api/auth/login` | No | 20/15m | `{email, password}` → 401 (also for Google-only accounts) → bcrypt → cookie → `{user}` |
| `POST` | `/api/auth/logout` | No | — | Clear cookie |
| `GET` | `/api/auth/me` | Yes | — | Returns `toPublicUser` + passive hearts regen + dailyXp view reset (timezone-aware) |
| `PATCH` | `/api/auth/onboarding` | Yes | — | Zod `{name 2–50, age 13–80, country, countryCode 2, language javascript, avatar url?, username?}` → `findByIdAndUpdate` → `{user}`; Google temp `google_user_*` names replaced here |
| `POST` | `/api/auth/google` | No | 20/15m | `{credential}` ID token → `OAuth2Client.verifyIdToken(audience=email_verified)` → 1) googleId match, 2) email auto-link, 3) create temp `google_user_*` + `googleId` → cookie → 201 if new else 200 `{user,isNewUser}`; 501 until `GOOGLE_CLIENT_ID` set |
| `GET` | `/api/courses` | No | — | Courses sorted `order 1` with `units` (sorted) each with `lessons` (sorted) |
| `GET` | `/api/courses/:courseId/units` | No | — | Alternative — units+lessons for one course |
| `GET` | `/api/lessons/:id` | Yes | — | Lesson by id with exercises ordered `order 1` |
| `POST` | `/api/progress` | Yes | — | `{lessonId, score 0–100, completed?, firstTry?, correctCount 0–20, total 1–20}` → `findOneAndUpdate upsert` → first-completion only: XP `5*correct +10+perfect5 capped total*5+15`, `XPEvent`, level/streak (with freeze), badges, CC `5+perfect10`, `dailyXp` (Asia/Kolkata `YYYY-MM-DD`) → `{progress, xpAwarded, ccAwarded, freezeUsed, newBadges, levelUp, streak, user{id,xp,level,streak,badges,cc,hearts,freezes,dailyGoalXp,dailyXp}}` |
| `GET` | `/api/progress/me` | Yes | — | All progress for current user |
| `GET` | `/api/progress/:lessonId` | Yes | — | Single lesson progress or `{progress:null}` |
| `GET` | `/api/threads` | Yes | read 200/m | `?lessonId&sort=new|top&limit 1–30&before ISO` cursor feed — `hasMore + nextCursor` |
| `POST` | `/api/threads` | Yes | write 30/m | `{title 5–120, body 10–2000, lessonId?}` → create → `emitCommunityEvent` + `scheduleAiFirstReply` → 201 `{thread}` |
| `GET` | `/api/threads/stream` | Yes | — | SSE — `?lessonId` filtered, `: heartbeat` every 25s, `connected` then `thread|reply` events |
| `GET` | `/api/threads/:id` | Yes | read 200/m | Thread + replies sorted `accepted first → votes desc → createdAt asc`, `canAccept` |
| `POST` | `/api/threads/:id/replies` | Yes | write 30/m | `{body 1–2000}` → `Reply.create` + `replyCount++` → SSE |
| `POST` | `/api/threads/:id/upvote` | Yes | write 30/m | Toggle `upvotedBy` + `votes` (+ clamp) → `{votes, upvoted}` |
| `POST` | `/api/threads/:id/accept` | Yes | write 30/m | Asker only — `{replyId}` → clears `isAccepted`, sets `acceptedReplyId` |
| `POST` | `/api/threads/replies/:replyId/upvote` | Yes | write 30/m | Toggle reply upvote |
| `POST` | `/api/threads/reports` | Yes | write 30/m | `{targetType thread|reply, targetId, reason 5–500}` → deduped 409 → 201 |
| `PATCH` | `/api/users/me` | Yes | — | `{name,bio≤160,country,countryCode,timezone,avatar url?,isPrivate?}` → `findByIdAndUpdate` |
| `POST` | `/api/users/me/avatar` | Yes | — | `multer` single `avatar` 2MB image → Appwrite upload via server SDK → `avatar + avatarFileId` → `{user}`; 501 until Appwrite env |
| `GET` | `/api/users/u/:username` | No | — | Public showcase — minimal when `isPrivate` (only `username,name,avatar,badges,createdAt`); email never exposed |
| `GET` | `/api/leaderboard` | Yes | 100/m | `?limit 1–100 default25&offset&page` → filter `onboardingCompleted + isPrivate != true` → `sort {xp:-1, createdAt:1}` → `{leaderboard[{rank,id,username,name,avatar,xp,level,streak,count,badges...}], total, limit, offset, page, totalPages, hasMore, nextOffset, prevOffset, me, meMeta{notRankedReason}}` |
| `GET` | `/api/economy/me` | Yes | 120/m | Regen-applied view `{cc, hearts, heartsCap 3, heartsUpdatedAt, regenInMs, fullInMs, regenMs 4h, dailyGoalXp, dailyXp, dailyProgress, dailyGoalCompleted, freezes, xp, level, streak, prices{heartSingle 20, heartFull 50, freeze 50}}` |
| `PATCH` | `/api/economy/daily-goal` | Yes | 60/m | `{dailyGoalXp 10..200}` (allowed 20/30/50/80/100, snaps) → `{dailyGoalXp}` |
| `POST` | `/api/economy/hearts/consume` | Yes | 60/m | Regen first → 403 if 0 hearts else `hearts-1` + regen timer reset if was full |
| `POST` | `/api/economy/hearts/refill` | Yes | 60/m | `{type single|full}` cost 20/50 CC → capped M403 402 400; returns `{hearts, cc, cost}` |
| `POST` | `/api/economy/freeze/buy` | Yes | 60/m | Cost 50 CC, max 5 held → 402/400 |
| `GET` | `/api/ai/status` | Yes | — | `{allowed, remaining, limit 20, configured}` |
| `POST` | `/api/ai/help` | Yes | 20/m | `{lessonId?,exerciseId?,question 1–1000,code ≤4000?}` → validates lesson/exercise, never sends `solution` → `cacheKey` (sha256 question+code+ids) → cached hit free → budget check 429 → `runnerPrompt` (lesson/exercise/learnerWork/question + `TUTOR_SYSTEM`) → `chatComplete` (Groq→OpenRouter, 400 tokens, 30s) → `setCachedAnswer` + `spendAiBudget` → `{answer,provider,cached,allowed,remaining,limit}`; 501/502 on misconfig/failure |

### 6.3 Middleware

- `middleware/auth.ts` — `requireAuth(req,res,next)` verifies `codingo_token` with `JWT_SECRET`, `req.userId + req.user`; `optionalAuth` never throws (for future public pages).
- `middleware/db.ts` — `requireDb` checks `mongoose.connection.readyState === 1` else `503 {message: Database not connected}`.
- Express `helmet()` + `cookieParser()` + `express.json({limit:"100kb"})` + `urlencoded` + CORS allowlist + rate limiters above.

### 6.4 Validators

`validators/auth.ts` (Zod):

| Schema | Fields |
|---|---|
| `registerSchema` | `username` 3–30 `/^[a-zA-Z0-9_.-]+$/`, `email`, `password` ≥6 |
| `loginSchema` | `email`, `password` |
| `onboardingSchema` | `name` 2–50, `age` 13–80, `country`, `countryCode` 2 upper, `language` `"javascript"` (only enabled), `avatar` url optional, `username` 3–30 (for Google temp rename) |
| `googleCredentialSchema` | `credential` non-empty string |
| `TEMP_USERNAME_PREFIX` | `"google_user_"` |

Other routes use inline Zod (progress `lessonId/score/completed/firstTry/correctCount/total`; community `title/body/lessonId`, `reply body`, `accept replyId`, `report`; `dailyGoalXp 10..200`; `refill type single|full`).

---

## 7. Database & Data Models

All Mongoose, `mongoose.models.X ?? mongoose.model`. Indexes noted matter for prod Atlas.

### 7.1 Models

#### User (`models/User.ts`)

| Field | Type | Default | Notes |
|---|---|---|---|
| `username` | String | required | 3–30 `/^[a-zA-Z0-9_.-]+$/`, unique collation `en strength 2` |
| `email` | String | required | lowercase, `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, unique collation `en strength 2` |
| `password` | String | optional `select:false` | `undefined` for Google-only until they set one |
| `googleId` | String | `null` | unique sparse `googleId:1` |
| `name` | String | required | display name |
| `avatar` | String | `undefined` | URL |
| `avatarFileId` | String | `null` | Appwrite file id |
| `bio` | String | `null` | ≤160 |
| `isPrivate` | Boolean | `false` | hides stats at `/u/:username` + leaderboard |
| `xp` | Number | `0` | all-time total |
| `level` | Number | `1` | `getLevelForXpPrecise(xp)` |
| `streak` | `{count, lastActiveDate}` | `{0,null}` | daily streak |
| `timezone` | String | `"Asia/Kolkata"` | used for streak+ dailyXp |
| `badges` | [String] | `[]` | `first_lesson` etc. |
| `age` | Number | `null` | 13–80 |
| `country` | String | `null` | full name |
| `countryCode` | String | `null` | ISO alpha-2 |
| `language` | String | `null` | `"javascript"` |
| `onboardingCompleted` | Boolean | `false` | gate |
| `cc` | Number | `50` | Codingo Cash |
| `hearts` | Number | `3` | 0..3 |
| `heartsUpdatedAt` | Date | `null` | regen epoch |
| `dailyGoalXp` | Number | `50` | 10..200 |
| `dailyXp` | Number | `0` | resets per `dailyXpDate`
| `dailyXpDate` | String | `null` | `YYYY-MM-DD` in user tz |
| `freezes` | Number | `0` | 0..99 (sell max 5 held in API) |
| timestamps | | | `createdAt`+`updatedAt` |
| indexes | | | `googleId sparse`, `username collation`, `email collation`, `{xp:-1,createdAt:1}`, `{onboardingCompleted,isPrivate,xp,createdAt}` |

#### Course / Unit / Lesson / Exercise

| Model | Fields |
|---|---|
| **Course** | `title*`, `language "javascript"`, `description*`, `order 0` |
| **Unit** | `courseId* ref Course`, `title*`, `description?`, `order 0` |
| **Lesson** | `unitId* ref Unit`, `title*`, `description?`, `order 0`, `xpReward 10` |
| **Exercise** | `lessonId* ref Lesson idx {lessonId,order}`, `type enum[multiple_choice,fill_blank,arrange,predict_output,fix_bug,write_code,ai_prompt]*`, `prompt*`, `content Mixed*`, `solution Mixed*`, `explanation*`, `hints [String]`, `order*` |

`content`/`solution` shapes per type — e.g. `multiple_choice {options, correctIndex}` / `fill_blank {code, blank, options}` / `arrange {blocks}` / `predict_output {snippet,options}` / `fix_bug {code, tests:[{expected}]}` / `write_code {starterCode, tests}` / `ai_prompt {checklist}`.

#### Progress (`models/Progress.ts`)

`userId* ref User`, `lessonId* ref Lesson`, `status enum[not_started|in_progress|completed] default not_started`, `score 0..100`, `bestScore 0..100`, `attempts min 0`, `firstTry boolean`, `completedAt Date|null`, timestamps. Unique `{userId,lessonId}`.

#### XPEvent (`models/XPEvent.ts`)

`userId* ref User`, `lessonId? ref Lesson`, `source "lesson_complete"|"exercise_first_try" etc.`, `amount`, timestamps — audit trail for XP.

#### Thread / Reply / Report

**Thread** — `lessonId? ref Lesson`, `authorId* ref User`, `title 5–120`, `body 10–2000`, `votes 0` + `upvotedBy [ObjectId]`, `replyCount 0`, `acceptedReplyId? ref Reply`.

**Reply** — `threadId* ref Thread`, `authorId* ref User`, `body 1–2000`, `votes 0` + `upvotedBy`, `isAccepted false`, `isAi false` (true only for Codingo AI first reply).

**Report** — `targetType thread|reply`, `targetId ObjectId`, `reporterId* ref User`, `reason 5–500`.

#### AiUsage / AiCache

**AiUsage** — `userId*`, `day YYYY-MM-DD` (from `ISO.slice(0,10)`), `count` — one doc per user per UTC day; daily 20 limit.

**AiCache** — `key sha256`, `answer`, `provider`, `modelName` — unlimited TTL; cache hits don't spend budget.

### 7.2 Relationships

```
Course 1—M Unit 1—M Lesson 1—M Exercise
User 1—M Progress M—1 Lesson
User 1—M XPEvent
User 1—M Thread 1—M Reply
User 1—M Report (reporterId)
User 1—1 AiUsage (per day)      Lesson —0/1→ Thread
AiCache (global, unscoped)
```

---

## 8. Authentication & Security

**Flows**

```
Register: POST /api/auth/register (Zod) → username/email collation pre-check → bcrypt 10 → User.create → signJwt {sub,username,email} → httpOnly cookie → 201 {user}
Login:    POST /api/auth/login (Zod) → findOne(email)+select +password collation → 401 if password missing (Google-only) → bcrypt.compare → cookie → 200 {user}
Google:   POST /api/auth/google (20/15m) → verifyIdToken(audience GOOGLE_CLIENT_ID, email_verified) → (a) googleId hit → sign-in (b) email hit → auto-link googleId + backfill name/avatar → save (c) else create temp google_user_* + googleId/name/avatar xp0 → cookie → 201/200 {user,isNewUser}; needsUsername = username startsWith google_user_
Me:       GET /api/auth/me (requireAuth) → calcHeartsState regen + dailyXp view reset → {user}
Onboard:  PATCH /api/auth/onboarding (requireAuth+Zod) → optional username dedup → findByIdAndUpdate → {user}; flips onboardingCompleted
Logout:   POST /logout → clearCookie
```

**JWT & Cookie**

- `jsonwebtoken` 7-day expiry, payload `{sub:userId, username, email}`, secret `JWT_SECRET`.
- `cookieName = "codingo_token"`, `cookieOptions()` = `httpOnly true, secure isProd, sameSite lax, maxAge 7d, path /, domain COOKIE_DOMAIN if set (split-domain deploy), `clearCookieOptions()` mirrors it.
- `trust proxy 1` so `express-rate-limit` sees the real IP behind Render's single hop.

**Guards**

- `proxy.js` fast cookie-existence → `/` `/login` `/signup` `/forgot-password` bounce authed to `/app`; guests to `/login` on `/app/*` + `/onboarding`. Real verify in server components via `getCurrentUser()`.
- `requireAuth` on every sensitive API; `requireDb` 503 when DB down; `helmet`, `cors` strict in prod, `json limit 100kb`, body syntax error → `Invalid JSON payload`, rate limit 20/15m auth.
- Google-only accounts can't login via password route — pointed to Google button.
- Collation `en strength 2` on username/email indexes + app checks prevents case-variant duplicates.

---

## 9. Learning Path & Content

**Structure**

`Course (order) → Unit (courseId, order) → Lesson (unitId, order, xpReward 10–20) → Exercise (lessonId, order, type, prompt, content, solution, explanation, hints[])`

**Seeded content** (`backend/src/seed/seed.ts` — `bun src/seed/seed.ts --course <slug>`, scoped + upserted per course so existing learner progress survives). Slugs: `js-from-zero` (30 lessons), `code-with-ai` (16), `python-from-zero` (40) — see `--list`.

The Python course is authored as data in `backend/src/seed/courses/pythonFromZero.ts` and walked by `seedCourseFromSpec`, so array order decides `order` and unit/lesson indices cannot drift. Because the browser runner cannot execute Python yet, that course uses only the exercise types that grade without it — `multiple_choice`, `fill_blank`, `arrange`, `predict_output`, `ai_prompt`. Run `bun run seed:validate` to check course data invariants without a database.

- Course: **JS from Zero** — `From zero to advanced — no prior code needed. Learn JavaScript from scratch with bite-sized lessons.` (`javascript`, order 0)
- 5 Units:

| Unit | Title | Lessons |
|---|---|---|
| 0 | Unit 1 — Fundamentals | What is Code?, Variables, Types, Operators, Template Literals, Checkpoint: Fundamentals |
| 1 | Unit 2 — Control Flow | If / Else, Comparisons & Logic, Switch & Ternary, For Loops, While Loops, Checkpoint: Control Flow |
| 2 | Unit 3 — Functions & Scope | Functions Basics, Parameters, Scope, Arrow Functions, Callbacks Intro, Checkpoint: Functions |
| 3 | Unit 4 — Data Structures | Arrays Basics, Array Methods, Objects Basics, Strings & Arrays, Errors & Debugging, Checkpoint: Data |
| 4 | Unit 5 — Async & Project | DOM Basics, Events, Timers & Callbacks, Promises, Async Await & Fetch, Mini Project: Todo App |

- 30 lessons × mixed 5–8 exercises. Gentle→code-heavy progression: early `multiple_choice/fill_blank/predict_output/arrange`, later `fix_bug/write_code/ai_prompt`.

**Exercise types**

| Type | UX | Validation |
|---|---|---|
| `multiple_choice` | 2–4 options | `answer === correctIndex` |
| `fill_blank` | `code` with `blank`, `options` | `answer === solution.answer` (string) |
| `arrange` | `blocks` tapped/dragged | `JSON.stringify(order) === JSON.stringify(solution.order)` |
| `predict_output` | `snippet` + options or free type | `trim(String(answer)) === trim(String(solution.answer))` |
| `fix_bug` | `code` editor, `tests:[{expected}]` | `runCode` output `compareOutput` against first expected; no error/timedOut |
| `write_code` | `starterCode`, `tests` | same as fix_bug |
| `ai_prompt` | Free-form `prompt` + `checklist` + “asked/usedExample” | `aiPromptReady` (prompt non-empty + asked + checks length match + every check tri-state) and `JSON.stringify(checks) === checklist` |

---

## 10. Gamification, Economy & Progress

**XP & Levels**

- Per-exercise `+5`, lesson bonus `+10`, perfect (100%) `+5`, capped `total*5+15`.
- First completion only (idempotent on replays) — `wasCompleted` guard.
- `XPEvent {userId, lessonId, source:"lesson_complete", amount}` per new completion.
- Levels from `utils/level.ts` — `0→1, 100→2, 250→3, 450→4, 700→5, then +150/level`; `getLevelForXpPrecise` mirrors on backend; frontend `lib/level.js` same thresholds plus `getXpProgress`.

**Streak**

- `utils/streak.ts` `calcStreak(user)` — compares `streak.lastActiveDate` vs today in `Asia/Kolkata`; increments on new day, holds on same day, resets on gap >1 unless `freezes>0` (consumes one freeze). `GET /api/auth/me` and `POST /api/progress` return streak; `GET /api/economy/me` + leaderboard show it.

**Daily Goal & Daily XP**

- `dailyGoalXp` per user (default 50, range 10..200, UI snaps 20/30/50/80/100). `PATCH /api/economy/daily-goal`.
- `dailyXp` + `dailyXpDate YYYY-MM-DD` tracked in user tz; resets view when day flips; `POST /api/progress` increments `dailyXp` on first completion for that day; `GET /api/economy/me` returns `dailyXp`, `dailyProgress (min 1, dailyXp/goal)`, `dailyGoalCompleted`.

**Codingo Cash (CC) & Hearts & Freezes**

- `cc` (default 50) — earned `CC_PER_LESSON 5 + CC_PERFECT_BONUS 10` on first completion; spent on hearts/freezes.
- `hearts` cap `3`, regen `4h` per heart (`HEART_REGEN_MS 14400000`), `heartsUpdatedAt` epoch; `calcHeartsState` / `applyHeartsRegen` passive calc (checked on `GET /me`, `POST /progress`, `GET /economy/me`, `POST hearts/consume|refill`).
- `POST /economy/hearts/consume` loses 1 heart (403 if 0). `POST /economy/hearts/refill {type single|full}` costs `20/50` CC.
- `freezes` (streak freeze) — `POST /economy/freeze/buy` costs `50` CC, max 5 held; consumed automatically by `calcStreak` on missed-day gap.

**Badges** (`utils/badges.ts` `checkBadges(user, {totalCompleted, isPerfect, now})`)

`first_lesson` (1st completion), `five_lessons` (5 total), `perfect` (100%), `streak_3` / `streak_7` (Week Warrior), `night_owl` (study after 22:00 local) — de-duped via `Set`.

**Progress model & saving**

- `Progress {userId, lessonId unique, status not_started|in_progress|completed, score 0–100, bestScore, attempts, firstTry, completedAt}`. `score>=80` or `completed true` flips to completed. `GET /progress/me` returns all; `GET /progress/:lessonId` nullable.
- Frontend `LessonRunner` handles `idx/answers/checked/firstTryCorrect`, `beforeunload` + `visibilitychange` + `pagehide` draft saves, `popstate` guard → `ExitConfirmModal`, then `progressStore.save` → optimistic IDB → `POST /api/progress` → optimistic retained on offline (see §12).

---

## 11. AI Doubt Helper & Community

**AI** (`utils/ai.ts`)

- Providers: `groq` (`https://api.groq.com/openai/v1`, `GROQ_MODEL default openai/gpt-oss-20b`) primary, `openrouter` (`https://openrouter.ai/api/v1`, `OPENROUTER_MODEL default meta-llama/llama-3.3-70b-instruct:free` + `HTTP-Referer/X-Title`) fallback; both OpenAI-compatible `chat/completions` with `temperature 0.7` and `max_tokens max(asked,150)`. `isAiConfigured()` true if any key set.
- System prompt `TUTOR_SYSTEM` — hint-first (never full solution), ≤130 words + ≤one 6-line snippet, Hinglish-mirroring, no emoji.
- `runnerPrompt({lessonTitle, exerciseType, exercisePrompt, learnerWork ≤1500, question})` and `threadPrompt({lessonTitle, title, body})`.
- Budget: `AiUsage {userId, day ISO 10}` `count`; `aiBudget(userId)` `{allowed: count<limit (20), remaining, limit}`; `spendAiBudget` `$inc`.
- Cache: `AiCache {key sha256, answer, provider, modelName}` keyed by `cacheKey([questionLower, codeTrim, exerciseId, lessonId])` for `/ai/help`, `getCachedAnswer` hit costs no budget.
- `POST /api/ai/help` flow: requireAuth → 501 if not configured → Zod → lesson/exercise title lookups (never leaks `solution`) → cache hit → budget check → `chatComplete(messages,400)` → `setCachedAnswer` + `spend` → return `{answer,provider,cached,allowed,remaining,limit}`.
- `scheduleAiFirstReply({threadId})` — `setTimeout(AI_AUTO_REPLY_DELAY_MS default 3m)` on `POST /threads`, `unref`, only if `Reply.count({threadId, isAi:false})===0` and `isAiConfigured`; then `chatComplete(threadPrompt,450)` → `ensureAiUser()` (`codingo-ai` / `ai@codingo.internal`, `onboardingCompleted true`) → `Reply.create {isAi:true}` → `Thread inc replyCount` → `emitCommunityEvent`; in-process timer lost on restart (acceptable for MVP).

**Community** (`routes/community.ts` + `utils/communityEvents.ts`)

- Stores `Thread` + `Reply`, in-memory pub/sub for SSE.
- `GET /threads?lessonId&sort&limit&before` — `top` sorts `votes-1, createdAt-1` else `createdAt-1`, `limit<=30` + `+1` probe, `nextCursor last createdAt ISO`.
- `GET /threads/stream?lessonId` — `text/event-stream` with `connected` + `heartbeat :` every 25s + `thread|reply` events filtered by `lessonId` (null = general).
- `GET /threads/:id` replies sorted `isAccepted first → votes desc → createdAt asc`, `canAccept = authorId===viewerId`.
- Writes: `POST /threads` + `POST /:id/replies` emit events; `POST /:id/upvote` and `POST /replies/:replyId/upvote` toggle `upvotedBy` + `inc votes` then clamp `votes = max(0, upvotedBy.length)`; `POST /:id/accept` (asker only) clears old `isAccepted` then sets; `POST /reports` deduped 409.

---

## 12. Offline, Caching & Sync

`frontend/lib/progressDb.js` — DB `codingo_progress` v3, 4 stores:

| Store | keyPath | Purpose |
|---|---|---|
| `progress` | `key = userId:lessonId` | Progress docs (composite key, indexes `userId, lessonId, updatedAt`) |
| `meta` | `userId` | `{userId, stats:{xp,level,streak,badges,_id,username}, xp, level, streak, badges, lastSync, updatedAt}` |
| `pending` | `key = userId:lessonId:ts:rand` | Offline saves `{key, userId, lessonId, payload{lessonId,score,completed,firstTry,correctCount,total,userId}, createdAt, attempts}` |
| `lesson_drafts` | `key = userId:lessonId` | Runner drafts `{key, userId, lessonId, idx, answers, checked, firstTryCorrect, total, lessonTitle, updatedAt, createdAt}` |

API: `isSupported`, `getAllProgress(userId)`, `getProgress`, `putProgress/putProgressBatch`, `removeProgress`, `clearProgress`, `getUserStats/getAnyUserStats/putUserStats/putLastSync/getLastSync`, `addPending/getPendingList/removePending/removePendingForLesson/clearPending/countPending`, `getLessonDraft/putLessonDraft/removeLessonDraft/getAllDrafts/clearAllDrafts`, `getCacheInfo/deleteDatabase`.

`stores/progressStore.js` — Zustand store `byLessonId` keyed by `lessonId`. Methods above. Flow: `hydrateFromCache(userId)` instant; `fetchAll({userId, forceNetwork:true, silent:false})` caches first then `fetch /api/progress/me + /api/auth/me`, merges pending-ongoing completions (pending `lessonId` Set, keeps local `completed` if server missing or older), writes `byLessonId` + `userStats` + `lastSync`, persists to IDB (filtered for pending), then `syncPending(userId)`. `syncPending` drains anon fallback, POSTs each payload to `/api/progress` (breaks on `401` or offline), replaces with server doc + `putProgress` + `putUserStats` + `removePending`. `save` does optimistic doc (`__optimistic/__pending`), immediate `putProgress`, then `POST /api/progress` → on ok replaces + clears pending else `addPending` + throw for UI banner.

Edge: `AppLayout` + `ProgressHydrator` warm cache on every `/app` navigation; `LessonRunner` draft lifecycle (`beforeunload/visibilitychange/pagehide` + debounced 300ms persist).

**PWA**

`public/sw.js` — caches shell on install, `Cache-First` for static, `stale-while-revalidate` for API-? No — API is network-first; `offline/page.js` fallback. `next.config.mjs` sets `sw.js Cache-Control: public, max-age=0, must-revalidate`. `components/pwa/RegisterSW` registers SW + listens for updates; `InstallApp` prompts `beforeinstallprompt`; `OfflineView` watches `navigator.onLine`.

---

## 13. Code Execution

`lib/runner/index.js` + `workers/jsRunner.worker.js`

- `OUTPUT_LIMIT 10KB`, `DEFAULT_TIMEOUT 2000ms`.
- `runJS(code, {timeout})` → `(id:seq)` via `new Worker(URL("../../workers/jsRunner.worker.js", import.meta.url))` (Turbopack), posts `{id, code}`, `onmessage` → `{output, error}`, `onerror` → `Worker error`, heartbeat `setTimeout(timeout)` terminates + resolves `{timedOut:true, error:"Execution timed out (2s). Check for infinite loops."}`. Fallback if Worker unavailable runs `new Function(code)()` capturing `console.log`.
- `jsRunner.worker.js` wraps eval: replaces `console.log` to accumulate `output` (joined by ` ` then `\n`, trimmed, truncated at limit), catches throw → `error`.
- `runCode({code, language, timeout})` — `python/py` → `{notImplemented:true, error:"Python runner not yet loaded. Pyodide will be lazy-loaded..."}`; otherwise `runJS`.
- `compareOutput(actual, expected)` — `trim + \r\n→\n` strict equality.
- `LessonRunner` uses for `fix_bug`/`write_code` (first `content.tests[0].expected`), for `ai_prompt` checks checklist equality.

---

## 14. Design System

Single source: `DESIGN.md` → realized in `app/globals.css` `@theme`.

**Colors**

| Token | Value | Usage |
|---|---|---|
| `--color-eager-green` | `#58cc02` | Primary fill, display headings, footer |
| `--color-storybook-green` | `#d7ffb8` | Highlight wash, tint |
| `--color-spark-blue` | `#1cb0f6` | Links, outline CTA text, focus `ring` |
| `--color-fresh-leaf` | `#a5ed6e` | Footer links |
| `--color-night-ink` | `#000437` | Deep accent |
| `--color-forest` | `#3d9100` | Muted green (forest) |
| `--color-paper-white` | `#ffffff` | Page canvas |
| `--color-charcoal` | `#4b4b4b` | Headings/body |
| `--color-pencil-gray` | `#777777` | Muted body |
| `--color-faded-gray` | `#afafaf` | Borders |
| `--color-deep-leaf` | `#58a700` | Green button edge |
| `--color-pale-sky` | `#bbe7fc` | Outline button edge |

**Typography**

`--font-feather` 48/64px (display) + `--font-codingo-sans` 13–32px (body); weights 500/700; tracking `-0.04` on display; line heights per scale.

**Spacing** — base 4px, scale `8/12/16/24/32/40/48/64/80/96` (note `p-8` here is 8px). Page max `1200px`, section gap `80–120px`, card padding `16–24px`.

**Shapes & Surfaces** — `radius 12px` on all buttons/pills/nav; no gradients/glass/shadows except `box-shadow: 0 4px 0 var(--color-deep-leaf|--color-pale-sky)` press edge; `0 2px 0` + `translateY(2px)` on `:active`; flat sticker fills with `border-2 border-faded-gray`.

**Motion** — `--duration-micro 80, --duration-quick 150, --duration-fast 250, --duration-medium 350, --duration-slow 400, --duration-very-slow 500`, `--ease-smooth-out cubic-bezier(0.22,1,0.36,1)`, `stagger 40ms/500ms/12px/3px blur`, `panel 400/350ms` — used for `hero-reveal`, `auth-card`, `sheet-overlay/content`.

**Rules** — `12px` everywhere, thick `2px` borders, `#58cc02` only for headings/fills/footer, `#1cb0f6` only for links/outline CTA, body never colored.

---

## 15. Environment Variables

### Backend `backend/.env` (all via `src/config/env.ts` + `dotenv`)

| Variable | Default | Required | Description |
|---|---|---|---|
| `PORT` | `4000` | No | Listen port |
| `MONGODB_URI` | `mongodb://localhost:27017/codingo` | Yes (prod) | Mongo connection; server stays up for `/health` only if down |
| `JWT_SECRET` | — | **Yes** | JWT sign/verify |
| `FRONTEND_URL` | `http://localhost:3000` | No | CSV allowlist + CORS + OpenRouter `HTTP-Referer`; prod add `https://codingo.synax.me` automatically |
| `COOKIE_DOMAIN` | `""` | No | When set (e.g. `codingo.synax.me`) scopes cookie for split-domain Vercel+Render deploy |
| `NODE_ENV` | `development` | No | Flips `secure` cookie + strict CORS |
| `GOOGLE_CLIENT_ID` | `""` | No | Enables Google sign-in; missing → `POST /api/auth/google` 501 |
| `GROQ_API_KEY` | `""` | No | Enables AI helper (primary) |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | No | Groq model |
| `OPENROUTER_API_KEY` | `""` | No | Optional fallback provider |
| `OPENROUTER_MODEL` | `meta-llama/llama-3.3-70b-instruct:free` | No | OpenRouter model |
| `AI_DAILY_LIMIT` | `20` | No | Per-user per-day AI answers |
| `AI_AUTO_REPLY_DELAY_MS` | `180000` (3m) | No | Delay for AI first reply on new threads |
| `APPWRITE_ENDPOINT` | `""` | No | Required together for avatar upload |
| `APPWRITE_PROJECT_ID` | `""` | No |  |
| `APPWRITE_BUCKET_ID` | `""` | No |  |
| `APPWRITE_API_KEY` | `""` | No | All four set → `POST /users/me/avatar` live else 501; `isAppwriteConfigured` gate |

### Frontend (`frontend/.env.local` / Vercel)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `VERCEL_URL` → `http://localhost:3000` | Canonical for `metadataBase`/sitemap/OG |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Public fallback for absolute `API_BASE` (server only) |
| `BACKEND_URL` | `http://localhost:4000` | **Server-only** — `next.config` rewrite target + `API_BASE` on the server |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | — | Required to render `@react-oauth/google` button; backend still checks `GOOGLE_CLIENT_ID` |

No `.env` ships — create both files before first run.

---

## 16. Development Setup

### Prerequisites

Bun 1.3.14, MongoDB (Atlas or local), Node 22.

### Run locally

```bash
git clone https://github.com/user-synax/codingo.git
cd codingo

cd backend && bun install
# create backend/.env — at least MONGODB_URI + JWT_SECRET
bun dev   # http://localhost:4000  (logs frontend origin + health)

# new terminal
cd ../frontend && bun install
# optional frontend/.env.local — NEXT_PUBLIC_API_URL / NEXT_PUBLIC_SITE_URL / etc.
bun dev   # http://localhost:3000
```

Visit `http://localhost:3000`. The `proxy` + `GET /api/auth/me` flow handles redirects.

### Seeding

```bash
cd backend
bun src/seed/seed.ts --list                  # show the available course slugs
bun src/seed/seed.ts --course js-from-zero   # rebuild one course
bun src/seed/seed.ts --all                   # rebuild every course
```

Seeding is scoped and idempotent. Only the selected course's units, lessons and
exercises are written, and every node is upserted on a natural key (course title,
`courseId` + unit title, `unitId` + lesson title, `lessonId` + exercise order) —
so existing lessons keep their `_id` and learner `Progress` keeps pointing at
them. Lessons dropped from the seed are deleted only when no learner has
progress on them; otherwise they are reported and left untouched. Running it
with no flag prints the usage and exits non-zero, so a bare run can never wipe
content by accident.

### Build

```bash
cd backend && bun run build   # tsc -p tsconfig.json → dist/
bun start                     # bun src/index.ts
cd ../frontend && npx next build   # Turbopack
npx next start
```

### How to test a lesson offline

Open a lesson, answer a couple exercises, close the tab mid-lesson → reload → `LessonRunner` restores draft from `lesson_drafts`. Complete the lesson while offline (airplane mode) → “Saved offline — will sync” banner → go back online → `progressStore.syncPending` drains the `pending` queue and mints XP.

---

## 17. Key Files Quick Reference

| File | Purpose |
|---|---|
| `frontend/app/page.js` | Landing — orchestrates Hero…Footer + JSON-LD + auth redirect |
| `frontend/app/layout.js` | Root layout — fonts, metadata, RegisterSW |
| `frontend/app/(auth)/layout.js` | Auth centered card + logged-in guard |
| `frontend/app/app/layout.js` | App shell — Sidebar + BottomNav +ProgressHydrator warm |
| `frontend/lib/api.js` | Central API client + all helpers |
| `frontend/lib/auth.js` | `getCurrentUser()` server helper |
| `frontend/lib/progressDb.js` | IndexedDB v3 |
| `frontend/stores/progressStore.js` | Zustand progress — IDB-first, offline queue |
| `frontend/lib/runner/index.js` | `runJS/runCode/compareOutput` |
| `frontend/workers/jsRunner.worker.js` | JS Worker sandbox |
| `frontend/proxy.js` | Edge cookie check + redirects |
| `frontend/next.config.mjs` | `/api` rewrite + SW headers |
| `frontend/app/globals.css` | Theme, tokens, motion, button press edge |
| `frontend/app/docs/page.js` | Static docs site (`/docs`) |
| `backend/src/index.ts` | Entry + DB connect + listen + shutdown |
| `backend/src/app.ts` | Express factory + CORS allowlist + routers |
| `backend/src/routes/auth.ts` | Auth + Google ID-token flow |
| `backend/src/routes/courses.ts` | Course list |
| `backend/src/routes/lessons.ts` | Lesson+exercises |
| `backend/src/routes/progress.ts` | Progress+XP/streak/badges/level/CC |
| `backend/src/routes/community.ts` | Threads/replies/SSE |
| `backend/src/routes/users.ts` | Profile + avatar + public `/u/:username` |
| `backend/src/routes/leaderboard.ts` | Global board |
| `backend/src/routes/economy.ts` | Hearts/CC/freeze/daily goal |
| `backend/src/routes/ai.ts` | Help + status |
| `backend/src/models/` | All 12 Mongoose schemas + indexes |
| `backend/src/middleware/auth.ts` | JWT middleware |
| `backend/src/utils/jwt.ts` | JWT + cookie helpers |
| `backend/src/utils/level.ts` | Level curves |
| `backend/src/utils/streak.ts` | Streak calc |
| `backend/src/utils/badges.ts` | Badge checks |
| `backend/src/utils/hearts.ts` | Hearts regen + prices |
| `backend/src/utils/ai.ts` | LLM layer + budget + cache + first reply |

---

## Appendix: Milestones & Open Questions

| # | Milestone | Status |
|---|---|---|
| 1 | Foundation — monorepo, DESIGN.md, auth, base layout, landing | ✅ Complete |
| 2 | Lesson engine — 7 exercise types, Monaco, Worker runner, drafts, offline queue, confetti, muting | ✅ Complete |
| 3 | Content — JS from Zero 30 lessons (5 units) | ✅ Complete |
| 4 | Gamification — XP, levels, streaks(+freeze), daily goal, hearts, CC, badges, leaderboard | ✅ Complete |
| 5 | Community & AI — threads/replies/SSE/upvote/accept/report + Groq/OpenRouter hint-first helper + auto first reply + cache/budget | ✅ Complete |
| 6 | Polish — PWA SW/manifest/offline, legal pages, SEO/sitemap/robots/OG, proxy guards, 3D button edge, motion tokens | ✅ Complete |
| — | Launch — soft launch, perf pass, moderation tooling | ⏳ Next |

**Open questions (PRD §15)**

- Second language after JS (Python runner stubbed; Pyodide lazy-load planned)
- LLM model choice (Groq `gpt-oss-20b` primary; OpenRouter `llama-3.3-70b:free` fallback)
- Shared solutions after completion vs immediate
- “Codingo” store name collision if ever shipped to app stores
- Weekly leagues / study groups / push reminders (post-MVP)

---

*Generated from codebase scan. Last updated: April 2026.*
