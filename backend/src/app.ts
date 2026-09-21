import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env.js";
import { requireDb } from "./middleware/db.js";
import authRouter from "./routes/auth.js";
import coursesRouter from "./routes/courses.js";
import lessonsRouter from "./routes/lessons.js";
import progressRouter from "./routes/progress.js";
import communityRouter from "./routes/community.js";
import usersRouter from "./routes/users.js";
import leaderboardRouter from "./routes/leaderboard.js";
import economyRouter from "./routes/economy.js";
import aiRouter from "./routes/ai.js";

export function createApp() {
  const app = express();

  // Behind Render's reverse proxy: without this, every user shares the proxy
  // IP, so the auth/AI rate limiters would throttle ALL users together.
  // Render terminates TLS at its proxy and forwards one hop, so 1 is correct.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false }));

  // Production (custom domain × Render) is cross-site with credentials, so the
  // allowlist is strict there. Local dev stays permissive for ease.
  // FRONTEND_URL may be a single origin or a comma-separated list.
  // The canonical prod origins are always allowed so a stale Render env var
  // can't take down auth with a CORS preflight failure.
  const normalizeOrigin = (v: string) => v.trim().replace(/\/+$/, "");
  const allowedOrigins = new Set(
    [
      ...env.frontendUrl.split(",").map(normalizeOrigin),
      "https://codingo.synax.me",
      "https://www.codingo.synax.me",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter(Boolean),
  );
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (allowedOrigins.has(normalizeOrigin(origin))) return cb(null, true);
        if (!env.isProd) return cb(null, true); // allow all for dev ease only
        return cb(new Error("CORS: origin not allowed."));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 204,
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "codingo-backend", env: env.nodeEnv });
  });

  // Every other /api route needs MongoDB — fail fast with 503 instead of
  // buffering the query and leaving the client hanging on a spinner.
  app.use("/api", requireDb);

  app.use("/api/auth", authRouter);
  app.use("/api/courses", coursesRouter);
  app.use("/api/lessons", lessonsRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/threads", communityRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/leaderboard", leaderboardRouter);
  app.use("/api/economy", economyRouter);
  app.use("/api/ai", aiRouter);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ message: "Not found." });
  });

  // Error handler — keep JSON parse failures from crashing the process
  app.use(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("[unhandled]", err);
      if (res.headersSent) return;
      const status =
        typeof err === "object" && err !== null && "statusCode" in err && typeof (err as { statusCode: unknown }).statusCode === "number"
          ? (err as { statusCode: number }).statusCode
          : typeof err === "object" && err !== null && "status" in err && typeof (err as { status: number }).status === "number"
            ? (err as { status: number }).status
            : 500;
      const message =
        err instanceof SyntaxError && "body" in (err as unknown as Record<string, unknown>)
          ? "Invalid JSON payload."
          : err instanceof Error
            ? err.message
            : "Internal server error.";
      res.status(status).json({ message });
    },
  );

  return app;
}
