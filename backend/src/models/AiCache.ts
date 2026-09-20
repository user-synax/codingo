import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAiCache extends Document {
  _id: mongoose.Types.ObjectId;
  key: string; // sha256 of normalized prompt — identical questions share answers
  answer: string;
  provider: string;
  modelName: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiCacheSchema = new Schema<IAiCache>(
  {
    key: { type: String, required: true, unique: true, index: true },
    answer: { type: String, required: true },
    provider: { type: String, required: true },
    modelName: { type: String, required: true },
  },
  { timestamps: true },
);

// Identical doubts asked days apart get the instant cached answer
AiCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

export const AiCache: Model<IAiCache> =
  mongoose.models.AiCache ?? mongoose.model<IAiCache>("AiCache", AiCacheSchema);
