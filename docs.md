# Codingo — Documentation

> **Project:** Codingo — a free, Duolingo-style web app for learning programming
> **Domain:** codingo.synax.me
> **Version:** 1.0 (Draft)
> **Owner:** Ayush
> **GitHub:** [github.com/user-synax](https://github.com/user-synax)
> **Status:** Active development

---

## 1. Table of Contents

- [2. Project Overview](#2-project-overview)
- [3. Tech Stack](#3-tech-stack)
- [4. Monorepo Structure](#4-monorepo-structure)
- [5. Frontend Architecture](#5-frontend-architecture)
  - [5.1 Framework & Routing](#51-framework--routing)
  - [5.2 Page Route Map](#52-page-route-map)
  - [5.3 Key Components](#53-key-components)
  - [5.4 Design System](#54-design-system)
  - [5.5 State & Auth](#55-state--auth)
- [6. Backend Architecture](#6-backend-architecture)
  - [6.1 Server & Framework](#61-server--framework)
  - [6.2 API Routes](#62-api-routes)
  - [6.3 Middleware](#63-middleware)
  - [6.4 Validators](#64-validators)
- [7. Database & Data Models](#7-database--data-models)
  - [7.1 Models](#71-models)
  - [7.2 Relationships](#72-relationships)
- [8. Authentication & Authorization](#8-authentication--authorization)
- [9. Environment Variables](#9-environment-variables)
- [10. Development Setup](#10-development-setup)
- [11. Design Principles](#11-design-principles)
- [12. Key Files Quick Reference](#12-key-files-quick-reference)

---

## 2. Project Overview

Codingo is a free web application that teaches programming through short, gamified lessons. Inspired by Duolingo, it features:

- **Bite-sized lessons** — each completed in 2–5 minutes
- **In-browser code execution** — Python via Pyodide, JavaScript in sandboxed Web Workers
- **Gamification** — XP, streaks, levels, and badges
- **Community threads** per lesson with an AI first responder
- **Hinglish support** — beginners can ask doubts in Hindi-English mix
- **100% free** — no paywalls, no hearts/energy limits

The monorepo is organized as two separate folders under one repository: `frontend/` (Next.js) and `backend/` (Express/Bun).

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript everywhere |
| **Package Manager** | Bun v1.3.14 |
| **Frontend Framework** | Next.js 16.3.5 (App Router) |
| **Frontend Styling** | Tailwind CSS v4, shadcn/ui components |
| **Frontend Fonts** | Nunito (display), Nunito Sans (body) via `next/font` |
| **Backend Runtime** | Bun + TypeScript |
| **Backend Framework** | Express.js |
| **Database** | MongoDB with Mongoose |
| **Auth** | JWT in httpOnly cookies, bcryptjs password hashing |
| **Validation** | Zod (backend), inline validation (frontend) |
| **Code Execution** | Pyodide + Web Workers (client-side, planned) |
| **AI** | Provider-agnostic LLM layer (planned) |
| **Deployment** | Frontend → Vercel, Backend → Node/Bun host, DB → MongoDB Atlas |

---

## 4. Monorepo Structure

```
/
├── frontend/              # Next.js app (port 3000)
│   ├── app/               # App Router pages & layouts
│   ├── components/        # Shared UI & feature components
│   │   ├── ui/            # Base shadcn-style components (Button, Input, Label, Sheet)
│   │   ├── landing/       # Landing page sections (Navbar, Hero, Features, etc.)
│   │   ├── auth/          # Auth components (SignupForm, LoginForm, AuthCard, GoogleIcon)
│   │   ├── onboarding/    # Onboarding wizard components
│   │   └── app/           # App-shell components (Sidebar, BottomNav)
│   ├── lib/               # Library helpers (auth, api, countries, appwrite, utils)
│   ├── globals.css        # Tailwind @theme, CSS custom properties, motion tokens
│   ├── next.config.mjs    # Minimal Next.js config
│   ├── package.json       # Frontend dependencies
│   └── README.md
├── backend/               # Express API server (port 4000)
│   ├── src/
│   │   ├── index.ts       # Entry point — connects DB, starts server
│   │   ├── app.ts         # Express app factory (middleware, routes, error handler)
│   │   ├── config/        # env.ts, db.ts
│   │   ├── routes/        # auth.ts, courses.ts, lessons.ts, progress.ts, community.ts
│   │   ├── models/        # User, Course, Unit, Lesson, Exercise, Progress, XPEvent, Thread, Reply, Report
│   │   ├── middleware/    # auth.ts (requireAuth, optionalAuth)
│   │   ├── validators/    # auth.ts (Zod schemas)
│   │   ├── utils/         # jwt.ts, streak.ts
│   │   └── app.ts         # Main app export
│   ├── tsconfig.json
│   └── package.json
├── docs.md                # This file
├── PRD.md                 # Product Requirements Document
├── DESIGN.md              # Visual design system reference
└── README.md
```

---

## 5. Frontend Architecture

### 5.1 Framework & Routing

- **Next.js 16.3.5** with the **App Router** (React 19.2.8)
- **Server Components by default** — pages are async server components
- **Client Components** are marked `"use client"` where interactivity is needed
- **Tailwind CSS v4** with `@theme` blocks and CSS custom properties in `globals.css`
- Fonts injected via `next/font`: Nunito 800/900 → `--font-feather`, Nunito Sans 500/700 → `--font-codingo-sans`
- **shadcn/ui** components used via Radix UI primitives (Sheet, Dialog)

### 5.2 Page Route Map

| Route | Type | Component | Description |
|---|---|---|---|
| `/` | Server | `app/page.js` | **Landing page** — redirect to app or onboarding if logged in; otherwise shows Hero + sections |
| `/login` | Server | `(auth)/login/page.js` | Login form — wrapped by `AuthLayout` |
| `/signup` | Server | `(auth)/signup/page.js` | Signup form — wrapped by `AuthLayout` |
| `/forgot-password` | Server | `(auth)/forgot-password/page.js` | Password reset placeholder |
| `/onboarding` | Server | `onboarding/page.js` | 3-step onboarding wizard |
| `/app` | Server | `app/app/page.js` | Dashboard — XP, streak, level stats + path preview |
| `/app/learn` | Server | `app/app/learn/page.js` | Vertical skill path with lesson nodes |
| `/app/learn/[lessonId]` | Server | `app/app/learn/[lessonId]/page.js` | Lesson runner or view-only completed lesson |
| `/app/community` | Server | `app/app/community/page.js` | Live question feed — filter by lesson, sort, ask, upvote |
| `/app/community/[threadId]` | Server | `app/app/community/[threadId]/page.js` | Thread detail — live replies, accept answer, report |
| `/app/profile` | Server | `app/app/profile/page.js` | User profile page |

### 5.3 Key Components

#### Layout Components

| Component | File | Type | Description |
|---|---|---|---|
| **RootLayout** | `app/layout.js` | Server | Wraps all pages; injects fonts, metadata |
| **AuthLayout** | `app/(auth)/layout.js` | Server | Centered card layout for auth pages; redirects logged-in users |
| **OnboardingLayout** | `app/onboarding/layout.js` | Server | Full-screen centered layout for onboarding |
| **AppLayout** | `app/app/layout.js` | Server | Fixed sidebar + bottom nav for logged-in users |

#### Landing Page Components

| Component | File | Description |
|---|---|---|
| **Navbar** | `components/landing/Navbar.js` | Sticky top bar, logo, nav links, auth buttons, mobile hamburger |
| **Hero** | `components/landing/Hero.js` | Headline, subtitle, two CTAs, illustration |
| **HeroIllustration** | `components/landing/HeroIllustration.js` | SVG placeholder mascot/editor illustration |
| **MobileMenu** | `components/landing/MobileMenu.js` | Client component — shadcn Sheet hamburger menu |
| **Features** | `components/landing/Features.js` | Three feature pillars |
| **LearningPath** | `components/landing/LearningPath.js` | Visual skill path with lesson node states |
| **ExerciseTypes** | `components/landing/ExerciseTypes.js` | Six exercise type cards |
| **Community** | `components/landing/Community.js` | AI + community doubt helper section |
| **Stats** | `components/landing/Stats.js` | Key metric numbers |
| **CTA** | `components/landing/CTA.js` | Final conversion section |
| **Footer** | `components/landing/Footer.js` | Full-bleed green band with links, GitHub, Ayush credit |

#### Auth Components

| Component | File | Description |
|---|---|---|
| **AuthCard** | `components/auth/AuthCard.js` | Centered card container with title + description |
| **SignupForm** | `components/auth/SignupForm.js` | Multi-field signup with validation, Google OAuth button |
| **LoginForm** | `components/auth/LoginForm.js` | Email/password login, remember me, forgot password, Google |
| **GoogleIcon** | `components/auth/GoogleIcon.js` | SVG Google logo |

#### Onboarding Components

| Component | File | Description |
|---|---|---|
| **OnboardingWizard** | `components/onboarding/OnboardingWizard.js` | 3-step wizard (profile → details → language) |
| **LanguageGrid** | `components/onboarding/LanguageGrid.js` | Language selector cards (JS available, others "Coming soon") |
| **CountrySelect** | `components/onboarding/CountrySelect.js` | Searchable country dropdown (230+ countries) |

#### App Components

| Component | File | Description |
|---|---|---|
| **Sidebar** | `components/app/Sidebar.js` | Fixed left sidebar (280px) — nav, user info, logout |
| **BottomNav** | `components/app/BottomNav.js` | Fixed bottom nav bar — mobile-only (4 items) |
| **LessonRunner** | `components/lesson/LessonRunner.js` | Interactive exercise runner (referenced in lesson page) |

#### UI Components

| Component | File | Description |
|---|---|---|
| **Button** | `components/ui/button.js` | Primary (green fill) / Outline (white fill, blue text) — with 3D press edge |
| **Input** | `components/ui/input.js` | 44px height, 12px radius, Spark Blue focus |
| **Label** | `components/ui/label.js` | Bold 14px Charcoal label |
| **Sheet** | `components/ui/sheet.js` | shadcn Sheet with right-side animation |

#### Library Modules

| Module | File | Description |
|---|---|---|
| **auth.js** | `lib/auth.js` | Server-only — reads `codingo_token` cookie, fetches user from backend |
| **api.js** | `lib/api.js` | Central API helper — `API_BASE`, `apiFetch`, and typed helpers (`registerUser`, `loginUser`, `fetchCourses`, etc.) |
| **countries.js** | `lib/countries.js` | Full 230+ country list + `DEFAULT_COUNTRY` (IN) |
| **appwrite.js** | `lib/appwrite.js` | Avatar upload stub — returns `null` until env vars configured |
| **utils.js** | `lib/utils.js` | `cn()` utility — `clsx` + `tailwind-merge` |

### 5.4 Design System

All visual decisions are governed by `DESIGN.md` at the project root.

#### Colors

| Token | Value | Usage |
|---|---|---|
| `--color-eager-green` | `#58cc02` | Primary CTA fill, display headings, footer band |
| `--color-storybook-green` | `#d7ffb8` | Soft highlight wash, secondary surfaces |
| `--color-spark-blue` | `#1cb0f6` | Interactive links, outlined secondary CTAs, focus rings |
| `--color-fresh-leaf` | `#a5ed6e` | Footer link text |
| `--color-night-ink` | `#000437` | Deep accent, SVG strokes |
| `--color-forest` | `#3d9100` | Footer background (muted green) |
| `--color-paper-white` | `#ffffff` | Page canvas, card surfaces |
| `--color-charcoal` | `#4b4b4b` | Hero headings, primary body text |
| `--color-pencil-gray` | `#777777` | Muted body paragraphs, secondary text |
| `--color-faded-gray` | `#afafaf` | Borders, disabled labels |
| `--color-deep-leaf` | `#58a700` | Button press edge (under green CTA) |
| `--color-pale-sky` | `#bbe7fc` | Button press edge (under white outlined) |

#### Typography

| Token | Size | Weight | Family | Usage |
|---|---|---|---|---|
| `--font-feather` | 48–64px (display), 20–32px | 700–900 | Nunito | Display headlines, logos |
| `--font-codingo-sans` | 13–32px | 500–700 | Nunito Sans | Body, nav, buttons |

Design rules:
- **12px border-radius** on all buttons, pills, nav items
- **No gradients, no drop shadows** — flat sticker-style fills only
- **Single shadow allowed**: `box-shadow: 0 4px 0 <color>` for button press edges
- **No colored text in body paragraphs** — body stays `#777777`
- **`#58cc02` only** for headings, CTA fills, footer band
- **`#1cb0f6` only** for interactive links and outlined secondary CTAs

#### Motion Tokens (`globals.css`)

| Token | Value | Usage |
|---|---|---|
| `--duration-micro` | 80ms | Quick feedback |
| `--duration-quick` | 150ms | Button press, tooltip |
| `--duration-fast` | 250ms | Button hover, dropdown open |
| `--duration-medium` | 350ms | Panel close, toast close |
| `--duration-slow` | 400ms | Panel open |
| `--ease-smooth-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default easing |
| `--stagger-dur` | 500ms | Hero entrance stagger |
| `--stagger-stagger` | 40ms | Per-item stagger offset |

### 5.5 State & Auth

- **No client-side state library** (Zustand was planned but not yet integrated)
- **Session management**: JWT stored in `httpOnly` cookie (`codingo_token`, 7-day expiry)
- **`getCurrentUser()`** in `lib/auth.js` reads the cookie server-side and calls `GET /api/auth/me`
- **Auth flow**:
  1. User signs up → account created → redirected to `/onboarding`
  2. Onboarding completes → `PATCH /api/auth/onboarding` → `onboardingCompleted: true`
  3. On subsequent visits → `getCurrentUser()` returns user → if `onboardingCompleted` → `/app`, else `/onboarding`
- **Google OAuth**: stubmed (`/api/auth/google` returns 501) — email/password only for now
- **CORS**: configured in backend for `http://localhost:3000` and `http://localhost:4000`

---

## 6. Backend Architecture

### 6.1 Server & Framework

- **Bun** runtime with **TypeScript** (ESM module type)
- **Express.js** web framework
- **Entry point**: `src/index.ts` → connects MongoDB → creates Express app → listens on port 4000
- **Graceful shutdown** on `SIGINT` / `SIGTERM`

### 6.2 API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Create account (rate-limited: 20/15min) |
| `POST` | `/api/auth/login` | No | Login (rate-limited: 20/15min) |
| `POST` | `/api/auth/logout` | No | Clear cookie, log out |
| `GET` | `/api/auth/me` | Yes | Get current user |
| `PATCH` | `/api/auth/onboarding` | Yes | Complete onboarding |
| `GET` | `/api/auth/google` | No | Google OAuth stub (501) |
| `GET` | `/api/courses` | No | List all courses with units/lessons |
| `GET` | `/api/courses/:courseId/units` | No | Get units for a course |
| `GET` | `/api/lessons/:id` | Yes | Get lesson with exercises |
| `POST` | `/api/progress` | Yes | Save exercise/lesson progress, award XP + streak |
| `GET` | `/api/progress/me` | Yes | Get all progress for current user |
| `GET` | `/api/progress/:lessonId` | Yes | Get progress for a single lesson |
| `GET` | `/api/threads` | Yes | Cursor feed (`lessonId`, `sort=new\|top`, `limit`, `before`) |
| `POST` | `/api/threads` | Yes | Ask a question (rate-limited) |
| `GET` | `/api/threads/stream` | Yes | SSE live feed (`lessonId` filter, heartbeat) |
| `GET` | `/api/threads/:id` | Yes | Thread + replies (accepted first) |
| `POST` | `/api/threads/:id/replies` | Yes | Reply to a thread (rate-limited) |
| `POST` | `/api/threads/:id/upvote` | Yes | Toggle thread upvote |
| `POST` | `/api/threads/:id/accept` | Yes | Asker accepts an answer |
| `POST` | `/api/threads/replies/:replyId/upvote` | Yes | Toggle reply upvote |
| `POST` | `/api/threads/reports` | Yes | Report a thread/reply |

### 6.3 Middleware

**`src/middleware/auth.ts`**

- `requireAuth(req, res, next)` — reads `codingo_token` cookie, verifies JWT, attaches `req.userId` and `req.user`
- `optionalAuth(req, res, next)` — reads token but doesn't fail if missing (used for public pages)

**Express middleware stack** (in `app.ts`):

```
helmet() → cookieParser() → express.json({limit: "100kb"}) → cors()
```

- **Rate limiting** on auth routes: 20 requests per 15 minutes per IP
- **CORS**: allows `frontendUrl`, `http://localhost:3000`, `http://127.0.0.1:3000` (currently permissive — tighten in production)
- **Error handler**: catches JSON parse failures, returns structured JSON errors

### 6.4 Validators

**`src/validators/auth.ts`** uses **Zod**:

| Schema | Fields |
|---|---|
| `registerSchema` | username (3–30, alphanumeric + `_.-`), email, password (6+ chars) |
| `loginSchema` | email, password |
| `onboardingSchema` | name (2–50), age (13–80), country, countryCode (2 chars), language (`"javascript"` only), avatar (optional URL) |

---

## 7. Database & Data Models

### 7.1 Models

All models use **Mongoose** with MongoDB. Each model uses singleton pattern (`mongoose.models.X ?? mongoose.model<X>("X", schema)`).

#### User (`src/models/User.ts`)

| Field | Type | Default | Notes |
|---|---|---|---|
| `username` | String | required | 3–30 chars, alphanumeric + `_.-`, unique index |
| `email` | String | required | lowercase, unique index |
| `password` | String | required | bcrypt hashed, `select: false` |
| `name` | String | required | Display name |
| `avatar` | String | `undefined` | URL to avatar image |
| `xp` | Number | `0` | Total experience points |
| `level` | Number | `1` | Floor(xp / 100) + 1 |
| `streak` | Object | `{count: 0, lastActiveDate: null}` | Daily streak count |
| `timezone` | String | `"Asia/Kolkata"` | User timezone |
| `badges` | [String] | `[]` | Achievement badges |
| `age` | Number | `null` | 13–80 |
| `country` | String | `null` | Full country name |
| `countryCode` | String | `null` | ISO 3166-1 alpha-2 |
| `language` | String | `null` | Learning language, e.g. `"javascript"` |
| `onboardingCompleted` | Boolean | `false` | Gate for app access |
| `createdAt` | Date | — | Timestamp |
| `updatedAt` | Date | — | Timestamp |

**Indexes**: Unique on `username` and `email` (case-insensitive via collation).

#### Course (`src/models/Course.ts`)

| Field | Type | Default |
|---|---|---|
| `title` | String | required |
| `language` | String | `"javascript"` |
| `description` | String | required |
| `order` | Number | `0` |

#### Unit (`src/models/Unit.ts`)

| Field | Type | Notes |
|---|---|---|
| `courseId` | ObjectId (ref: Course) | required |
| `title` | String | required |
| `description` | String | optional |
| `order` | Number | default `0` |

#### Lesson (`src/models/Lesson.ts`)

| Field | Type | Default |
|---|---|---|
| `unitId` | ObjectId (ref: Unit) | required |
| `title` | String | required |
| `description` | String | optional |
| `order` | Number | `0` |
| `xpReward` | Number | `10` |

#### Exercise (`src/models/Exercise.ts`)

| Field | Type | Notes |
|---|---|---|
| `lessonId` | ObjectId (ref: Lesson) | required |
| `type` | String | Enum: `multiple_choice`, `fill_blank`, `arrange`, `predict_output`, `fix_bug`, `write_code` |
| `prompt` | String | required |
| `content` | Mixed | Flexible per-type (options, code, blocks, etc.) |
| `solution` | Mixed | Flexible per-type |
| `explanation` | String | required |
| `hints` | [String] | default `[]` |
| `order` | Number | `0` |

#### Progress (`src/models/Progress.ts`)

| Field | Type | Default |
|---|---|---|
| `userId` | ObjectId (ref: User) | required |
| `lessonId` | ObjectId (ref: Lesson) | required |
| `status` | String | `"not_started"` / `"in_progress"` / `"completed"` |
| `score` | Number | `0` (0–100) |
| `bestScore` | Number | `0` |
| `attempts` | Number | `0` |
| `firstTry` | Boolean | `true` |
| `completedAt` | Date | `null` |

**Unique index**: `{ userId, lessonId }`.

#### XPEvent (`src/models/XPEvent.ts`)

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId (ref: User) | required |
| `lessonId` | ObjectId (ref: Lesson) | optional |
| `source` | String | e.g. `"lesson_complete"`, `"exercise_first_try"` |
| `amount` | Number | XP awarded |

### 7.2 Relationships

```
User (1) ──── (M) Progress (M) ──── (1) Lesson (M) ──── (1) Unit (M) ──── (1) Course
User (1) ──── (M) XPEvent
Lesson (M) ──── (M) Exercise
```

---

## 8. Authentication & Authorization

### Flow

```
Signup (POST /api/auth/register)
  → Zod validation → bcrypt hash → User.create → JWT sign → httpOnly cookie
  → Returns { user, message }
  → Frontend: redirect to /onboarding

Login (POST /api/auth/login)
  → Zod validation → User.findOne → bcrypt.compare → JWT sign → httpOnly cookie
  → Returns { user, message }
  → Frontend: redirect to /app or /onboarding

Logout (POST /api/auth/logout)
  → Clear cookie → Returns { message }
  → Frontend: redirect to /login

Onboarding (PATCH /api/auth/onboarding)
  → requireAuth → Zod validate → User.findByIdAndUpdate
  → Sets onboardingCompleted: true
  → Frontend: redirect to /app
```

### JWT Details

- **Library**: `jsonwebtoken`
- **Expiry**: 7 days
- **Cookie**: `codingo_token`, `httpOnly`, `secure` in production, `sameSite: "lax"`, `maxAge: 7d`
- **Payload**: `{ sub: userId, username, email }`
- **Secret**: `JWT_SECRET` from environment

### Security

- **Bcrypt** with 10 rounds for password hashing
- **Rate limiting** on auth endpoints (20 req / 15 min per IP)
- **Case-insensitive uniqueness** on username and email via MongoDB collation
- **`select: false`** on password field — never returned in queries
- **`requireAuth` middleware** protects `/api/me`, `/api/onboarding`, `/api/lessons/:id`, `/api/progress/*`

---

## 9. Environment Variables

### Backend (`.env`)

| Variable | Default | Required | Description |
|---|---|---|---|
| `PORT` | `4000` | No | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/codingo` | Yes* | MongoDB connection string |
| `JWT_SECRET` | — | **Yes** | JWT signing secret |
| `FRONTEND_URL` | `http://localhost:3000` | No | Allowed CORS origin |
| `NODE_ENV` | `development` | No | Environment mode |

*Required in production; server starts without DB for `/api/health` only.

### Frontend

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API base URL |

No `.env` files exist yet — these need to be created.

---

## 10. Development Setup

### Prerequisites

- **Bun** v1.3.14
- **MongoDB** (local or Atlas)
- **Node.js** (for TypeScript compilation)

### Running Locally

```bash
# Terminal 1 — Backend
cd backend
bun install
bun dev          # Starts on http://localhost:4000

# Terminal 2 — Frontend
cd frontend
bun install
bun dev          # Starts on http://localhost:3000
```

### Environment Setup

1. Create `backend/.env` with `MONGODB_URI` and `JWT_SECRET`
2. Create `frontend/.env` (optional) with `NEXT_PUBLIC_API_URL`
3. The app will connect to MongoDB on startup

### Seeding Data

Run `bun src/seed/seed.ts` in the backend to seed initial course content ("JavaScript Basics" with ~30 lessons).

### Build Commands

```bash
# Backend
bun run build     # tsc -p tsconfig.json
bun run start     # bun src/index.ts

# Frontend
npx next build    # Turbopack production build
npx next start    # Start production server
```

---

## 11. Design Principles

From `DESIGN.md` and `PRD.md`:

1. **Duolingo-inspired** — bright, friendly, rounded UI; big primary buttons; one action per screen
2. **Mobile-first** — most learners use phones in India
3. **White canvas** — every section sits on pure white (`#ffffff`); color only at footer band and display headings
4. **Green as "correct"** — `#58cc02` is the brand color for progress, headings, CTAs, and the footer
5. **No gradients, no glass, no drop shadows** — flat sticker-style fills with 12px radius and 2px borders
6. **3D press edge** — the only allowed shadow: `box-shadow: 0 4px 0 <color>` on buttons
7. **Illustrations are characters** — flat 2D mascot characters with thick outlines; secondary palette (pink, purple, yellow, orange) lives ONLY inside illustrations
8. **Body text never colored** — stays in `#777777` so green headlines dominate
9. **Dark mode** — supported from day one (placeholder values in `globals.css`, implementation TBD)

---

## 12. Key Files Quick Reference

### Most Important Files

| File | Purpose |
|---|---|
| `frontend/app/page.js` | **Landing page entry** — orchestrates all sections |
| `frontend/app/layout.js` | Root layout — fonts, metadata, HTML structure |
| `frontend/app/(auth)/layout.js` | Auth wrapper — redirects logged-in users |
| `frontend/app/app/layout.js` | App shell layout — sidebar + bottom nav |
| `frontend/components/landing/` | All landing page sections |
| `frontend/components/auth/` | Auth forms and cards |
| `frontend/components/onboarding/` | Onboarding wizard |
| `frontend/components/app/` | Sidebar and BottomNav |
| `frontend/lib/auth.js` | Server-side auth helper |
| `frontend/lib/api.js` | Central API client |
| `frontend/globals.css` | Tailwind theme, CSS variables, motion tokens |
| `DESIGN.md` | Single source of truth for all visual decisions |
| `PRD.md` | Product requirements |
| `backend/src/index.ts` | Server entry point |
| `backend/src/app.ts` | Express app factory |
| `backend/src/routes/auth.ts` | Auth routes |
| `backend/src/routes/courses.ts` | Course listing routes |
| `backend/src/routes/lessons.ts` | Lesson retrieval routes |
| `backend/src/routes/progress.ts` | Progress save + XP/streak logic |
| `backend/src/middleware/auth.ts` | JWT auth middleware |
| `backend/src/models/` | All Mongoose schemas |
| `backend/src/validators/auth.ts` | Zod validation schemas |
| `backend/src/config/env.ts` | Environment configuration |
| `backend/src/config/db.ts` | MongoDB connection |
| `backend/src/utils/jwt.ts` | JWT sign/verify + cookie options |
| `backend/src/utils/streak.ts` | Streak calculation logic |

---

## Appendix: PRD Milestones

| # | Milestone | Status |
|---|---|---|
| 1 | Foundation: monorepo, design.md, auth, base layout | ✅ Complete |
| 2 | Lesson engine: exercise components, code runner, progress saving | 🔄 In progress |
| 3 | Content: first course with ~30 lessons | ⏳ Pending |
| 4 | Gamification: XP, streaks, levels, badges | ⏳ Pending |
| 5 | Community and AI: lesson threads, upvotes, AI helper | ⏳ Pending |
| 6 | Polish and launch: responsive, performance, moderation, soft launch | ⏳ Pending |

---

## Appendix: Open Questions (from PRD)

- Which language for MVP: Python or JavaScript? *(Currently JavaScript only)*
- Which LLM provider and model for the AI helper?
- Should shared solutions be visible before or only after completing the exercise?
- Branding: "Codingo" is used by existing apps — decision needed if publishing to app stores
- Google OAuth integration
- Appwrite avatar upload configuration

---

*Documentation generated from codebase analysis. Last updated: September 2026.*
