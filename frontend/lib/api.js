/* Central API helper — talks to the separate Express backend.
   API base comes from NEXT_PUBLIC_API_URL, defaulting to
   http://localhost:4000 for local dev (matches backend/.env PORT).
   Cookies are httpOnly, so every request must use credentials: include. */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export async function apiFetch(path, { method = "GET", body, headers, ...init } = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

export async function patchOnboarding(payload) {
  return apiFetch("/api/auth/onboarding", {
    method: "PATCH",
    body: payload,
  });
}
