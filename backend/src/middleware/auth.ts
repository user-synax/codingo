import type { Request, Response, NextFunction } from "express";
import { verifyJwt, cookieName } from "../utils/jwt.js";
import { User } from "../models/User.js";

export type AuthedRequest = Request & {
  userId?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
    avatar?: string;
    xp: number;
    level: number;
  };
};

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = (req.cookies as Record<string, string | undefined>)?.[cookieName];
  if (!token) {
    return res.status(401).json({ message: "Not authenticated." });
  }
  try {
    const payload = verifyJwt(token);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }
    req.userId = String(user._id);
    req.user = {
      id: String(user._id),
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      xp: user.xp,
      level: user.level,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const token = (req.cookies as Record<string, string | undefined>)?.[cookieName];
  if (!token) return next();
  try {
    const payload = verifyJwt(token);
    req.userId = payload.sub;
  } catch {
    // ignore
  }
  next();
}
