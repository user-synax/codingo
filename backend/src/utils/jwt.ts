import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string; // userId
  username: string;
  email: string;
};

const EXPIRES_IN = "7d";
const COOKIE_NAME = "codingo_token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

export const cookieName = COOKIE_NAME;
export const cookieMaxAge = COOKIE_MAX_AGE_MS;

export function cookieOptions() {
  // Same-origin API (Next rewrites /api/* to the backend), so the session
  // cookie is first-party: SameSite=Lax works everywhere and keeps decent
  // CSRF protection. `domain` scopes it to the frontend host — required in
  // split deployments, because without it the cookie would belong to the
  // backend's host and the Next server would never see it (invisible session
  // → redirect loops after login). Unset locally: host-only localhost.
  const base = {
    httpOnly: true as const,
    secure: env.isProd,
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/" as const,
  };
  return env.cookieDomain ? { ...base, domain: env.cookieDomain } : base;
}

export function clearCookieOptions() {
  const base = {
    httpOnly: true as const,
    secure: env.isProd,
    sameSite: "lax" as const,
    path: "/" as const,
  };
  return env.cookieDomain ? { ...base, domain: env.cookieDomain } : base;
}
