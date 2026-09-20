import mongoose, { Document, Model, Schema } from "mongoose";

export interface IXPEvent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  lessonId?: mongoose.Types.ObjectId | null;
  source: string; // "lesson_complete" | "exercise_first_try" | etc.
  amount: number;
  createdAt: Date;
}

const XPEventSchema = new Schema<IXPEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", default: null },
    source: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

XPEventSchema.index({ userId: 1, createdAt: -1 });

export const XPEvent: Model<IXPEvent> =
  mongoose.models.XPEvent ?? mongoose.model<IXPEvent>("XPEvent", XPEventSchema);
