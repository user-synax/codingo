import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = Router();

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, slow down a little." },
});

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function serialize(entry: unknown, rank: number) {
  const u = entry as {
    _id: unknown;
    username: string;
    name: string;
    avatar?: string | null;
    xp: number;
    level: number;
    streak: { count: number; lastActiveDate?: Date | null };
    badges: string[];
    country?: string | null;
    countryCode?: string | null;
    createdAt: Date;
  };
  return {
    rank,
    id: String(u._id),
    username: u.username,
    name: u.name,
    avatar: u.avatar ?? null,
    xp: u.xp ?? 0,
    level: u.level ?? 1,
    streak: { count: u.streak?.count ?? 0 },
    badgesCount: (u.badges ?? []).length,
    badges: u.badges ?? [],
    country: u.country ?? null,
    countryCode: u.countryCode ?? null,
    createdAt: u.createdAt,
  };
}

// GET /api/leaderboard?limit=25&offset=0&page=1  — global XP leaderboard
// Auth required because it lives inside /app. Filter: onboardingCompleted + not private.
// Paginated sequentially by xp desc, createdAt asc (tie → earlier account wins).
router.get("/", readLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const rawLimit = Number(req.query.limit);
  const rawOffset = Number(req.query.offset);
  const rawPage = Number(req.query.page);
  const limit = clamp(rawLimit || 25, 1, 100);
  let offset = 0;
  if (Number.isFinite(rawPage) && rawPage > 0) {
    offset = (Math.floor(rawPage) - 1) * limit;
  } else if (Number.isFinite(rawOffset) && rawOffset >= 0) {
    offset = Math.floor(rawOffset);
  }
  offset = clamp(offset, 0, 100000);

  // Only completed onboarding + public profiles appear (per spec).
  const filter = {
    onboardingCompleted: true,
    isPrivate: { $ne: true },
  } as const;

  const total = await User.countDocuments(filter);

  // Clamp offset to total
  if (offset > total) offset = Math.max(0, total - (total % limit));

  const docs = await User.find(filter)
    .sort({ xp: -1, createdAt: 1 })
    .skip(offset)
    .limit(limit)
    .select("username name avatar xp level streak badges country countryCode createdAt")
    .lean();

  const leaderboard = docs.map((u, i) => serialize(u, offset + i + 1));

  // Current viewer rank — even if not on this page.
  const viewerId = req.userId as string;
  const meDoc = await User.findById(viewerId)
    .select("username name avatar xp level streak badges country countryCode createdAt onboardingCompleted isPrivate")
    .lean();

  let me: ReturnType<typeof serialize> | null = null;
  let meMeta: { notRankedReason?: string } | null = null;
  if (meDoc) {
    const isVisible = Boolean(meDoc.onboardingCompleted) && meDoc.isPrivate !== true;
    if (!meDoc.onboardingCompleted) {
      meMeta = { notRankedReason: "complete_onboarding" };
      me = { ...serialize(meDoc, 0), rank: 0 } as unknown as ReturnType<typeof serialize>;
      // Override rank to 0 to signal not ranked
      (me as unknown as { rank: number }).rank = 0;
    } else if (meDoc.isPrivate === true) {
      meMeta = { notRankedReason: "private_profile" };
      me = { ...serialize(meDoc, 0), rank: 0 } as unknown as ReturnType<typeof serialize>;
      (me as unknown as { rank: number }).rank = 0;
    } else {
      // Rank = 1 + #users ahead. Tie-break: same xp → earlier createdAt ranks higher.
      const higher = await User.countDocuments({ ...filter, xp: { $gt: meDoc.xp ?? 0 } });
      const sameEarlier = await User.countDocuments({
        ...filter,
        xp: meDoc.xp ?? 0,
        createdAt: { $lt: meDoc.createdAt },
      });
      const rank = higher + sameEarlier + 1;
      me = serialize(meDoc, rank);
    }
  }

  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasMore = offset + leaderboard.length < total;

  return res.json({
    leaderboard,
    total,
    limit,
    offset,
    page,
    totalPages,
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
    prevOffset: offset > 0 ? Math.max(0, offset - limit) : null,
    me,
    meMeta,
  });
});

export default router;
