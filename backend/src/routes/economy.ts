import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { calcHeartsState, applyHeartsRegen, HEART_CAP, HEART_REGEN_MS, HEART_PRICE_SINGLE, HEART_PRICE_FULL, FREEZE_PRICE } from "../utils/hearts.js";

const router = Router();

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many tries, slow down." },
});

function toDayStr(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

// Ensure hearts regen is applied and persisted if needed
async function withHearts(user: any, now = new Date()) {
  const state = calcHeartsState(user, now);
  if (state.needsSave) {
    // Use findByIdAndUpdate to avoid full save validation race
    await User.updateOne({ _id: user._id }, { hearts: state.hearts, heartsUpdatedAt: state.heartsUpdatedAt });
    user.hearts = state.hearts;
    user.heartsUpdatedAt = state.heartsUpdatedAt;
  } else if (!user.heartsUpdatedAt && state.heartsUpdatedAt) {
    await User.updateOne({ _id: user._id }, { heartsUpdatedAt: state.heartsUpdatedAt });
    user.heartsUpdatedAt = state.heartsUpdatedAt;
  }
  return state;
}

// GET /api/economy/me — cash, hearts, daily goal, freezes, daily progress
router.get("/me", readLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId as string;
  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).json({ message: "User not found." });

  // Hearts regen (read path — also persist if needed via withHearts)
  const heartsState = calcHeartsState(user as any, new Date());
  // We use lean, so need to persist via update if needed — but we already did calc, now patch if needed
  if (heartsState.needsSave || !user.heartsUpdatedAt) {
    await User.updateOne({ _id: user._id }, { hearts: heartsState.hearts, heartsUpdatedAt: heartsState.heartsUpdatedAt });
  }

  const tz = user.timezone ?? "Asia/Kolkata";
  const todayStr = toDayStr(new Date(), tz);
  // dailyXp is stored as last day's xp; if date mismatched, progress is 0
  const dailyXp = user.dailyXpDate === todayStr ? (user.dailyXp ?? 0) : 0;
  const dailyGoalXp = user.dailyGoalXp ?? 50;

  return res.json({
    cc: user.cc ?? 0,
    hearts: heartsState.hearts,
    heartsCap: HEART_CAP,
    heartsUpdatedAt: heartsState.heartsUpdatedAt,
    regenInMs: heartsState.regenInMs,
    fullInMs: heartsState.fullInMs,
    regenMs: HEART_REGEN_MS,
    dailyGoalXp,
    dailyXp,
    dailyProgress: Math.min(1, dailyXp / Math.max(1, dailyGoalXp)),
    dailyGoalCompleted: dailyXp >= dailyGoalXp,
    freezes: user.freezes ?? 0,
    xp: user.xp ?? 0,
    level: user.level ?? 1,
    streak: user.streak ?? { count: 0, lastActiveDate: null },
    prices: {
      heartSingle: HEART_PRICE_SINGLE,
      heartFull: HEART_PRICE_FULL,
      freeze: FREEZE_PRICE,
    },
  });
});

// PATCH /api/economy/daily-goal { dailyGoalXp: 20..100 }
const dailyGoalSchema = z.object({
  dailyGoalXp: z.number().int().min(10).max(200),
});
const ALLOWED_GOALS = [20, 30, 50, 80, 100];
router.patch("/daily-goal", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const parsed = dailyGoalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation failed.", errors: { dailyGoalXp: "Daily goal must be 10..200 XP." } });
  let v = parsed.data.dailyGoalXp;
  // Snap to nearest allowed to keep UI clean, but allow any 10..200
  if (!ALLOWED_GOALS.includes(v)) {
    // Allow any, but clamp
    v = Math.min(200, Math.max(10, v));
  }
  const user = await User.findByIdAndUpdate(req.userId, { dailyGoalXp: v }, { new: true }).lean();
  if (!user) return res.status(404).json({ message: "User not found." });
  return res.json({ message: "Daily goal updated.", dailyGoalXp: v });
});

// POST /api/economy/hearts/consume — lose 1 heart on mistake
router.post("/hearts/consume", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId as string;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  const state = applyHeartsRegen(user as any, new Date());
  if (state.needsSave) await user.save(); // persist regen
  else if (!user.heartsUpdatedAt) {
    user.heartsUpdatedAt = state.heartsUpdatedAt;
    await user.save();
  }

  if ((user.hearts ?? 0) <= 0) {
    return res.status(403).json({
      message: "No hearts left. Wait for regen or buy more with CC.",
      hearts: user.hearts ?? 0,
      regenInMs: state.regenInMs,
      fullInMs: state.fullInMs,
      needsPurchase: true,
    });
  }

  user.hearts = Math.max(0, (user.hearts ?? HEART_CAP) - 1);
  // When a heart is consumed, reset regen timer if this was the first loss from full
  // Keep heartsUpdatedAt as last regen time — but if we went from full, set to now so regen starts
  if (state.hearts >= HEART_CAP) {
    user.heartsUpdatedAt = new Date();
  }
  await user.save();

  const after = calcHeartsState(user as any, new Date());
  return res.json({
    message: "Heart consumed.",
    hearts: user.hearts,
    regenInMs: after.regenInMs,
    fullInMs: after.fullInMs,
    cc: user.cc ?? 0,
  });
});

// POST /api/economy/hearts/refill { type: 'single' | 'full' }
const refillSchema = z.object({
  type: z.enum(["single", "full"]).default("single"),
});
router.post("/hearts/refill", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const parsed = refillSchema.safeParse(req.body ?? {});
  const type = parsed.success ? parsed.data.type : "single";

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  const state = applyHeartsRegen(user as any, new Date());
  if (state.needsSave) await user.save();

  const hearts = user.hearts ?? HEART_CAP;
  if (hearts >= HEART_CAP) {
    return res.status(400).json({ message: "Hearts are already full." });
  }

  const cost = type === "full" ? HEART_PRICE_FULL : HEART_PRICE_SINGLE;
  const gain = type === "full" ? HEART_CAP - hearts : 1;

  if ((user.cc ?? 0) < cost) {
    return res.status(402).json({ message: `Not enough CC. Need ${cost} CC.`, cost, cc: user.cc ?? 0 });
  }

  user.cc = (user.cc ?? 0) - cost;
  user.hearts = Math.min(HEART_CAP, hearts + gain);
  // If now full, keep heartsUpdatedAt as is (no regen needed). If not full, keep timer.
  if (user.hearts >= HEART_CAP) {
    user.heartsUpdatedAt = new Date();
  }
  await user.save();

  const after = calcHeartsState(user as any, new Date());
  return res.json({
    message: type === "full" ? "Hearts refilled!" : "Heart restored!",
    hearts: user.hearts,
    cc: user.cc,
    cost,
    regenInMs: after.regenInMs,
  });
});

// POST /api/economy/freeze/buy — premium only via CC
router.post("/freeze/buy", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  if ((user.cc ?? 0) < FREEZE_PRICE) {
    return res.status(402).json({ message: `Not enough CC. Freeze costs ${FREEZE_PRICE} CC.`, cost: FREEZE_PRICE, cc: user.cc ?? 0 });
  }
  if ((user.freezes ?? 0) >= 5) {
    return res.status(400).json({ message: "You can hold max 5 freezes." });
  }

  user.cc = (user.cc ?? 0) - FREEZE_PRICE;
  user.freezes = (user.freezes ?? 0) + 1;
  await user.save();

  return res.json({ message: "Streak freeze purchased!", freezes: user.freezes, cc: user.cc, cost: FREEZE_PRICE });
});

export default router;
