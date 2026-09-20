import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { Progress } from "../models/Progress.js";
import { Lesson } from "../models/Lesson.js";
import { User } from "../models/User.js";
import { XPEvent } from "../models/XPEvent.js";
import { calcStreak } from "../utils/streak.js";

const router = Router();

const progressBody = z.object({
  lessonId: z.string().min(1),
  score: z.number().min(0).max(100),
  completed: z.boolean().optional().default(false),
  firstTry: z.boolean().optional(),
});

// POST /api/progress — upsert lesson progress, award XP + streak
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = progressBody.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "form");
      if (!errors[k]) errors[k] = i.message;
    }
    return res.status(400).json({ message: "Validation failed.", errors });
  }
  const { lessonId, score, completed, firstTry } = parsed.data;
  const userId = req.userId as string;

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) return res.status(404).json({ message: "Lesson not found." });

  const existing = await Progress.findOne({ userId, lessonId }).lean();
  const attempts = (existing?.attempts ?? 0) + 1;
  const bestScore = Math.max(existing?.bestScore ?? 0, score);
  const wasCompleted = existing?.status === "completed";
  const nowCompleted = completed || score >= 80; // auto-complete threshold
  const status = nowCompleted ? "completed" : score > 0 ? "in_progress" : "not_started";

  const doc = await Progress.findOneAndUpdate(
    { userId, lessonId },
    {
      $set: {
        status,
        score,
        bestScore,
        attempts,
        firstTry: existing ? existing.firstTry : (firstTry ?? true),
        completedAt: nowCompleted ? new Date() : existing?.completedAt ?? null,
      },
      $setOnInsert: { userId, lessonId },
    },
    { upsert: true, new: true, runValidators: true },
  ).lean();

  // Award XP + streak only on first completion
  let xpAwarded = 0;
  if (nowCompleted && !wasCompleted) {
    const base = lesson.xpReward ?? 10;
    const bonus = (firstTry ?? doc?.firstTry) ? 5 : 0;
    xpAwarded = base + bonus;

    await XPEvent.create({ userId, lessonId, source: "lesson_complete", amount: xpAwarded });
    const user = await User.findById(userId);
    if (user) {
      const streak = calcStreak(user);
      // Level: simple 100 XP per level
      const newXp = (user.xp ?? 0) + xpAwarded;
      const newLevel = Math.floor(newXp / 100) + 1;
      user.xp = newXp;
      user.level = newLevel;
      user.streak = streak;
      await user.save();
    }
  }

  // Return fresh user snapshot for frontend Zustand
  const user = await User.findById(userId).lean();
  return res.json({
    progress: doc,
    xpAwarded,
    user: user
      ? {
          id: String(user._id),
          xp: user.xp,
          level: user.level,
          streak: user.streak,
        }
      : null,
  });
});

// GET /api/progress/me — all progress for current user
router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId as string;
  const list = await Progress.find({ userId }).lean();
  return res.json({ progress: list });
});

// GET /api/progress/:lessonId — single
router.get("/:lessonId", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId as string;
  const { lessonId } = req.params;
  const doc = await Progress.findOne({ userId, lessonId }).lean();
  if (!doc) return res.json({ progress: null });
  return res.json({ progress: doc });
});

export default router;
