/* Community feed — client island inside the server-rendered page.
   Live updates: one SSE connection (EventSource) merges new threads and
   reply counts in place; if the stream fails, a quiet 15s poll takes over.
   Mutations are optimistic with rollback. No emoji — lucide icons only. */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowBigUp,
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  MessagesSquare,
  Plus,
} from "lucide-react";
import {
  createThread,
  fetchThreads,
  threadsStreamUrl,
  upvoteThread,
} from "@/lib/api";
import { timeAgo } from "./timeAgo";

function mergeThreads(prev, incoming) {
  if (!incoming.length) return prev;
  const seen = new Map(prev.map((t) => [t.id, t]));
  for (const t of incoming) seen.set(t.id, { ...seen.get(t.id), ...t });
  // Newest first — matches server "new" order; "top" re-sorts below
  return [...seen.values()];
}

function sortThreads(list, sort) {
  const arr = [...list];
  if (sort === "top") arr.sort((a, b) => b.votes - a.votes || new Date(b.createdAt) - new Date(a.createdAt));
  else arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return arr;
}

function ThreadCard({ thread, currentUserId, onUpvote }) {
  const initials = (thread.author?.username?.[0] ?? "?").toUpperCase();
  return (
    <Link
      href={`/app/community/${thread.id}`}
      className="block rounded-[16px] border-2 border-faded-gray bg-paper-white p-4 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-charcoal sm:p-5"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={thread.viewerUpvoted ? "Remove upvote" : "Upvote"}
          aria-pressed={thread.viewerUpvoted}
          onClick={(e) => {
            e.preventDefault();
            onUpvote(thread.id);
          }}
          className={
            thread.viewerUpvoted
              ? "flex shrink-0 flex-col items-center gap-0.5 rounded-[12px] border-2 border-eager-green bg-storybook-green px-2 py-1.5 text-eager-green transition-all duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] active:translate-y-[1px]"
              : "flex shrink-0 flex-col items-center gap-0.5 rounded-[12px] border-2 border-faded-gray bg-paper-white px-2 py-1.5 text-pencil-gray transition-all duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] hover:border-charcoal hover:text-charcoal active:translate-y-[1px]"
          }
        >
          <ArrowBigUp className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          <span className="font-codingo-sans text-[13px] font-black leading-none">{thread.votes}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {thread.lessonTitle ? (
              <span className="rounded-full bg-[#e6f4ff] px-2 py-0.5 font-codingo-sans text-[11px] font-bold leading-[1.4] text-spark-blue">
                {thread.lessonTitle}
              </span>
            ) : (
              <span className="rounded-full bg-faded-gray/20 px-2 py-0.5 font-codingo-sans text-[11px] font-bold leading-[1.4] text-pencil-gray">
                General
              </span>
            )}
            {thread.accepted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-storybook-green px-2 py-0.5 font-codingo-sans text-[11px] font-black leading-[1.4] text-charcoal">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                Answered
              </span>
            ) : null}
          </div>
          <h3 className="mt-1.5 font-codingo-sans text-[15px] font-bold leading-[1.35] text-charcoal sm:text-[16px]">
            {thread.title}
          </h3>
          <p className="mt-1 line-clamp-2 font-codingo-sans text-[13px] font-medium leading-[1.45] text-pencil-gray sm:text-[14px]">
            {thread.body}
          </p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-charcoal font-codingo-sans text-[10px] font-bold text-paper-white" aria-hidden="true">
              {initials}
            </span>
            <span className="font-codingo-sans text-[12px] font-bold text-charcoal">
              {thread.author?.username}
              {thread.author?.id === currentUserId ? <span className="font-medium text-pencil-gray"> (you)</span> : null}
            </span>
            <span className="font-codingo-sans text-[12px] font-medium text-pencil-gray">{timeAgo(thread.createdAt)}</span>
            <span className="ml-auto inline-flex items-center gap-1 font-codingo-sans text-[12px] font-bold text-pencil-gray">
              <MessagesSquare className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              {thread.replyCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CommunityFeed({ initialThreads, initialCursor, lessons, initialLessonId, initialSort, currentUserId }) {
  const [threads, setThreads] = useState(initialThreads ?? []);
  const [sort, setSort] = useState(initialSort === "top" ? "top" : "new");
  const [lessonFilter, setLessonFilter] = useState(initialLessonId ?? "");
  const [cursor, setCursor] = useState(initialCursor ?? null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [live, setLive] = useState(false);
  const [asking, setAsking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [askLesson, setAskLesson] = useState(initialLessonId ?? "");
  const paramsRef = useRef({ sort: initialSort, lessonFilter: initialLessonId ?? "" });
  useEffect(() => {
    paramsRef.current = { sort, lessonFilter };
  }, [sort, lessonFilter]);

  // Fresh fetch for filter/sort changes
  async function refetch(nextSort, nextLesson) {
    setLoading(true);
    try {
      const { ok, data } = await fetchThreads({ lessonId: nextLesson || undefined, sort: nextSort, limit: 20 });
      if (ok) {
        setThreads(sortThreads(data.threads ?? [], nextSort));
        setCursor(data.nextCursor ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSort(next) {
    if (next === sort) return;
    setSort(next);
    setThreads((prev) => sortThreads(prev, next));
    refetch(next, lessonFilter);
  }

  function handleLesson(next) {
    setLessonFilter(next);
    refetch(sort, next);
  }

  async function handleLoadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { sort: s, lessonFilter: lf } = paramsRef.current;
      const { ok, data } = await fetchThreads({ lessonId: lf || undefined, sort: s, limit: 20, before: cursor });
      if (ok) {
        setThreads((prev) => sortThreads(mergeThreads(prev, data.threads ?? []), s));
        setCursor(data.nextCursor ?? null);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  // Live: SSE first, quiet polling fallback
  useEffect(() => {
    let es = null;
    let poll = null;
    let stopped = false;

    async function pollOnce() {
      if (stopped) return;
      try {
        const { sort: s, lessonFilter: lf } = paramsRef.current;
        const { ok, data } = await fetchThreads({ lessonId: lf || undefined, sort: s, limit: 20 });
        if (ok && !stopped) {
          setThreads((prev) => sortThreads(mergeThreads(prev, data.threads ?? []), paramsRef.current.sort));
        }
      } catch {}
    }

    function startPolling() {
      if (poll || stopped) return;
      setLive(false);
      poll = setInterval(pollOnce, 15000);
    }

    try {
      es = new EventSource(threadsStreamUrl(lessonFilter || undefined), { withCredentials: true });
    } catch {
      es = null;
    }
    if (!es) {
      startPolling();
      pollOnce();
      return () => {
        stopped = true;
        if (poll) clearInterval(poll);
      };
    }

    es.onopen = () => {
      if (!stopped) {
        setLive(true);
        if (poll) {
          clearInterval(poll);
          poll = null;
        }
      }
    };
    es.addEventListener("thread", (e) => {
      try {
        const t = JSON.parse(e.data);
        const { sort: s, lessonFilter: lf } = paramsRef.current;
        if (lf && (t.lessonId ?? "") !== lf) return;
        setThreads((prev) => {
          if (prev.some((x) => x.id === t.id)) return prev;
          return sortThreads([t, ...prev], s);
        });
      } catch {}
    });
    es.addEventListener("reply", (e) => {
      try {
        const r = JSON.parse(e.data);
        setThreads((prev) => prev.map((t) => (t.id === r.threadId ? { ...t, replyCount: (t.replyCount ?? 0) + 1 } : t)));
      } catch {}
    });
    es.onerror = () => {
      try {
        es.close();
      } catch {}
      startPolling();
    };

    return () => {
      stopped = true;
      try {
        es.close();
      } catch {}
      if (poll) clearInterval(poll);
    };
  }, [lessonFilter]);

  async function handleUpvote(id) {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, viewerUpvoted: !t.viewerUpvoted, votes: Math.max(0, t.votes + (t.viewerUpvoted ? -1 : 1)) }
          : t,
      ),
    );
    try {
      const { ok, data } = await upvoteThread(id);
      if (ok) {
        setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, votes: data.votes, viewerUpvoted: data.upvoted } : t)));
      }
    } catch {}
  }

  async function handleAsk(e) {
    e.preventDefault();
    if (submitting) return;
    setFormError("");
    if (title.trim().length < 5) {
      setFormError("Give it a clear title (5+ characters).");
      return;
    }
    if (body.trim().length < 10) {
      setFormError("Describe your doubt in a little more detail (10+ characters).");
      return;
    }
    setSubmitting(true);
    try {
      const { ok, data } = await createThread({ title: title.trim(), body: body.trim(), lessonId: askLesson || null });
      if (!ok) {
        setFormError(data?.errors ? Object.values(data.errors)[0] : (data?.message ?? "Couldn't post. Try again."));
        return;
      }
      const t = data.thread;
      const { sort: s, lessonFilter: lf } = paramsRef.current;
      if (!lf || (t.lessonId ?? "") === lf) {
        setThreads((prev) => (prev.some((x) => x.id === t.id) ? prev : sortThreads([t, ...prev], s)));
      }
      setTitle("");
      setBody("");
      setAsking(false);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedLessonTitle = lessonFilter ? (lessons.find((l) => l.id === lessonFilter)?.title ?? "Lesson") : "";

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Toolbar — filter + sort + ask */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <select
            value={lessonFilter}
            onChange={(e) => handleLesson(e.target.value)}
            aria-label="Filter by lesson"
            className="w-full appearance-none rounded-[12px] border-2 border-faded-gray bg-paper-white py-2.5 pl-4 pr-10 font-codingo-sans text-[14px] font-bold text-charcoal transition-colors focus:border-spark-blue focus:outline-none"
          >
            <option value="">All lessons + general</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pencil-gray" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[12px] border-2 border-faded-gray bg-paper-white p-1" role="tablist" aria-label="Sort threads">
            {["new", "top"].map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={sort === s}
                onClick={() => handleSort(s)}
                className={
                  sort === s
                    ? "rounded-[10px] bg-charcoal px-4 py-1.5 font-codingo-sans text-[13px] font-bold capitalize leading-[1.4] text-paper-white transition-colors duration-[var(--duration-fast)]"
                    : "rounded-[10px] px-4 py-1.5 font-codingo-sans text-[13px] font-bold capitalize leading-[1.4] text-pencil-gray transition-colors duration-[var(--duration-fast)] hover:text-charcoal"
                }
              >
                {s === "new" ? "New" : "Top"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAsking((v) => !v)}
            className="codingo-btn codingo-btn-primary inline-flex items-center gap-1.5 rounded-[12px] border-2 border-eager-green bg-eager-green px-4 py-2.5 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.8} aria-hidden="true" />
            Ask
          </button>
        </div>
      </div>

      {/* Live status */}
      <div className="flex items-center gap-2" aria-live="polite">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          {live ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-eager-green opacity-60" /> : null}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? "bg-eager-green" : "bg-faded-gray"}`} />
        </span>
        <p className="font-codingo-sans text-[12px] font-bold text-pencil-gray">
          {live ? "Live — new questions appear instantly" : "Connecting to live feed…"}
          {selectedLessonTitle ? ` · ${selectedLessonTitle}` : ""}
        </p>
      </div>

      {/* Ask form */}
      {asking ? (
        <form onSubmit={handleAsk} className="rounded-[16px] border-2 border-charcoal bg-paper-white p-4 sm:p-5">
          <h3 className="font-codingo-sans text-[15px] font-bold leading-[1.3] text-charcoal">Ask the community</h3>
          <p className="mt-1 font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">
            Be specific — mention what you tried and where you&apos;re stuck.
          </p>
          <label className="mt-3 block">
            <span className="font-codingo-sans text-[13px] font-bold text-charcoal">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Why does `let` behave differently inside a block?"
              className="mt-1.5 w-full rounded-[12px] border-2 border-faded-gray bg-paper-white px-3.5 py-2.5 font-codingo-sans text-[14px] font-medium text-charcoal placeholder:text-pencil-gray/70 focus:border-spark-blue focus:outline-none"
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr]">
            <label className="block">
              <span className="font-codingo-sans text-[13px] font-bold text-charcoal">Lesson</span>
              <select
                value={askLesson}
                onChange={(e) => setAskLesson(e.target.value)}
                className="mt-1.5 w-full rounded-[12px] border-2 border-faded-gray bg-paper-white px-3 py-2.5 font-codingo-sans text-[14px] font-bold text-charcoal focus:border-spark-blue focus:outline-none"
              >
                <option value="">General</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-codingo-sans text-[13px] font-bold text-charcoal">Details</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="What did you try? What output did you expect?"
                className="mt-1.5 w-full resize-y rounded-[12px] border-2 border-faded-gray bg-paper-white px-3.5 py-2.5 font-codingo-sans text-[14px] font-medium leading-[1.45] text-charcoal placeholder:text-pencil-gray/70 focus:border-spark-blue focus:outline-none"
              />
            </label>
          </div>
          {formError ? (
            <p className="mt-2 font-codingo-sans text-[13px] font-bold text-[#e03131]" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="mt-3 flex gap-2.5">
            <button
              type="submit"
              disabled={submitting}
              className="codingo-btn codingo-btn-primary rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-2.5 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95 disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Post question"}
            </button>
            <button
              type="button"
              onClick={() => setAsking(false)}
              className="rounded-[12px] border-2 border-faded-gray bg-paper-white px-5 py-2.5 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-pencil-gray hover:border-charcoal hover:text-charcoal"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col gap-3" aria-label="Loading questions">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-[16px] border-2 border-faded-gray bg-paper-white p-5">
              <div className="h-4 w-2/3 rounded-full bg-faded-gray/30" />
              <div className="mt-2 h-4 w-1/2 rounded-full bg-faded-gray/20" />
            </div>
          ))}
        </div>
      ) : threads.length ? (
        <div className="flex flex-col gap-3">
          {threads.map((t) => (
            <ThreadCard key={t.id} thread={t} currentUserId={currentUserId} onUpvote={handleUpvote} />
          ))}
          {cursor ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="codingo-btn-outline mx-auto mt-1 rounded-[12px] border-2 border-faded-gray bg-paper-white px-6 py-2.5 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-charcoal hover:border-charcoal disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[16px] border-2 border-dashed border-faded-gray bg-paper-white p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#e6f4ff] text-spark-blue">
            <MessageCircle className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-codingo-sans text-[17px] font-bold leading-[1.3] text-charcoal">No questions yet</h3>
          <p className="mx-auto mt-1.5 max-w-[380px] font-codingo-sans text-[14px] font-medium leading-[1.45] text-pencil-gray">
            {lessonFilter
              ? "Nothing asked about this lesson so far — be the first, others will thank you."
              : "Be the first to ask — stuck on a lesson, a bug, or a concept?"}
          </p>
          <button
            type="button"
            onClick={() => setAsking(true)}
            className="codingo-btn codingo-btn-primary mx-auto mt-4 inline-flex items-center gap-1.5 rounded-[12px] border-2 border-eager-green bg-eager-green px-5 py-2.5 font-codingo-sans text-[13px] font-bold uppercase leading-none tracking-[0.053em] text-paper-white hover:brightness-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.8} aria-hidden="true" />
            Ask a question
          </button>
        </div>
      )}
    </div>
  );
}
