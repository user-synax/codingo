import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { registerSchema, loginSchema, onboardingSchema } from "../validators/auth.js";
import { signJwt, cookieName, cookieOptions, clearCookieOptions } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Rate limit: 20 auth attempts per 15 min per IP (tighter per PRD)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, try again later." },
});

function toPublicUser(doc: {
  _id: unknown;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: { count: number; lastActiveDate?: Date | null };
  timezone: string;
  badges: string[];
  createdAt: Date;
  age?: number | null;
  country?: string | null;
  countryCode?: string | null;
  language?: string | null;
  onboardingCompleted?: boolean;
  bio?: string | null;
  isPrivate?: boolean;
}) {
  return {
    id: String(doc._id),
    username: doc.username,
    email: doc.email,
    name: doc.name,
    avatar: doc.avatar ?? null,
    xp: doc.xp,
    level: doc.level,
    streak: doc.streak,
    timezone: doc.timezone,
    badges: doc.badges,
    createdAt: doc.createdAt,
    age: doc.age ?? null,
    country: doc.country ?? null,
    countryCode: doc.countryCode ?? null,
    language: doc.language ?? null,
    onboardingCompleted: Boolean(doc.onboardingCompleted),
    bio: doc.bio ?? null,
    isPrivate: Boolean(doc.isPrivate),
  };
}

// POST /api/auth/register
router.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return res.status(400).json({ message: "Validation failed.", errors: fieldErrors });
  }
  const { username, email, password } = parsed.data;

  // Manual pre-check for nicer field errors (also rely on unique index)
  const existingUsername = await User.findOne({ username }).collation({ locale: "en", strength: 2 }).lean();
  if (existingUsername) {
    return res.status(409).json({ message: "Username already taken.", errors: { username: "Username already taken." } });
  }
  const existingEmail = await User.findOne({ email }).collation({ locale: "en", strength: 2 }).lean();
  if (existingEmail) {
    return res.status(409).json({ message: "Email already registered.", errors: { email: "Email already registered." } });
  }

  const hashed = await bcrypt.hash(password, 10);
  const doc = await User.create({
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password: hashed,
    name: username.trim(),
    xp: 0,
    level: 1,
    streak: { count: 0, lastActiveDate: null },
    timezone: "Asia/Kolkata",
    badges: [],
    age: null,
    country: null,
    countryCode: null,
    language: null,
    onboardingCompleted: false,
  });

  const token = signJwt({ sub: String(doc._id), username: doc.username, email: doc.email });
  res.cookie(cookieName, token, cookieOptions());

  return res.status(201).json({ message: "Account created.", user: toPublicUser(doc) });
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return res.status(400).json({ message: "Validation failed.", errors: fieldErrors });
  }
  const { email, password } = parsed.data;
  const user = await User.findOne({ email }).select("+password").collation({ locale: "en", strength: 2 });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password.", errors: { email: "Invalid email or password." } });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid email or password.", errors: { password: "Invalid email or password." } });
  }

  const token = signJwt({ sub: String(user._id), username: user.username, email: user.email });
  res.cookie(cookieName, token, cookieOptions());

  // Fetch fresh public view
  const publicUser = await User.findById(user._id).lean();
  if (!publicUser) return res.status(500).json({ message: "User not found after login." });
  return res.json({ message: "Logged in.", user: toPublicUser(publicUser) });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie(cookieName, clearCookieOptions());
  return res.json({ message: "Logged out." });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).json({ message: "User not found." });
  return res.json({ user: toPublicUser(user) });
});

// PATCH /api/auth/onboarding — mandatory after signup, guarded by auth
router.patch("/onboarding", requireAuth, async (req, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return res.status(400).json({ message: "Validation failed.", errors: fieldErrors });
  }
  const userId = (req as unknown as { userId: string }).userId;
  const { name, age, country, countryCode, language, avatar } = parsed.data;

  const update: Record<string, unknown> = {
    name: name.trim(),
    age,
    country: country.trim(),
    countryCode: countryCode ? String(countryCode).trim().toUpperCase() : null,
    language: String(language).toLowerCase(),
    onboardingCompleted: true,
  };
  // avatar is optional — only set if provided and non-empty
  if (typeof avatar === "string" && avatar.trim()) {
    update.avatar = avatar.trim();
  }

  const updated = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).lean();
  if (!updated) return res.status(404).json({ message: "User not found." });
  return res.json({ message: "Onboarding completed.", user: toPublicUser(updated) });
});

// GET /api/auth/google — stub per decision
router.get("/google", (_req, res) => {
  return res.status(501).json({ message: "Google OAuth not configured yet. Use email/password for now." });
});
router.get("/google/callback", (_req, res) => {
  return res.status(501).json({ message: "Google OAuth not configured yet." });
});

export default router;
