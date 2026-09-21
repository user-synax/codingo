import mongoose, { Document, Model, Schema } from "mongoose";

export type ExerciseType =
  | "multiple_choice"
  | "fill_blank"
  | "arrange"
  | "predict_output"
  | "fix_bug"
  | "write_code"
  | "ai_prompt";

export interface IExercise extends Document {
  _id: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  type: ExerciseType;
  prompt: string;
  // Flexible per-type content — validated via zod in routes, stored as Mixed
  content: Record<string, unknown>;
  solution: Record<string, unknown>;
  explanation: string;
  hints: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["multiple_choice", "fill_blank", "arrange", "predict_output", "fix_bug", "write_code", "ai_prompt"],
    },
    prompt: { type: String, required: true, trim: true },
    content: { type: Schema.Types.Mixed, required: true },
    solution: { type: Schema.Types.Mixed, required: true },
    explanation: { type: String, required: true, trim: true },
    hints: { type: [String], default: [] },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

ExerciseSchema.index({ lessonId: 1, order: 1 });

export const Exercise: Model<IExercise> = mongoose.models.Exercise ?? mongoose.model<IExercise>("Exercise", ExerciseSchema);
