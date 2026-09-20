import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUnit extends Document {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

UnitSchema.index({ courseId: 1, order: 1 });

export const Unit: Model<IUnit> = mongoose.models.Unit ?? mongoose.model<IUnit>("Unit", UnitSchema);
