import mongoose, { Document, Model, Schema } from "mongoose";

export interface IThread extends Document {
  _id: mongoose.Types.ObjectId;
  lessonId?: mongoose.Types.ObjectId | null;
  authorId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  votes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  replyCount: number;
  acceptedReplyId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema = new Schema<IThread>(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", default: null, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    body: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    votes: { type: Number, default: 0, min: 0 },
    upvotedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    replyCount: { type: Number, default: 0, min: 0 },
    acceptedReplyId: { type: Schema.Types.ObjectId, ref: "Reply", default: null },
  },
  { timestamps: true },
);

ThreadSchema.index({ createdAt: -1 });
ThreadSchema.index({ votes: -1, createdAt: -1 });

export const Thread: Model<IThread> =
  mongoose.models.Thread ?? mongoose.model<IThread>("Thread", ThreadSchema);
