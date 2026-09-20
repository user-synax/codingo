import mongoose, { Document, Model, Schema } from "mongoose";

export interface ILesson extends Document {
  _id: mongoose.Types.ObjectId;
  unitId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    unitId: { type: Schema.Types.ObjectId, ref: "Unit", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    order: { type: Number, required: true, default: 0 },
    xpReward: { type: Number, required: true, default: 10 },
  },
  { timestamps: true },
);

LessonSchema.index({ unitId: 1, order: 1 });

export const Lesson: Model<ILesson> = mongoose.models.Lesson ?? mongoose.model<ILesson>("Lesson", LessonSchema);
