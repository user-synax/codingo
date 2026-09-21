import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

/* Fail fast when MongoDB is unreachable instead of letting Mongoose buffer
   the operation (which leaves the client spinner hanging for 10-30s and
   then surfaces a generic 500). Health checks bypass this middleware. */
export function requireDb(_req: Request, res: Response, next: NextFunction) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Service temporarily unavailable — database is reconnecting. Try again in a moment.",
    });
  }
  next();
}
