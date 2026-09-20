import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Thread } from "../models/Thread.js";
import { Reply } from "../models/Reply.js";
import { Lesson } from "../models/Lesson.js";
import { AiUsage } from "../models/AiUsage.js";
import { AiCache } from "../models/AiCache.js";
import { emitCommunityEvent } from "./communityEvents.js";
import { env } from "../config/env.js";

/**
 * Provider-agnostic LLM layer (PRD 5.6).
 * Groq is the provider; OpenRouter stays as an optional key-gated fallback.
 * All providers speak OpenAI-compatible chat-completions, so swapping
 * models or adding a provider is a config change, not a code change.
 * Keys never leave the backend. Prompts never include PII.
 */

export type ChatRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };
export type ChatResult = { text: string; provider: string; model: string };

type ProviderDef = {
  name: string;
  key: string;
  model: string;
  baseUrl: string;
  extraHeaders?: Record<string, string>;
};

function providers(): ProviderDef[] {
  const list: ProviderDef[] = [];
  if (env.groqApiKey) {
    list.push({
      name: "groq",
      key: env.groqApiKey,
      model: env.groqModel,
      baseUrl: "https://api.groq.com/openai/v1",
    });
  }
  if (env.openrouterApiKey) {
    list.push({
      name: "openrouter",
      key: env.openrouterApiKey,
      model: env.openrouterModel,
      baseUrl: "https://openrouter.ai/api/v1",
      extraHeaders: {
        "HTTP-Referer": env.frontendUrl,
        "X-Title": "Codingo",
      },
    });
  }
  return list;
}

async function callProvider(def: ProviderDef, messages: ChatMessage[], maxTokens: number): Promise<ChatResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(`${def.baseUrl}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${def.key}`,
        ...def.extraHeaders,
      },
      body: JSON.stringify({
        model: def.model,
        messages,
        temperature: 0.7,
        // Floor: reasoning models spend budget on thinking first —
        // a tiny cap returns empty content.
        max_tokens: Math.max(maxTokens, 150),
      }),
    });
    if (!res.ok) throw new Error(`${def.name} HTTP ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
    const text = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new Error(`${def.name} empty response`);
    return { text, provider: def.name, model: def.model };
  } finally {
    clearTimeout(timer);
  }
}

export async function chatComplete(messages: ChatMessage[], maxTokens = 400): Promise<ChatResult> {
  const defs = providers();
  if (!defs.length) {
    throw new Error("No AI provider configured (missing API keys).");
  }
  let lastError: unknown = null;
  for (const def of defs) {
    try {
      return await callProvider(def, messages, maxTokens);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All AI providers failed.");
}

export function isAiConfigured(): boolean {
  return providers().length > 0;
}

// --- Tutor prompts (hint-first, Hinglish-aware) ---

export const TUTOR_SYSTEM = `You are Codingo AI, a friendly coding tutor for beginners in India learning JavaScript.
Rules you must follow:
- Hint-first: explain the concept and point at the mistake. NEVER give the full complete solution code.
- Short: at most 130 words. Plain text with at most one tiny snippet (6 lines max).
- Mirror the learner's language: if they write in Hinglish or Hindi, reply the same way; otherwise reply in simple English.
- Be encouraging, like a helpful senior. No emoji.`;

export function runnerPrompt(input: {
  lessonTitle?: string | null;
  exerciseType?: string | null;
  exercisePrompt?: string | null;
  learnerWork?: string | null;
  question: string;
}): ChatMessage[] {
  const lines = [
    `Lesson: ${input.lessonTitle ?? "JavaScript basics"}`,
    `Exercise (${input.exerciseType ?? "code"}): ${input.exercisePrompt ?? ""}`,
  ];
  if (input.learnerWork) lines.push(`Learner's current work:\n${input.learnerWork.slice(0, 1500)}`);
  lines.push(`Learner's question: ${input.question}`);
  return [
    { role: "system", content: TUTOR_SYSTEM },
    { role: "user", content: lines.join("\n\n") },
  ];
}

export function threadPrompt(input: { lessonTitle?: string | null; title: string; body: string }): ChatMessage[] {
  return [
    { role: "system", content: TUTOR_SYSTEM + " You are answering a community question. End with one line inviting peers to add their take." },
    {
      role: "user",
      content: `Lesson: ${input.lessonTitle ?? "General"}\n\nQuestion title: ${input.title}\n\nDetails: ${input.body}`,
    },
  ];
}

// --- Daily budget (20/day default) ---

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function aiBudget(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = env.aiDailyLimit;
  const doc = await AiUsage.findOne({ userId, day: todayKey() }).lean();
  const used = doc?.count ?? 0;
  return { allowed: used < limit, remaining: Math.max(0, limit - used), limit };
}

export async function spendAiBudget(userId: string): Promise<void> {
  await AiUsage.findOneAndUpdate(
    { userId, day: todayKey() },
    { $inc: { count: 1 }, $setOnInsert: { userId, day: todayKey() } },
    { upsert: true },
  );
}

// --- Prompt cache (cache hits don't spend budget) ---

export function cacheKey(parts: string[]): string {
  return crypto.createHash("sha256").update(parts.join("\n---\n")).digest("hex");
}

export async function getCachedAnswer(key: string) {
  return AiCache.findOne({ key }).lean();
}

export async function setCachedAnswer(key: string, result: ChatResult, answer: string) {
  try {
    await AiCache.findOneAndUpdate(
      { key },
      { $set: { answer, provider: result.provider, modelName: result.model } },
      { upsert: true },
    );
  } catch {}
}

// --- Delayed first-responder for new threads (PRD 5.5) ---
// Fires once per thread ~3 min after creation, only if no peer replied.
// In-process timer: lost on restart (acceptable for MVP volume — a missed
// reply just means peers own the thread). No user budget is spent.

export function scheduleAiFirstReply(input: { threadId: string }) {
  if (!isAiConfigured()) return;
  const timer = setTimeout(async () => {
    try {
      const thread = await Thread.findById(input.threadId).lean();
      if (!thread) return;
      const peerReplies = await Reply.countDocuments({ threadId: thread._id, isAi: false });
      if (peerReplies > 0) return; // peers got there first — stay out of the way

      let lessonTitle: string | null = null;
      if (thread.lessonId) {
        const lesson = await Lesson.findById(thread.lessonId).select("title").lean();
        lessonTitle = lesson?.title ?? null;
      }
      const result = await chatComplete(threadPrompt({ lessonTitle, title: thread.title, body: thread.body }), 450);
      const aiUser = await ensureAiUser();
      const reply = await Reply.create({
        threadId: thread._id,
        authorId: aiUser._id,
        body: result.text,
        isAi: true,
      });
      await Thread.updateOne({ _id: thread._id }, { $inc: { replyCount: 1 } });
      emitCommunityEvent({
        type: "reply",
        reply: {
          id: String(reply._id),
          threadId: String(thread._id),
          body: reply.body,
          votes: 0,
          isAccepted: false,
          isAi: true,
          viewerUpvoted: false,
          author: { id: String(aiUser._id), username: "Codingo AI", avatar: (aiUser.avatar as string | undefined) ?? null },
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          lessonId: thread.lessonId ? String(thread.lessonId) : null,
        },
      });
    } catch (e) {
      console.error("[ai-first-reply]", e instanceof Error ? e.message : e);
    }
  }, env.aiAutoReplyDelayMs);
  timer.unref?.();
}

// --- System author for first-responder replies ---

export async function ensureAiUser() {
  const existing = await User.findOne({ username: "codingo-ai" });
  if (existing) return existing;
  const password = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
  try {
    const doc = await User.create({
      username: "codingo-ai",
      email: "ai@codingo.internal",
      password,
      name: "Codingo AI",
      xp: 0,
      level: 1,
      streak: { count: 0, lastActiveDate: null },
      timezone: "Asia/Kolkata",
      badges: [],
      onboardingCompleted: true,
    });
    return doc;
  } catch {
    // Lost a create race — fetch the winner
    const winner = await User.findOne({ username: "codingo-ai" });
    if (!winner) throw new Error("Could not ensure AI user.");
    return winner;
  }
}
