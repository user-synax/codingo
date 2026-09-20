import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  language: string;
  description: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    language: { type: String, required: true, trim: true, lowercase: true, default: "javascript" },
    description: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

CourseSchema.index({ language: 1, order: 1 });
CourseSchema.index({ order: 1 });

export const Course: Model<ICourse> = mongoose.models.Course ?? mongoose.model<ICourse>("Course", CourseSchema);
