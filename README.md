<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&duration=3000&pause=1000&color=58CC02&center=true&vCenter=true&width=600&lines=Learn+to+code.+Free.+Fun.+Together.;Bite-sized+lessons.+Real+code.+No+paywalls.;Gamified+learning+for+the+next+generation.;A+free+Duolingo-style+coding+app." alt="Codingo Typing SVG" />
</p>

<p align="center">
  <a href="https://github.com/user-synax/codingo/stargazers"><img src="https://img.shields.io/github/stars/user-synax/codingo?style=for-the-badge&color=eager-green&label=Stars" alt="GitHub Stars"></a>
  <a href="https://github.com/user-synax/codingax/fork"><img src="https://img.shields.io/github/forks/user-synax/codingo?style=for-the-badge&color=storybook-green&label=Forks" alt="GitHub Forks"></a>
  <a href="https://github.com/user-synax/codingo/issues"><img src="https://img.shields.io/github/issues/user-synax/codingo?style=for-the-badge&color=spark-blue&label=Issues" alt="GitHub Issues"></a>
  <a href="https://github.com/user-synax/codingo/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-58cc02?style=for-the-badge" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Built_with-Bun-58cc02?style=for-the-badge&logo=bun" alt="Bun">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js" alt="Next.js 16">
</p>

<p align="center">
  <b>A free, Duolingo-style web app for learning programming.</b>
  <br>Bite-sized lessons. Real code in your browser. Gamified. Fun. For everyone.
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Bite-sized lessons** | Complete a lesson in 2–5 minutes. Perfect for busy schedules. |
| 💻 **Run code in browser** | Python via Pyodide, JavaScript in sandboxed Web Workers. No installs needed. |
| 🏆 **XP & Streaks** | Earn XP per exercise, build daily streaks, level up with badges. |
| 🗣️ **AI Doubt Helper** | Get unstuck instantly with AI explanations. English & Hinglish supported. |
| 👥 **Community Threads** | Ask questions per lesson — AI answers first, peers join in. |
| 📱 **Mobile-first** | Designed for phones. Responsive, PWA-friendly. |
| 💰 **100% Free** | No paywalls, no hearts, no energy limits. Ever. |

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/user-synax/codingo.git
cd codingo

# Install dependencies (both frontend & backend use Bun)
cd frontend && bun install
cd ../backend && bun install

# Start the backend (port 4000)
cd backend && bun dev

# In a new terminal, start the frontend (port 3000)
cd frontend && bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **⚠️** Make sure to set up your `.env` files:
> - **Backend**: `MONGODB_URI` and `JWT_SECRET` (see [`.env.example`](.env.example))
> - **Frontend**: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`)

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────┐
│                   Codingo Stack                   │
├─────────────────────────────────────────────────┤
│                                                   │
│  Frontend      Next.js 16 · Tailwind CSS v4      │
│                shadcn/ui · TypeScript             │
│                Nunito / Nunito Sans fonts         │
│                                                   │
│  Backend       Express · Bun + TypeScript         │
│                JWT · bcryptjs · Zod validation    │
│                Rate limiting · CORS               │
│                                                   │
│  Database      MongoDB · Mongoose                 │
│                                                   │
│  Infrastructure  Vercel · MongoDB Atlas            │
│                Appwrite (avatars — planned)        │
│                                                   │
│  Code          Bun · TypeScript everywhere         │
│                ESM modules · strict TS            │
└─────────────────────────────────────────────────┘
```

---

## 📂 Architecture

```
codingo/
├── frontend/                        # Next.js 16 App Router
│   ├── app/
│   │   ├── page.js                  # Landing page (hero, features, footer)
│   │   ├── layout.js                # Root layout with fonts
│   │   ├── (auth)/                  # Auth group (login, signup, forgot-password)
│   │   ├── onboarding/              # 3-step onboarding wizard
│   │   └── app/                     # Authenticated app shell
│   │       ├── page.js              # Dashboard (stats, path preview)
│   │       ├── learn/               # Learning path + lesson runner
│   │       ├── community/           # Community threads
│   │       └── profile/             # User profile
│   ├── components/
│   │   ├── ui/                      # Button, Input, Label, Sheet
│   │   ├── landing/                 # Navbar, Hero, Features, Footer...
│   │   ├── auth/                    # SignupForm, LoginForm, AuthCard
│   │   ├── onboarding/              # OnboardingWizard, CountrySelect
│   │   └── app/                     # Sidebar, BottomNav
│   ├── lib/
│   │   ├── api.js                   # Central API client
│   │   ├── auth.js                  # Server-side auth helper
│   │   ├── countries.js             # 230+ country list
│   │   └── utils.js                 # cn() — clsx + tailwind-merge
│   ├── components/landing/Footer.js # Ayush @user-synax
│   ├── globals.css                  # Tailwind @theme + motion tokens
│   └── next.config.mjs
│
├── backend/                         # Express API server
│   ├── src/
│   │   ├── index.ts                 # Entry point
│   │   ├── app.ts                   # Express factory
│   │   ├── config/                  # env.ts, db.ts
│   │   ├── routes/                  # auth, courses, lessons, progress
│   │   ├── models/                  # User, Course, Unit, Lesson, Exercise, Progress, XPEvent
│   │   ├── middleware/              # auth.ts (JWT)
│   │   ├── validators/              # auth.ts (Zod schemas)
│   │   └── utils/                   # jwt.ts, streak.ts
│   └── tsconfig.json
│
├── docs.md                          # Full documentation
├── PRD.md                           # Product Requirements
├── DESIGN.md                        # Visual design system
└── README.md                        # You're here 👈
```

---

## 🎨 Design System

All visual decisions are governed by [`DESIGN.md`](DESIGN.md). Key highlights:

- **Palette**: Single saturated green `#58cc02` for CTAs + display headings, `#1cb0f6` blue for links
- **Typography**: Nunito (display) + Nunito Sans (body) via `next/font`
- **Radius**: 12px on everything — buttons, pills, cards, inputs
- **No shadows**: The **only** shadow allowed is the `box-shadow: 0 4px 0` button press edge
- **Sticker-style**: Flat fills, thick 2px borders, playful mascot illustrations
- **Dark mode**: Supported from day one (placeholder in CSS, implementation in progress)

| Color | Hex | Role |
|-------|-----|------|
| 🟢 Eager Green | `#58cc02` | Primary CTA, display headings, footer |
| 🟩 Storybook Green | `#d7ffb8` | Soft highlight wash |
| 🔵 Spark Blue | `#1cb0f6` | Links, secondary CTAs |
| 🟣 Night Ink | `#000437` | Deep accents |
| ⚫ Charcoal | `#4b4b4b` | Primary body text |
| 🩶 Paper White | `#ffffff` | Page canvas |

---

## 📖 Documentation

Full project documentation is available in **[`docs.md`](docs.md)** covering:

- Backend API routes (all 13 endpoints)
- Database schema (7 Mongoose models)
- Authentication flow (JWT + bcrypt + rate limiting)
- Environment variables
- Development setup & seeding
- Design system tokens & principles

---

## 📅 Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **Foundation** | ✅ Done | Monorepo, auth, base layout, landing page |
| **Lesson Engine** | 🔄 In Progress | Exercise components, code runner, progress saving |
| **Content** | ⏳ Planned | First course with ~30 lessons |
| **Gamification** | ⏳ Planned | XP, streaks, levels, badges |
| **Community + AI** | ⏳ Planned | Doubt threads, AI first responder |
| **Polish & Launch** | ⏳ Planned | Responsive pass, performance, soft launch |

---

## 🤝 Contributing

Contributions are what make the open source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AwesomeFeature`)
3. Commit your changes (`git commit -m 'Add some AwesomeFeature'`)
4. Push to the branch (`git push origin feature/AwesomeFeature`)
5. Open a Pull Request

---

## 👤 Owner

**Ayush** — Built this with ❤️

- 🐙 GitHub: [user-synax](https://github.com/user-synax)
- 🌐 Portfolio: [codingo.synax.me](https://codingo.synax.me)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by <b>Ayush</b> · <a href="https://github.com/user-synax/codingo">View on GitHub</a>
</p>
