import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
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
      required: true,
      minlength: 6,
      select: false, // never return by default
    },
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
  },
  { timestamps: true },
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
