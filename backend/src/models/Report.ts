import mongoose, { Document, Model, Schema } from "mongoose";

export type ReportTarget = "thread" | "reply";
export type ReportStatus = "open" | "reviewed" | "dismissed";

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  targetType: ReportTarget;
  targetId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    targetType: { type: String, enum: ["thread", "reply"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
    status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" },
  },
  { timestamps: true },
);

export const Report: Model<IReport> =
  mongoose.models.Report ?? mongoose.model<IReport>("Report", ReportSchema);
