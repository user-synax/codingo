import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  // Optional — Google-only accounts have no password until they set one.
  password?: string;
  // Google account id (ID-token `sub`). Set on Google sign-in / auto-link.
  googleId?: string | null;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: {
    count: number;
    lastActiveDate?: Date | null;
  };
  timezone: string;
  badges: string[];
  avatarFileId?: string | null; // Appwrite storage file id (server-managed)
  bio?: string | null; // short public tagline, max 160
  isPrivate?: boolean; // true hides stats on the public /u/ page
  // Onboarding — added per mandatory flow after signup
  age?: number | null;
  country?: string | null;
  countryCode?: string | null;
  language?: string | null; // e.g. "javascript"
  onboardingCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_.-]+$/,
      // unique + lowercase via index to keep case-insensitive
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
      select: false, // never return by default
    },
    // Google account id — unique when present, absent for email/password users
    googleId: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: undefined },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: {
      count: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },
    timezone: { type: String, default: "Asia/Kolkata" },
    badges: { type: [String], default: [] },
    avatarFileId: { type: String, default: null },
    bio: { type: String, default: null, trim: true, maxlength: 160 },
    isPrivate: { type: Boolean, default: false },
    // Onboarding
    age: { type: Number, default: null, min: 13, max: 80 },
    country: { type: String, default: null, trim: true },
    countryCode: { type: String, default: null, trim: true, uppercase: true, maxlength: 2 },
    language: { type: String, default: null, trim: true, lowercase: true },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

UserSchema.index(
  { googleId: 1 },
  { unique: true, sparse: true },
);

// Case-insensitive uniqueness: store lowercased via collation, enforce via index
UserSchema.index(
  { username: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);
UserSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

// Leaderboard — global XP ranking (all-time, onboardingCompleted + public only).
// Supports sort { xp: -1, createdAt: 1 } and filter { onboardingCompleted, isPrivate, xp }.
UserSchema.index({ xp: -1, createdAt: 1 });
UserSchema.index({ onboardingCompleted: 1, isPrivate: 1, xp: -1, createdAt: 1 });

// Normalize before save
UserSchema.pre("save", function (next) {
  if (this.isModified("username") && this.username) {
    this.username = this.username.trim();
  }
  if (this.isModified("email") && this.email) {
    this.email = this.email.trim().toLowerCase();
  }
  if (this.isModified("name") && this.name) {
    this.name = this.name.trim();
  }
  next();
});

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
