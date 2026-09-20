import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReply extends Document {
  _id: mongoose.Types.ObjectId;
  threadId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  body: string;
  votes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  isAccepted: boolean;
  isAi: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IReply>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    votes: { type: Number, default: 0, min: 0 },
    upvotedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    isAccepted: { type: Boolean, default: false },
    // Reserved for the PRD 5.5 AI first responder — peers see who answered
    isAi: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ReplySchema.index({ threadId: 1, createdAt: 1 });

export const Reply: Model<IReply> =
  mongoose.models.Reply ?? mongoose.model<IReply>("Reply", ReplySchema);
