/* Central API helper — talks to the separate Express backend.
   API base comes from NEXT_PUBLIC_API_URL, defaulting to
   http://localhost:4000 for local dev (matches backend/.env PORT).
   Cookies are httpOnly, so every request must use credentials: include. */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export async function apiFetch(path, { method = "GET", body, headers, ...init } = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(url, {
    method,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    credentials: "include",
    body: body !== undefined ? (isForm ? body : JSON.stringify(body)) : undefined,
    ...init,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  return { res, data, ok: res.ok, status: res.status };
}

export async function registerUser({ username, email, password }) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: { username, email, password },
  });
}

export async function loginUser({ email, password }) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function fetchMe() {
  return apiFetch("/api/auth/me", { method: "GET" });
}

export async function logoutUser() {
  return apiFetch("/api/auth/logout", { method: "POST" });
}

/* Google sign-in — official-button ID token verified by the backend.
   Returns { user, isNewUser }; new users still need the onboarding wizard. */
export async function googleSignIn({ credential }) {
  return apiFetch("/api/auth/google", {
    method: "POST",
    body: { credential },
  });
}

export async function patchOnboarding(payload) {
  return apiFetch("/api/auth/onboarding", {
    method: "PATCH",
    body: payload,
  });
}

export async function fetchCourses() {
  return apiFetch("/api/courses", { method: "GET" });
}

export async function fetchLesson(lessonId) {
  return apiFetch(`/api/lessons/${lessonId}`, { method: "GET" });
}

export async function fetchProgressMe() {
  return apiFetch("/api/progress/me", { method: "GET" });
}

export async function saveProgress({ lessonId, score, completed, firstTry }) {
  return apiFetch("/api/progress", {
    method: "POST",
    body: { lessonId, score, completed, firstTry },
  });
}

/* Community — doubt threads per lesson (PRD 5.5) */

export async function fetchThreads({ lessonId, sort = "new", limit = 20, before } = {}) {
  const q = new URLSearchParams();
  if (lessonId) q.set("lessonId", lessonId);
  if (sort) q.set("sort", sort);
  if (limit) q.set("limit", String(limit));
  if (before) q.set("before", before);
  const qs = q.toString();
  return apiFetch(`/api/threads${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function createThread({ title, body, lessonId }) {
  return apiFetch("/api/threads", {
    method: "POST",
    body: { title, body, lessonId: lessonId || null },
  });
}

export async function fetchThread(threadId) {
  return apiFetch(`/api/threads/${threadId}`, { method: "GET" });
}

export async function createReply(threadId, body) {
  return apiFetch(`/api/threads/${threadId}/replies`, {
    method: "POST",
    body: { body },
  });
}

export async function upvoteThread(threadId) {
  return apiFetch(`/api/threads/${threadId}/upvote`, { method: "POST" });
}

export async function upvoteReply(replyId) {
  return apiFetch(`/api/threads/replies/${replyId}/upvote`, { method: "POST" });
}

export async function acceptReply(threadId, replyId) {
  return apiFetch(`/api/threads/${threadId}/accept`, {
    method: "POST",
    body: { replyId },
  });
}

export async function reportContent({ targetType, targetId, reason }) {
  return apiFetch("/api/threads/reports", {
    method: "POST",
    body: { targetType, targetId, reason },
  });
}

/* SSE live-feed URL — EventSource can't set headers, but the httpOnly
   cookie is sent with `withCredentials: true` (backend allows credentials). */
export function threadsStreamUrl(lessonId) {
  return `${API_BASE}/api/threads/stream${lessonId ? `?lessonId=${lessonId}` : ""}`;
}

/* AI doubt helper (PRD 5.6) */

export async function askAi({ lessonId, exerciseId, question, code }) {
  return apiFetch("/api/ai/help", {
    method: "POST",
    body: { lessonId, exerciseId, question, code },
  });
}

export async function aiStatus() {
  return apiFetch("/api/ai/status", { method: "GET" });
}

/* Profile — customization + public showcase */

export async function updateMe(payload) {
  return apiFetch("/api/users/me", {
    method: "PATCH",
    body: payload,
  });
}

export async function uploadAvatarFile(file) {
  const form = new FormData();
  form.append("avatar", file);
  return apiFetch("/api/users/me/avatar", {
    method: "POST",
    body: form,
  });
}

export async function fetchPublicProfile(username) {
  return apiFetch(`/api/users/u/${encodeURIComponent(username)}`, { method: "GET" });
}
