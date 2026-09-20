import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { z } from "zod";
import { Client, Storage, ID, Permission, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Progress } from "../models/Progress.js";
import { env, isAppwriteConfigured } from "../config/env.js";

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many tries, slow down a little." },
});

const updateMeSchema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters.").max(50).optional(),
  bio: z
    .string()
    .trim()
    .max(160, "Bio must be 160 characters or less.")
    .optional()
    .nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  countryCode: z.string().trim().length(2).optional().nullable(),
  timezone: z.string().trim().min(1).max(60).optional(),
  avatar: z.string().trim().url("Avatar must be a valid URL.").max(500).optional().nullable(),
  isPrivate: z.boolean().optional(),
});

// Multer — memory only, images up to 2MB. File hits Appwrite, never disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    return cb(new Error("Only JPEG, PNG, WebP or GIF images are allowed."));
  },
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

// PATCH /api/users/me — edit own profile (username + email stay locked)
router.patch("/me", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "form");
      if (!errors[k]) errors[k] = i.message;
    }
    return res.status(400).json({ message: "Validation failed.", errors });
  }
  const userId = req.userId as string;
  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.bio !== undefined) update.bio = parsed.data.bio?.trim() ? parsed.data.bio.trim() : null;
  if (parsed.data.country !== undefined) update.country = parsed.data.country?.trim() ? parsed.data.country.trim() : null;
  if (parsed.data.countryCode !== undefined) {
    update.countryCode = parsed.data.countryCode ? parsed.data.countryCode.trim().toUpperCase() : null;
  }
  if (parsed.data.timezone !== undefined) update.timezone = parsed.data.timezone;
  if (parsed.data.avatar !== undefined) update.avatar = parsed.data.avatar?.trim() ? parsed.data.avatar.trim() : undefined;
  if (parsed.data.isPrivate !== undefined) update.isPrivate = parsed.data.isPrivate;

  const updated = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).lean();
  if (!updated) return res.status(404).json({ message: "User not found." });
  return res.json({ message: "Profile updated.", user: toPublicUser(updated) });
});

// POST /api/users/me/avatar — secure server-side upload to Appwrite Storage
router.post("/me/avatar", writeLimiter, requireAuth, (req: AuthedRequest, res) => {
  if (!isAppwriteConfigured) {
    return res.status(501).json({
      message: "Avatar uploads are not configured yet (missing Appwrite server env).",
    });
  }
  upload.single("avatar")(req, res, async (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      const status = message.includes("File too large") ? 413 : 400;
      return res.status(status).json({ message });
    }
    const file = (req as AuthedRequest & { file?: Express.Multer.File }).file;
    if (!file) return res.status(400).json({ message: "No image attached. Send multipart field 'avatar'." });

    const userId = req.userId as string;
    try {
      const client = new Client()
        .setEndpoint(env.appwriteEndpoint)
        .setProject(env.appwriteProjectId)
        .setKey(env.appwriteApiKey);
      const storage = new Storage(client);

      const ext = file.mimetype === "image/jpeg" ? "jpg" : file.mimetype.split("/")[1] ?? "png";
      const created = await storage.createFile({
        bucketId: env.appwriteBucketId,
        fileId: ID.unique(),
        file: InputFile.fromBuffer(file.buffer, `avatar-${userId}.${ext}`),
        permissions: [Permission.read(Role.any())], // avatar must load in <img> without auth
      });
      // NOTE: node-appwrite v29 getFileView() performs a fetch and returns a
      // promise — never String() it. The view URL format is stable, build it.
      const viewUrl = `${env.appwriteEndpoint}/storage/buckets/${env.appwriteBucketId}/files/${created.$id}/view?project=${env.appwriteProjectId}`;

      // Swap avatar, drop the previous file so the bucket doesn't fill with orphans
      const prev = await User.findById(userId).select("avatarFileId").lean();
      await User.findByIdAndUpdate(userId, { avatar: viewUrl, avatarFileId: created.$id });
      if (prev?.avatarFileId) {
        try {
          await storage.deleteFile({ bucketId: env.appwriteBucketId, fileId: prev.avatarFileId });
        } catch {}
      }
      return res.status(201).json({ message: "Avatar updated.", avatar: viewUrl });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Avatar upload failed.";
      return res.status(502).json({ message });
    }
  });
});

// GET /api/users/u/:username — public showcase (no auth). Email is never exposed.
router.get("/u/:username", async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean();
  if (!user) return res.status(404).json({ message: "User not found." });

  const base = {
    username: user.username,
    name: user.name,
    avatar: user.avatar ?? null,
    isPrivate: Boolean(user.isPrivate),
  };
  if (user.isPrivate) {
    return res.json({ user: base });
  }

  const completedLessons = await Progress.countDocuments({ userId: user._id, status: "completed" });
  return res.json({
    user: {
      ...base,
      bio: user.bio ?? null,
      xp: user.xp ?? 0,
      level: user.level ?? 1,
      streak: { count: user.streak?.count ?? 0 },
      badges: user.badges ?? [],
      completedLessons,
      memberSince: user.createdAt,
    },
  });
});

export default router;
