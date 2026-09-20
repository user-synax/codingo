import { NextResponse } from "next/server";

/* Protect landing from logged-in users and /app from guests.
   Fast cookie-existence check at the edge; server layouts
   do the real JWT verification via backend /api/auth/me. */
export default function proxy(req) {
  const token = req.cookies.get("codingo_token")?.value;
  const isAuthed = Boolean(token);
  const { pathname } = req.nextUrl;

  // Logged-in users shouldn't see marketing / auth pages
  if (isAuthed && (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  // Guests shouldn't see the app
  if (!isAuthed && pathname.startsWith("/app")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/app/:path*", "/login", "/signup", "/forgot-password"],
};
