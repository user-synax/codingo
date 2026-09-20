import { Router, type Response } from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { Thread } from "../models/Thread.js";
import { Reply } from "../models/Reply.js";
import { Report } from "../models/Report.js";
import { User } from "../models/User.js";
import { Lesson } from "../models/Lesson.js";
import { emitCommunityEvent, subscribeCommunityEvents } from "../utils/communityEvents.js";

const router = Router();

// Reads are cheap: generous limit. Writes are stricter (spam/abuse guard per PRD).
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many posts, slow down a little." },
});

const threadBody = z.object({
  title: z.string().trim().min(5, "Give it a clear title (5+ characters).").max(120),
  body: z.string().trim().min(10, "Describe your doubt in a little more detail (10+ characters).").max(2000),
  lessonId: z.string().min(1).optional().nullable(),
});

const replyBody = z.object({
  body: z.string().trim().min(1, "Write a reply first.").max(2000),
});

const acceptBody = z.object({
  replyId: z.string().min(1),
});

const reportBody = z.object({
  targetType: z.enum(["thread", "reply"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(5, "Tell us briefly what's wrong (5+ characters).").max(500),
});

function validationError(res: Response, issues: { path: (string | number)[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "form");
    if (!errors[k]) errors[k] = i.message;
  }
  return res.status(400).json({ message: "Validation failed.", errors });
}

function isObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

type AuthorInfo = { username: string; avatar: string | null };

async function authorMap(ids: unknown[]): Promise<Map<string, AuthorInfo>> {
  const uniq = [...new Set(ids.map(String))].filter(isObjectId);
  if (!uniq.length) return new Map();
  const users = await User.find({ _id: { $in: uniq } }).select("username avatar").lean();
  const m = new Map<string, AuthorInfo>();
  for (const u of users) {
    m.set(String(u._id), { username: u.username ?? "learner", avatar: (u.avatar as string | undefined) ?? null });
  }
  return m;
}

async function lessonTitleMap(ids: unknown[]): Promise<Map<string, string>> {
  const uniq = [...new Set(ids.map(String))].filter(isObjectId);
  if (!uniq.length) return new Map();
  const lessons = await Lesson.find({ _id: { $in: uniq } }).select("title").lean();
  const m = new Map<string, string>();
  for (const l of lessons) m.set(String(l._id), l.title);
  return m;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeThread(t: any, authors: Map<string, AuthorInfo>, lessons: Map<string, string>, viewerId?: string) {
  const author = authors.get(String(t.authorId));
  return {
    id: String(t._id),
    lessonId: t.lessonId ? String(t.lessonId) : null,
    lessonTitle: t.lessonId ? (lessons.get(String(t.lessonId)) ?? null) : null,
    title: t.title,
    body: t.body,
    votes: t.votes ?? 0,
    replyCount: t.replyCount ?? 0,
    accepted: Boolean(t.acceptedReplyId),
    viewerUpvoted: viewerId ? ((t.upvotedBy ?? []).map(String).includes(viewerId) ?? false) : false,
    author: {
      id: String(t.authorId),
      username: author?.username ?? "learner",
      avatar: author?.avatar ?? null,
    },
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeReply(r: any, authors: Map<string, AuthorInfo>, viewerId?: string) {
  const author = authors.get(String(r.authorId));
  return {
    id: String(r._id),
    threadId: String(r.threadId),
    body: r.body,
    votes: r.votes ?? 0,
    isAccepted: Boolean(r.isAccepted),
    isAi: Boolean(r.isAi),
    viewerUpvoted: viewerId ? ((r.upvotedBy ?? []).map(String).includes(viewerId) ?? false) : false,
    author: {
      id: String(r.authorId),
      username: r.isAi ? "Codingo AI" : (author?.username ?? "learner"),
      avatar: author?.avatar ?? null,
    },
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// GET /api/threads?lessonId=&sort=new|top&limit=&before= — cursor feed
router.get("/", readLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const viewerId = req.userId as string;
  const sort = req.query.sort === "top" ? "top" : "new";
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 30);
  const lessonId = typeof req.query.lessonId === "string" && isObjectId(req.query.lessonId) ? req.query.lessonId : null;
  const before = typeof req.query.before === "string" && !Number.isNaN(Date.parse(req.query.before)) ? new Date(req.query.before) : null;

  const filter: Record<string, unknown> = {};
  if (lessonId) filter.lessonId = lessonId;
  if (before) filter.createdAt = { $lt: before };

  const docs =
    sort === "top"
      ? await Thread.find(filter).sort({ votes: -1, createdAt: -1 }).limit(limit + 1).lean()
      : await Thread.find(filter).sort({ createdAt: -1 }).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;

  const authors = await authorMap(page.map((t) => t.authorId));
  const lessons = await lessonTitleMap(page.map((t) => t.lessonId).filter(Boolean));
  const threads = page.map((t) => serializeThread(t, authors, lessons, viewerId));
  const nextCursor = hasMore && page.length ? new Date(page[page.length - 1].createdAt as Date).toISOString() : null;
  return res.json({ threads, nextCursor });
});

// POST /api/threads — ask a question
router.post("/", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const parsed = threadBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error.issues.map((i) => ({ path: i.path.map(String), message: i.message })));
  const { title, body, lessonId } = parsed.data;
  const userId = req.userId as string;

  if (lessonId && !isObjectId(lessonId)) {
    return res.status(400).json({ message: "Validation failed.", errors: { lessonId: "Unknown lesson." } });
  }
  if (lessonId) {
    const lesson = await Lesson.findById(lessonId).select("_id").lean();
    if (!lesson) return res.status(404).json({ message: "Lesson not found." });
  }

  const doc = await Thread.create({
    lessonId: lessonId ?? null,
    authorId: userId,
    title,
    body,
  });
  const plain = doc.toObject();
  const authors = await authorMap([plain.authorId]);
  const lessons = await lessonTitleMap([plain.lessonId].filter(Boolean));
  const thread = serializeThread(plain, authors, lessons, userId);
  emitCommunityEvent({ type: "thread", thread: thread as unknown as Record<string, unknown> });
  return res.status(201).json({ thread });
});

// GET /api/threads/stream?lessonId= — SSE live feed (threads + replies)
router.get("/stream", requireAuth, async (req: AuthedRequest, res) => {
  const lessonId = typeof req.query.lessonId === "string" && isObjectId(req.query.lessonId) ? req.query.lessonId : null;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {}
  }, 25000);

  const unsubscribe = subscribeCommunityEvents((event) => {
    try {
      const payload = event.type === "thread" ? event.thread : event.reply;
      // Both event kinds carry lessonId (null = general) — filter server-side
      const payloadLesson = ((payload.lessonId as string | null) ?? null) as string | null;
      if (lessonId && payloadLesson !== lessonId) return;
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch {}
  });

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// GET /api/threads/:id — thread + replies (accepted first, then top, then new)
router.get("/:id", readLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const viewerId = req.userId as string;
  const { id } = req.params;
  if (!isObjectId(id)) return res.status(404).json({ message: "Thread not found." });

  const doc = await Thread.findById(id).lean();
  if (!doc) return res.status(404).json({ message: "Thread not found." });

  const replies = await Reply.find({ threadId: doc._id }).lean();
  replies.sort((a, b) => {
    if (Boolean(a.isAccepted) !== Boolean(b.isAccepted)) return a.isAccepted ? -1 : 1;
    if ((b.votes ?? 0) !== (a.votes ?? 0)) return (b.votes ?? 0) - (a.votes ?? 0);
    return new Date(a.createdAt as Date).getTime() - new Date(b.createdAt as Date).getTime();
  });

  const authors = await authorMap([doc.authorId, ...replies.map((r) => r.authorId)]);
  const lessons = await lessonTitleMap([doc.lessonId].filter(Boolean));
  return res.json({
    thread: {
      ...serializeThread(doc, authors, lessons, viewerId),
      canAccept: String(doc.authorId) === viewerId,
    },
    replies: replies.map((r) => serializeReply(r, authors, viewerId)),
  });
});

// POST /api/threads/:id/replies — answer a thread
router.post("/:id/replies", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const parsed = replyBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error.issues.map((i) => ({ path: i.path.map(String), message: i.message })));
  const userId = req.userId as string;
  const { id } = req.params;
  if (!isObjectId(id)) return res.status(404).json({ message: "Thread not found." });

  const thread = await Thread.findById(id);
  if (!thread) return res.status(404).json({ message: "Thread not found." });

  const doc = await Reply.create({ threadId: thread._id, authorId: userId, body: parsed.data.body });
  thread.replyCount = (thread.replyCount ?? 0) + 1;
  await thread.save();

  const plain = doc.toObject();
  const authors = await authorMap([plain.authorId]);
  const reply = serializeReply(plain, authors, userId);
  emitCommunityEvent({
    type: "reply",
    reply: { ...reply, lessonId: thread.lessonId ? String(thread.lessonId) : null } as unknown as Record<string, unknown>,
  });
  return res.status(201).json({ reply });
});

// POST /api/threads/:id/upvote — toggle upvote
router.post("/:id/upvote", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId as string;
  const { id } = req.params;
  if (!isObjectId(id)) return res.status(404).json({ message: "Thread not found." });

  const already = await Thread.exists({ _id: id, upvotedBy: userId });
  if (already) {
    await Thread.updateOne({ _id: id }, { $pull: { upvotedBy: userId }, $inc: { votes: -1 } });
  } else {
    await Thread.updateOne({ _id: id }, { $addToSet: { upvotedBy: userId }, $inc: { votes: 1 } });
  }
  // Clamp — votes mirror upvotedBy length, never negative
  const doc = await Thread.findById(id).lean();
  if (!doc) return res.status(404).json({ message: "Thread not found." });
  const votes = Math.max(0, (doc.upvotedBy ?? []).length);
  if (votes !== doc.votes) await Thread.updateOne({ _id: id }, { $set: { votes } });
  return res.json({ votes, upvoted: !already });
});

// POST /api/threads/:id/accept — thread author marks the answer
router.post("/:id/accept", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const parsed = acceptBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error.issues.map((i) => ({ path: i.path.map(String), message: i.message })));
  const userId = req.userId as string;
  const { id } = req.params;
  if (!isObjectId(id) || !isObjectId(parsed.data.replyId)) {
    return res.status(404).json({ message: "Thread not found." });
  }

  const thread = await Thread.findById(id);
  if (!thread) return res.status(404).json({ message: "Thread not found." });
  if (String(thread.authorId) !== userId) {
    return res.status(403).json({ message: "Only the asker can accept an answer." });
  }
  const reply = await Reply.findOne({ _id: parsed.data.replyId, threadId: thread._id });
  if (!reply) return res.status(404).json({ message: "Reply not found." });

  await Reply.updateMany({ threadId: thread._id }, { $set: { isAccepted: false } });
  reply.isAccepted = true;
  await reply.save();
  thread.acceptedReplyId = reply._id;
  await thread.save();
  return res.json({ acceptedReplyId: String(reply._id) });
});

// POST /api/threads/replies/:replyId/upvote — toggle reply upvote
router.post("/replies/:replyId/upvote", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId as string;
  const { replyId } = req.params;
  if (!isObjectId(replyId)) return res.status(404).json({ message: "Reply not found." });

  const already = await Reply.exists({ _id: replyId, upvotedBy: userId });
  if (already) {
    await Reply.updateOne({ _id: replyId }, { $pull: { upvotedBy: userId }, $inc: { votes: -1 } });
  } else {
    await Reply.updateOne({ _id: replyId }, { $addToSet: { upvotedBy: userId }, $inc: { votes: 1 } });
  }
  const doc = await Reply.findById(replyId).lean();
  if (!doc) return res.status(404).json({ message: "Reply not found." });
  const votes = Math.max(0, (doc.upvotedBy ?? []).length);
  if (votes !== doc.votes) await Reply.updateOne({ _id: replyId }, { $set: { votes } });
  return res.json({ votes, upvoted: !already });
});

// POST /api/threads/reports — report a thread or reply (PRD moderation)
router.post("/reports", writeLimiter, requireAuth, async (req: AuthedRequest, res) => {
  const parsed = reportBody.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error.issues.map((i) => ({ path: i.path.map(String), message: i.message })));
  const userId = req.userId as string;
  const { targetType, targetId, reason } = parsed.data;
  if (!isObjectId(targetId)) return res.status(404).json({ message: "Content not found." });

  const exists =
    targetType === "thread" ? await Thread.exists({ _id: targetId }) : await Reply.exists({ _id: targetId });
  if (!exists) return res.status(404).json({ message: "Content not found." });

  const dupe = await Report.exists({ targetType, targetId, reporterId: userId });
  if (dupe) return res.status(409).json({ message: "You already reported this." });

  await Report.create({ targetType, targetId, reporterId: userId, reason });
  return res.status(201).json({ message: "Thanks — our moderators will take a look." });
});

export default router;
