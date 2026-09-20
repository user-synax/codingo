/* Thread detail — client island. Live replies via SSE (filtered to this
   thread) with quiet polling fallback. Optimistic upvotes, accept-answer
   for the asker, and report affordances. No emoji — lucide icons only. */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowBigUp,
  ArrowLeft,
  CheckCircle2,
  Flag,
  Send,
} from "lucide-react";
import {
  acceptReply,
  createReply,
  fetchThread,
  reportContent,
  threadsStreamUrl,
  upvoteReply,
  upvoteThread,
} from "@/lib/api";
import { timeAgo } from "./timeAgo";

function Avatar({ username }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal font-codingo-sans text-[12px] font-bold text-paper-white"
      aria-hidden="true"
    >
      {(username?.[0] ?? "?").toUpperCase()}
    </span>
  );
}

function ReportButton({ targetType, targetId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (state === "sending" || state === "done") return;
    if (reason.trim().length < 5) {
      setMsg("Tell us briefly what's wrong (5+ characters).");
      setState("error");
      return;
    }
    setState("sending");
    setMsg("");
    const { ok, data } = await reportContent({ targetType, targetId, reason: reason.trim() });
    if (ok) {
      setState("done");
      setMsg(data?.message ?? "Thanks — reported.");
    } else {
      setState("error");
      setMsg(data?.message ?? "Couldn't report. Try again.");
    }
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1 font-codingo-sans text-[12px] font-bold text-eager-green">
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
        Reported
      </span>
    );
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Report"
        title="Report"
        className="inline-flex items-center gap-1 font-codingo-sans text-[12px] font-bold text-pencil-gray/70 transition-colors hover:text-charcoal"
      >
        <Flag className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
      </button>
      {open ? (
        <form
          onSubmit={submit}
          className="absolute bottom-full right-0 z-20 mb-2 w-[240px] rounded-[12px] border-2 border-faded-gray bg-paper-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          <p className="font-codingo-sans text-[12px] font-bold text-charcoal">What&apos;s wrong?</p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="Spam, abuse, off-topic…"
            className="mt-1.5 w-full rounded-[10px] border-2 border-faded-gray px-2.5 py-1.5 font-codingo-sans text-[13px] font-medium text-charcoal focus:border-spark-blue focus:outline-none"
          />
          {msg && state === "error" ? (
            <p className="mt-1 font-codingo-sans text-[12px] font-bold text-[#e03131]" role="alert">
              {msg}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={state === "sending"}
            className="mt-2 w-full rounded-[10px] bg-charcoal px-3 py-1.5 font-codingo-sans text-[12px] font-bold uppercase tracking-[0.04em] text-paper-white disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Report"}
          </button>
        </form>
      ) : null}
    </span>
  );
}

export function ThreadView({ initialThread, initialReplies, currentUserId }) {
  const [thread, setThread] = useState(initialThread);
  const [replies, setReplies] = useState(initialReplies ?? []);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const threadId = initialThread.id;
  const idRef = useRef(threadId);
  useEffect(() => {
    idRef.current = threadId;
  }, [threadId]);

  // Live replies for this thread
  useEffect(() => {
    let es = null;
    let poll = null;
    let stopped = false;

    async function pollOnce() {
      if (stopped) return;
      try {
        const { ok, data } = await fetchThread(idRef.current);
        if (ok && !stopped) {
          setThread((prev) => ({ ...prev, ...data.thread }));
          setReplies((prev) => {
            const seen = new Map(prev.map((r) => [r.id, r]));
            for (const r of data.replies ?? []) seen.set(r.id, { ...seen.get(r.id), ...r });
            return [...seen.values()];
          });
        }
      } catch {}
    }

    function startPolling() {
      if (poll || stopped) return;
      setLive(false);
      poll = setInterval(pollOnce, 15000);
    }

    try {
      es = new EventSource(threadsStreamUrl(), { withCredentials: true });
    } catch {
      es = null;
    }
    if (!es) {
      startPolling();
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
    es.addEventListener("reply", (e) => {
      try {
        const r = JSON.parse(e.data);
        if (r.threadId !== idRef.current) return;
        setReplies((prev) => (prev.some((x) => x.id === r.id) ? prev : [...prev, r]));
        setThread((prev) => ({ ...prev, replyCount: (prev.replyCount ?? 0) + 1 }));
      } catch {}
    });
    es.addEventListener("thread", (e) => {
      try {
        const t = JSON.parse(e.data);
        if (t.id !== idRef.current) return;
        setThread((prev) => ({ ...prev, ...t }));
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
  }, []);

  async function handleThreadUpvote() {
    setThread((prev) => ({
      ...prev,
      viewerUpvoted: !prev.viewerUpvoted,
      votes: Math.max(0, prev.votes + (prev.viewerUpvoted ? -1 : 1)),
    }));
    try {
      const { ok, data } = await upvoteThread(threadId);
      if (ok) setThread((prev) => ({ ...prev, votes: data.votes, viewerUpvoted: data.upvoted }));
    } catch {}
  }

  async function handleReplyUpvote(id) {
    setReplies((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, viewerUpvoted: !r.viewerUpvoted, votes: Math.max(0, r.votes + (r.viewerUpvoted ? -1 : 1)) } : r,
      ),
    );
    try {
      const { ok, data } = await upvoteReply(id);
      if (ok) setReplies((prev) => prev.map((r) => (r.id === id ? { ...r, votes: data.votes, viewerUpvoted: data.upvoted } : r)));
    } catch {}
  }

  async function handleAccept(replyId) {
    const { ok, data } = await acceptReply(threadId, replyId);
    if (!ok) return;
    setThread((prev) => ({ ...prev, accepted: true }));
    setReplies((prev) => prev.map((r) => ({ ...r, isAccepted: r.id === data.acceptedReplyId })));
  }

  async function handleReply(e) {
    e.preventDefault();
    if (sending || !draft.trim()) return;
    setSending(true);
    try {
      const { ok, data } = await createReply(threadId, draft.trim());
      if (ok) {
        setReplies((prev) => (prev.some((r) => r.id === data.reply.id) ? prev : [...prev, data.reply]));
        setThread((prev) => ({ ...prev, replyCount: (prev.replyCount ?? 0) + 1 }));
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  }

  const ordered = [...replies].sort((a, b) => {
    if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
    if (b.votes !== a.votes) return b.votes - a.votes;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/app/community"
          className="inline-flex items-center gap-1 rounded-[12px] border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[13px] font-bold text-charcoal transition-colors hover:border-charcoal"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Feed
        </Link>
        <span className="flex items-center gap-1.5" aria-live="polite">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            {live ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-eager-green opacity-60" /> : null}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? "bg-eager-green" : "bg-faded-gray"}`} />
          </span>
          <span className="font-codingo-sans text-[12px] font-bold text-pencil-gray">{live ? "Live" : "Connecting…"}</span>
        </span>
      </div>

      {/* Question */}
      <article className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {thread.lessonTitle ? (
            <span className="rounded-full bg-[#e6f4ff] px-2.5 py-0.5 font-codingo-sans text-[11px] font-bold leading-[1.4] text-spark-blue">
              {thread.lessonTitle}
            </span>
          ) : (
            <span className="rounded-full bg-faded-gray/20 px-2.5 py-0.5 font-codingo-sans text-[11px] font-bold leading-[1.4] text-pencil-gray">
              General
            </span>
          )}
          {thread.accepted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-storybook-green px-2.5 py-0.5 font-codingo-sans text-[11px] font-black leading-[1.4] text-charcoal">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
              Answered
            </span>
          ) : null}
        </div>
        <h1 className="mt-2.5 font-codingo-sans text-[20px] font-bold leading-[1.25] text-charcoal sm:text-[22px]">
          {thread.title}
        </h1>
        <p className="mt-2 whitespace-pre-line font-codingo-sans text-[14px] font-medium leading-[1.55] text-charcoal sm:text-[15px]">
          {thread.body}
        </p>
        <div className="mt-4 flex items-center gap-3 border-t-2 border-faded-gray/40 pt-3.5">
          <Avatar username={thread.author?.username} />
          <div className="min-w-0">
            <p className="truncate font-codingo-sans text-[13px] font-bold leading-[1.2] text-charcoal">
              {thread.author?.username}
              {thread.author?.id === currentUserId ? <span className="font-medium text-pencil-gray"> (you)</span> : null}
            </p>
            <p className="font-codingo-sans text-[12px] font-medium leading-[1.2] text-pencil-gray">{timeAgo(thread.createdAt)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <ReportButton targetType="thread" targetId={thread.id} />
            <button
              type="button"
              onClick={handleThreadUpvote}
              aria-pressed={thread.viewerUpvoted}
              className={
                thread.viewerUpvoted
                  ? "inline-flex items-center gap-1 rounded-full border-2 border-eager-green bg-storybook-green px-3 py-1.5 font-codingo-sans text-[13px] font-black leading-none text-charcoal"
                  : "inline-flex items-center gap-1 rounded-full border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[13px] font-black leading-none text-pencil-gray transition-colors hover:border-charcoal hover:text-charcoal"
              }
            >
              <ArrowBigUp className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
              {thread.votes}
            </button>
          </div>
        </div>
      </article>

      {/* Replies */}
      <h2 className="mt-6 font-codingo-sans text-[15px] font-bold uppercase leading-[1.3] tracking-[0.053em] text-pencil-gray">
        {ordered.length ? `${ordered.length} ${ordered.length === 1 ? "reply" : "replies"}` : "Replies"}
      </h2>
      <div className="mt-3 flex flex-col gap-3">
        {ordered.map((r) => (
          <article
            key={r.id}
            className={
              r.isAccepted
                ? "rounded-[16px] border-2 border-eager-green bg-paper-white p-4 sm:p-5"
                : "rounded-[16px] border-2 border-faded-gray bg-paper-white p-4 sm:p-5"
            }
          >
            {r.isAccepted ? (
              <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-storybook-green px-2.5 py-0.5 font-codingo-sans text-[11px] font-black leading-[1.4] text-charcoal">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                Accepted answer
              </p>
            ) : null}
            {r.isAi ? (
              <p className="mb-2 inline-flex items-center rounded-full bg-[#e6f4ff] px-2.5 py-0.5 font-codingo-sans text-[11px] font-black leading-[1.4] text-spark-blue">
                AI helper
              </p>
            ) : null}
            <p className="whitespace-pre-line font-codingo-sans text-[14px] font-medium leading-[1.55] text-charcoal">
              {r.body}
            </p>
            <div className="mt-3 flex items-center gap-2.5 border-t-2 border-faded-gray/40 pt-3">
              <Avatar username={r.author?.username} />
              <div className="min-w-0">
                <p className="truncate font-codingo-sans text-[13px] font-bold leading-[1.2] text-charcoal">
                  {r.author?.username}
                  {r.author?.id === currentUserId ? <span className="font-medium text-pencil-gray"> (you)</span> : null}
                </p>
                <p className="font-codingo-sans text-[12px] font-medium leading-[1.2] text-pencil-gray">{timeAgo(r.createdAt)}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {thread.canAccept && !r.isAccepted && !thread.accepted ? (
                  <button
                    type="button"
                    onClick={() => handleAccept(r.id)}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-eager-green bg-paper-white px-2.5 py-1 font-codingo-sans text-[11px] font-black uppercase leading-none tracking-[0.04em] text-eager-green transition-colors hover:bg-storybook-green"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                    Accept
                  </button>
                ) : null}
                <ReportButton targetType="reply" targetId={r.id} />
                <button
                  type="button"
                  onClick={() => handleReplyUpvote(r.id)}
                  aria-pressed={r.viewerUpvoted}
                  className={
                    r.viewerUpvoted
                      ? "inline-flex items-center gap-1 rounded-full border-2 border-eager-green bg-storybook-green px-2.5 py-1 font-codingo-sans text-[12px] font-black leading-none text-charcoal"
                      : "inline-flex items-center gap-1 rounded-full border-2 border-faded-gray bg-paper-white px-2.5 py-1 font-codingo-sans text-[12px] font-black leading-none text-pencil-gray transition-colors hover:border-charcoal hover:text-charcoal"
                  }
                >
                  <ArrowBigUp className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
                  {r.votes}
                </button>
              </div>
            </div>
          </article>
        ))}
        {!ordered.length ? (
          <div className="rounded-[16px] border-2 border-dashed border-faded-gray bg-paper-white p-6 text-center">
            <p className="font-codingo-sans text-[14px] font-medium leading-[1.4] text-pencil-gray">
              No replies yet — share what you know and help a fellow learner.
            </p>
          </div>
        ) : null}
      </div>

      {/* Reply composer — sticky above bottom nav on mobile */}
      <form
        onSubmit={handleReply}
        className="sticky bottom-[76px] mt-5 rounded-[16px] border-2 border-charcoal bg-paper-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.10)] sm:p-4 md:bottom-6"
      >
        <label htmlFor="reply-box" className="sr-only">
          Write a reply
        </label>
        <div className="flex items-end gap-2.5">
          <textarea
            id="reply-box"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Write a helpful reply…"
            className="max-h-[160px] min-w-0 flex-1 resize-y rounded-[12px] border-2 border-faded-gray bg-paper-white px-3.5 py-2.5 font-codingo-sans text-[14px] font-medium leading-[1.45] text-charcoal placeholder:text-pencil-gray/70 focus:border-spark-blue focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Send reply"
            className="codingo-btn codingo-btn-primary flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] border-2 border-eager-green bg-eager-green text-paper-white hover:brightness-95 disabled:opacity-50"
          >
            <Send className="h-4.5 w-4.5" strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
