import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { Progress } from "../models/Progress.js";
import { Lesson } from "../models/Lesson.js";
import { Exercise } from "../models/Exercise.js";
import { User } from "../models/User.js";
import { XPEvent } from "../models/XPEvent.js";
import { calcStreak } from "../utils/streak.js";
import { getLevelForXpPrecise, getXpForLevel } from "../utils/level.js";
import { checkBadges } from "../utils/badges.js";

const router = Router();

const progressBody = z.object({
  lessonId: z.string().min(1),
  score: z.number().min(0).max(100),
  completed: z.boolean().optional().default(false),
  firstTry: z.boolean().optional(),
  correctCount: z.number().min(0).max(20).optional(),
  total: z.number().min(1).max(20).optional(),
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
  const { lessonId, score, completed, firstTry, correctCount: ccIn, total: totalIn } = parsed.data;
  const userId = req.userId as string;

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) return res.status(404).json({ message: "Lesson not found." });

  // Need exercise count for XP calc if not provided
  const exerciseCount = await Exercise.countDocuments({ lessonId });
  const total = totalIn ?? exerciseCount ?? 5;
  const correctCount = ccIn ?? Math.round((score / 100) * total);

  const existing = await Progress.findOne({ userId, lessonId }).lean();
  const attempts = (existing?.attempts ?? 0) + 1;
  const bestScore = Math.max(existing?.bestScore ?? 0, score);
  const wasCompleted = existing?.status === "completed";
  const nowCompleted = completed || score >= 80;
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

  // Award XP + streak + badges + level only on first completion
  let xpAwarded = 0;
  let newBadges: string[] = [];
  let levelUp: { from: number; to: number } | null = null;
  let streakUpdated = null;
  if (nowCompleted && !wasCompleted) {
    const perExercise = 5 * Math.min(correctCount, total);
    const lessonBonus = 10;
    const perfectBonus = score === 100 ? 5 : 0;
    xpAwarded = perExercise + lessonBonus + perfectBonus;
    // Cap to avoid abuse (scales with lesson length)
    const maxXp = total * 5 + 15;
    xpAwarded = Math.min(xpAwarded, maxXp);

    await XPEvent.create({ userId, lessonId, source: "lesson_complete", amount: xpAwarded });

    const user = await User.findById(userId);
    if (user) {
      const oldXp = user.xp ?? 0;
      const oldLevel = getLevelForXpPrecise(oldXp);
      const streak = calcStreak(user);
      const newXp = oldXp + xpAwarded;
      const newLevel = getLevelForXpPrecise(newXp);

      // Total completed lessons for badges
      const totalCompleted = (await Progress.countDocuments({ userId, status: "completed" })) + 1; // +1 for this just completed

      // Check badges
      const badgesToAdd = checkBadges(user, { totalCompleted, isPerfect: score === 100, now: new Date() });
      if (badgesToAdd.length) {
        const set = new Set([...(user.badges ?? []), ...badgesToAdd]);
        user.badges = Array.from(set) as typeof user.badges;
        newBadges = badgesToAdd;
      }

      if (newLevel > oldLevel) levelUp = { from: oldLevel, to: newLevel };

      user.xp = newXp;
      user.level = newLevel;
      user.streak = streak;
      streakUpdated = streak;
      await user.save();
    }
  }

  const user = await User.findById(userId).lean();
  return res.json({
    progress: doc,
    xpAwarded,
    newBadges,
    levelUp,
    streak: streakUpdated ?? user?.streak ?? null,
    user: user
      ? {
          id: String(user._id),
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          badges: user.badges,
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
