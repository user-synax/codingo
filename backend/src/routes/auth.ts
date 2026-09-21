import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import {
  registerSchema,
  loginSchema,
  onboardingSchema,
  googleCredentialSchema,
  TEMP_USERNAME_PREFIX,
} from "../validators/auth.js";
import { signJwt, cookieName, cookieOptions, clearCookieOptions } from "../utils/jwt.js";
import { env, isGoogleConfigured } from "../config/env.js";
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
  googleId?: string | null;
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
    // True while the user still holds an auto-generated `google_user_*` name —
    // the onboarding wizard asks them to pick a real username in that case.
    needsUsername: doc.username.startsWith(TEMP_USERNAME_PREFIX),
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
  // Google-only accounts have no password — point them at the Google button.
  if (!user.password) {
    return res.status(401).json({
      message: "This account uses Google sign-in. Continue with Google below.",
      errors: { email: "This account uses Google sign-in." },
    });
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
  const { name, age, country, countryCode, language, avatar, username } = parsed.data;

  const update: Record<string, unknown> = {
    name: name.trim(),
    age,
    country: country.trim(),
    countryCode: countryCode ? String(countryCode).trim().toUpperCase() : null,
    language: String(language).toLowerCase(),
    onboardingCompleted: true,
  };
  // Google signups pick their real username here (temp `google_user_*` until then)
  if (username !== undefined) {
    const clean = username.trim();
    const taken = await User.findOne({ username: clean, _id: { $ne: userId } })
      .collation({ locale: "en", strength: 2 })
      .lean();
    if (taken) {
      return res.status(409).json({ message: "Username already taken.", errors: { username: "Username already taken." } });
    }
    update.username = clean;
  }
  // avatar is optional — only set if provided and non-empty
  if (typeof avatar === "string" && avatar.trim()) {
    update.avatar = avatar.trim();
  }

  const updated = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).lean();
  if (!updated) return res.status(404).json({ message: "User not found." });
  return res.json({ message: "Onboarding completed.", user: toPublicUser(updated) });
});

// POST /api/auth/google — Google Identity Services credential (ID token) flow.
// The official Google button on login/signup sends `credential`; we verify it
// against our Client ID, then find-or-create the user:
//   1. googleId match → sign in
//   2. verified-email match on a password account → auto-link, sign in
//   3. otherwise → create (temp `google_user_*` username, picked for real in
//      onboarding), Google name + picture prefilled, then sign in.
// Always sets the same httpOnly JWT cookie as email/password auth.
router.post("/google", authLimiter, async (req, res) => {
  const parsed = googleCredentialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Google sign-in failed. Try again.", errors: { form: "Missing Google credential." } });
  }
  if (!isGoogleConfigured) {
    return res.status(501).json({ message: "Google sign-in is not configured yet. Use email/password for now." });
  }

  // Verify the ID token signature, audience (our Client ID) and expiry.
  let sub: string;
  let email: string;
  let emailVerified: boolean;
  let name: string | undefined;
  let picture: string | undefined;
  try {
    const client = new OAuth2Client(env.googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: parsed.data.credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      return res.status(401).json({ message: "Google sign-in failed. Try again." });
    }
    sub = payload.sub;
    email = payload.email.toLowerCase();
    emailVerified = payload.email_verified === true;
    name = payload.name;
    picture = payload.picture;
  } catch {
    return res.status(401).json({ message: "Google sign-in failed. Try again." });
  }
  // Only verified Google emails may create or link accounts.
  if (!emailVerified) {
    return res.status(401).json({ message: "Your Google email is not verified. Verify it with Google first." });
  }

  // 1. Returning Google user
  let doc = await User.findOne({ googleId: sub });
  let isNewUser = false;

  if (!doc) {
    // 2. Existing email/password account → auto-link Google to it
    const existing = await User.findOne({ email }).collation({ locale: "en", strength: 2 });
    if (existing) {
      existing.googleId = sub;
      // Backfill blanks from Google (never overwrite user-chosen values)
      if (!existing.name && name) existing.name = name;
      if (!existing.avatar && picture) existing.avatar = picture;
      await existing.save();
      doc = existing;
    } else {
      // 3. Brand-new user — temp username replaced during onboarding
      const tempUsername = `${TEMP_USERNAME_PREFIX}${crypto.randomBytes(4).toString("hex")}`;
      doc = await User.create({
        username: tempUsername,
        email,
        googleId: sub,
        password: undefined,
        name: (name ?? email.split("@")[0]).trim().slice(0, 50),
        avatar: picture,
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
      isNewUser = true;
    }
  }

  const token = signJwt({ sub: String(doc._id), username: doc.username, email: doc.email });
  res.cookie(cookieName, token, cookieOptions());

  const status = isNewUser ? 201 : 200;
  return res.status(status).json({
    message: isNewUser ? "Account created with Google." : "Logged in with Google.",
    user: toPublicUser(doc),
    isNewUser,
  });
});

export default router;
