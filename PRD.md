# Product Requirements Document

**Project Name:** Codingo
**Domain:** codingo.synax.me
**Version:** 1.0 (Draft)
**Owner:** Ayush
**Status:** Planning

---

## 1. Overview

A free web app for learning programming through short, gamified lessons with the look and feel of Duolingo. Learners progress along a level-by-level path, write and run real code in the browser, earn XP and keep streaks, and learn together through lesson-level community discussion with an AI helper that answers doubts first.

## 2. Problem

- Most programming courses are long video lectures with little practice, which leads to low completion and drop-off.
- Duolingo-style apps for coding (Mimo, SoloLearn, Codecademy) put the best features behind paywalls or hearts/limits.
- Learners get stuck on doubts and have nobody to ask in context.
- Beginners in India often think and ask doubts in Hinglish, which most platforms do not support.

## 3. Target Users

- **Primary:** Beginners aged 15 to 25 (school and college students) learning their first programming language, mostly in India.
- **Secondary:** Self-taught learners who want daily practice and a community to learn with.

## 4. Goals and Non-Goals

### Goals
1. Make a learner complete a lesson in 2 to 5 minutes with immediate feedback.
2. Build a daily habit through streaks, XP, and progress visibility.
3. Let learners get unstuck quickly through an AI helper and peer answers.
4. Stay completely free to use by running code in the browser and keeping infrastructure cost low.

### Non-Goals (MVP)
- Video lessons or live video tutors.
- Paid plans, hearts, or energy limits.
- Native mobile apps (the web app must be responsive and PWA-friendly).
- Multiple programming languages at launch.
- Certificates and job placement features.

## 5. Core Features (MVP)

### 5.1 Learning Path
- One course for the MVP language, structured as Course > Unit > Lesson > Exercises.
- Visual, vertical skill path with lesson nodes (locked, available, completed) and unit checkpoints.
- Around 30 lessons at launch. Each lesson has 5 to 10 exercises.
- Progress is saved per user and resumes where the learner left off.

### 5.2 Exercise Types
1. **Multiple choice** – concept check.
2. **Fill in the blank** – complete a line of code.
3. **Arrange code blocks** – drag or tap to order lines.
4. **Predict the output** – choose or type the output of a snippet.
5. **Fix the bug** – edit code so it works.
6. **Write code** – small function or script validated by test cases.

Each exercise gives instant right/wrong feedback, a short explanation, and a hint option.

### 5.3 In-Browser Code Execution
- Code runs entirely on the client to keep costs at zero.
- Python runs via Pyodide in a Web Worker. JavaScript runs in a sandboxed Web Worker or iframe.
- Execution has a timeout and output size limit to handle infinite loops.
- The runner is language-pluggable so more languages can be added later.

### 5.4 Gamification
- **XP:** awarded per exercise and lesson completion, with a bonus for first-try correct answers.
- **Streaks:** daily streak counted using the learner's timezone (default Asia/Kolkata), with a streak freeze as a post-MVP item.
- **Levels and badges:** simple level thresholds and a small set of achievement badges.
- **Feedback moments:** completion screens, progress bar animations, and celebratory states.
- **Leagues (post-MVP):** weekly XP leaderboards with promotion and demotion.

### 5.5 Community
- **Doubt thread per lesson:** learners can post questions and replies, with upvotes and an accepted answer.
- **AI first responder:** every new question gets an AI-generated answer based on the lesson content and the learner's code. Peers can add to or correct it.
- **Shared solutions:** after completing an exercise, a learner can view other learners' solutions.
- **Study groups (post-MVP):** small groups with a shared streak or weekly goal.
- Basic moderation: report button, rate limiting, and admin removal.

### 5.6 AI Doubt Helper
- Available inside each exercise and in lesson threads.
- Explains concepts, points out mistakes, and gives hints without immediately revealing the full solution (hint-first behavior).
- Supports English and Hinglish, matching the language the learner writes in.
- Uses a provider-agnostic LLM layer in the backend so the model or provider can be swapped (free-tier endpoints to start).
- Per-user rate limits to control cost.

### 5.7 Accounts and Profile
- Sign up and login with email and password, and Google login.
- Profile shows username, avatar, XP, level, streak, and badges.
- Basic settings: display name, timezone, theme.

## 6. Post-MVP Roadmap

1. Weekly leagues and leaderboards.
2. Streak freeze and daily goals.
3. Study groups and friend following.
4. Additional languages (JavaScript, C, Java) and second-level courses.
5. Voice input for AI helper and mentor-style conversational tutor.
6. Server-side verification of solutions for leaderboard integrity.
7. Mobile PWA improvements and push reminders.

## 7. UX and Design Principles

- Duolingo-inspired: bright, friendly, rounded UI, big primary buttons, one action per screen.
- Mobile-first, since most learners will use phones.
- Lesson flow is distraction-free with a progress bar, exit confirmation, and clear correct/incorrect states.
- Dark theme supported from day one.
- `design.md` at the project root is the single source of truth for all visual decisions (colors, typography, spacing, components, motion).

## 8. Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript everywhere |
| Package manager and runtime | Bun |
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui (New York style, dark theme), Zustand |
| Backend | Bun + TypeScript REST API (Express), separate from the frontend |
| Database | MongoDB with Mongoose |
| Auth | JWT in httpOnly cookies, email/password plus Google OAuth |
| Code execution | Pyodide and Web Workers in the browser |
| AI | Provider-agnostic LLM service layer in the backend |
| Deployment (initial) | Frontend on Vercel, backend on a Node/Bun-capable host, MongoDB Atlas free tier |

### Repository Structure (Monorepo)

```
/
├── frontend/        # Next.js app
├── backend/         # API server
├── design.md        # Visual source of truth
├── prd.md
└── README.md
```

- One repository, two separate top-level folders. No microservices.
- Each folder has its own `package.json` and environment file.
- Shared types are duplicated or kept in a small shared folder only if needed later.

## 9. Data Model (High Level)

- **User:** name, username, email, avatar, xp, level, streak (count, lastActiveDate), timezone, badges.
- **Course:** title, language, description, order.
- **Unit:** courseId, title, order.
- **Lesson:** unitId, title, order, xpReward.
- **Exercise:** lessonId, type, prompt, content (options, code, test cases), solution, explanation, hints, order.
- **Progress:** userId, lessonId, status, score, completedAt.
- **XPEvent:** userId, source, amount, createdAt.
- **Thread:** lessonId, authorId, title, body, votes, acceptedReplyId, createdAt.
- **Reply:** threadId, authorId or "ai", body, votes, createdAt.
- **Report:** targetType, targetId, reporterId, reason.

## 10. API Overview

- `/auth` – register, login, logout, Google OAuth, current user.
- `/courses` – list courses, units, and lessons.
- `/lessons/:id` – lesson with exercises.
- `/progress` – save exercise and lesson completion, fetch path state.
- `/users/:id` – profile, XP, streak, badges.
- `/threads` and `/replies` – create, list, vote, accept, report.
- `/ai/help` – doubt helper request with lesson and code context.

## 11. Non-Functional Requirements

- **Performance:** lesson screens load in under 2 seconds on a typical mobile connection. Pyodide loads lazily and is cached.
- **Cost:** no per-run server cost for code execution. AI usage is rate limited.
- **Security:** sandboxed code execution, input validation, hashed passwords, rate limiting on auth and AI endpoints, protection against XSS in community posts.
- **Accessibility:** keyboard navigation, sufficient color contrast, readable font sizes.
- **Reliability:** progress is never lost when the learner closes the tab mid-lesson.

## 12. Success Metrics

- Lesson completion rate above 60%.
- Day-1 retention above 40% and day-7 retention above 20%.
- Average of at least 1 lesson per active user per day.
- At least 50% of doubt threads receive an answer within 5 minutes (AI or peer).
- Percentage of learners with a streak of 3 or more days.

## 13. Milestones

1. **Foundation:** monorepo setup, design.md, auth, base layout.
2. **Lesson engine:** exercise components, code runner, progress saving.
3. **Content:** first course with about 30 lessons.
4. **Gamification:** XP, streaks, levels, badges.
5. **Community and AI:** lesson threads, upvotes, AI helper.
6. **Polish and launch:** responsive pass, performance, moderation, soft launch to a small group.

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| AI cost grows with usage | Rate limits, short context, cheap or free-tier models, caching common answers |
| Client-side execution allows XP cheating | Acceptable for MVP; add server-side verification before leaderboards |
| Content creation is slow for a solo builder | Keep to one language and about 30 lessons; use AI to draft, then review manually |
| Low-quality or abusive community posts | Reporting, rate limits, admin removal, AI first responder to reduce noise |
| Pyodide load time on slow phones | Lazy load, cache, and show a friendly loading state |

## 15. Open Questions

- Which language for the MVP: Python or JavaScript?
- Which LLM provider and model for the AI helper?
- Should shared solutions be visible before or only after a learner completes the exercise?
- Branding: the name Codingo is also used by existing coding-education apps; decide whether this matters if the app is ever published on app stores.