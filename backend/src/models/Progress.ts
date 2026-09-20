import mongoose, { Document, Model, Schema } from "mongoose";

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export interface IProgress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  status: ProgressStatus;
  score: number; // 0-100
  bestScore: number;
  attempts: number;
  firstTry: boolean; // true if first attempt was correct (for bonus)
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
    score: { type: Number, default: 0, min: 0, max: 100 },
    bestScore: { type: Number, default: 0, min: 0, max: 100 },
    attempts: { type: Number, default: 0, min: 0 },
    firstTry: { type: Boolean, default: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export const Progress: Model<IProgress> =
  mongoose.models.Progress ?? mongoose.model<IProgress>("Progress", ProgressSchema);
