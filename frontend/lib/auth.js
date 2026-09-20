import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";

/* Server-only helper — reads the httpOnly codingo_token cookie
   and asks the Express backend for the current user.
   Returns the public user object or null if not authenticated.
   Uses cookies().toString() so all cookies are forwarded. */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("codingo_token")?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      headers: {
        Cookie: cookieStore.toString(),
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? null;
  } catch {
    return null;
  }
}
