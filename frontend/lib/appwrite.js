/* Secure avatar upload — the file goes to OUR backend
   (POST /api/users/me/avatar), which uploads to Appwrite Storage with
   the server API key. The key never reaches the browser.
   Same signature as before: resolves to a URL string, or null. */

import { API_BASE } from "./api";

export async function uploadAvatar(file) {
  if (!(file instanceof File)) return null;
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return null;
  if (file.size > 2 * 1024 * 1024) return null;

  try {
    const form = new FormData();
    form.append("avatar", file);
    const res = await fetch(`${API_BASE}/api/users/me/avatar`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.avatar === "string" ? data.avatar : null;
  } catch {
    return null;
  }
}
