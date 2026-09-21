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
  // Vercel frontend × Render backend are different sites: cross-site fetch
  // never sends SameSite=Lax cookies, so production needs SameSite=None
  // (which requires Secure — already true in prod, browsers accept it since
  // Render serves HTTPS). Local dev keeps Lax so http://localhost keeps working.
  return {
    httpOnly: true as const,
    secure: env.isProd,
    sameSite: (env.isProd ? "none" : "lax") as "none" | "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/" as const,
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true as const,
    secure: env.isProd,
    sameSite: (env.isProd ? "none" : "lax") as "none" | "lax",
    path: "/" as const,
  };
}
