import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAiUsage extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  day: string; // YYYY-MM-DD (UTC) — one doc per user per day
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const AiUsageSchema = new Schema<IAiUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    day: { type: String, required: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

AiUsageSchema.index({ userId: 1, day: 1 }, { unique: true });

export const AiUsage: Model<IAiUsage> =
  mongoose.models.AiUsage ?? mongoose.model<IAiUsage>("AiUsage", AiUsageSchema);
