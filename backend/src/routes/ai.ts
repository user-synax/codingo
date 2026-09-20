import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { Lesson } from "../models/Lesson.js";
import { Exercise } from "../models/Exercise.js";
import {
  aiBudget,
  cacheKey,
  chatComplete,
  getCachedAnswer,
  isAiConfigured,
  runnerPrompt,
  setCachedAnswer,
  spendAiBudget,
} from "../utils/ai.js";
import { env } from "../config/env.js";

const router = Router();

const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many questions at once, take a breath and try again." },
});

const askBody = z.object({
  lessonId: z.string().min(1).optional().nullable(),
  exerciseId: z.string().min(1).optional().nullable(),
  question: z.string().trim().min(1, "Ask something first.").max(1000),
  code: z.string().max(4000).optional().nullable(),
});

// GET /api/ai/status — remaining budget for the "X left today" label
router.get("/status", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId as string;
  const budget = await aiBudget(userId);
  return res.json({ ...budget, configured: isAiConfigured() });
});

// POST /api/ai/help — hint-first doubt helper inside a lesson
router.post("/help", askLimiter, requireAuth, async (req: AuthedRequest, res) => {
  if (!isAiConfigured()) {
    return res.status(501).json({ message: "AI help isn't configured yet. Ask the community instead." });
  }
  const parsed = askBody.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "form");
      if (!errors[k]) errors[k] = i.message;
    }
    return res.status(400).json({ message: "Validation failed.", errors });
  }
  const userId = req.userId as string;
  const { lessonId, exerciseId, question, code } = parsed.data;

  let lessonTitle: string | null = null;
  let exerciseType: string | null = null;
  let exercisePrompt: string | null = null;
  if (lessonId) {
    const lesson = await Lesson.findById(lessonId).select("title").lean();
    if (!lesson) return res.status(404).json({ message: "Lesson not found." });
    lessonTitle = lesson.title;
  }
  if (exerciseId) {
    const exercise = await Exercise.findById(exerciseId).select("type prompt lessonId").lean();
    if (!exercise) return res.status(404).json({ message: "Exercise not found." });
    exerciseType = exercise.type;
    exercisePrompt = exercise.prompt;
    // Never attach the stored solution — the tutor must not leak answers
  }

  // Identical doubts share one answer and don't spend budget
  const key = cacheKey([question.trim().toLowerCase(), code?.trim() ?? "", exerciseId ?? "", lessonId ?? ""]);
  const cached = await getCachedAnswer(key);
  if (cached) {
    const budget = await aiBudget(userId);
    return res.json({ answer: cached.answer, provider: cached.provider, cached: true, ...budget });
  }

  const budget = await aiBudget(userId);
  if (!budget.allowed) {
    return res.status(429).json({
      message: `You've used today's ${budget.limit} AI answers — they reset tomorrow. The community never runs out.`,
      ...budget,
    });
  }

  const messages = runnerPrompt({
    lessonTitle,
    exerciseType,
    exercisePrompt,
    learnerWork: code?.trim() || null,
    question: question.trim(),
  });

  try {
    const result = await chatComplete(messages, 400);
    await setCachedAnswer(key, result, result.text);
    await spendAiBudget(userId);
    const after = await aiBudget(userId);
    return res.json({ answer: result.text, provider: result.provider, cached: false, ...after });
  } catch {
    return res.status(502).json({ message: "The AI helper is taking a break. Try again in a bit." });
  }
});

export default router;
