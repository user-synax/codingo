import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env.js";
import authRouter from "./routes/auth.js";
import coursesRouter from "./routes/courses.js";
import lessonsRouter from "./routes/lessons.js";
import progressRouter from "./routes/progress.js";
import communityRouter from "./routes/community.js";
import usersRouter from "./routes/users.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false }));

  const allowedOrigins = [env.frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"];
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, true); // allow all for dev ease; tighten in prod if needed
      },
      credentials: true,
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "codingo-backend", env: env.nodeEnv });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/courses", coursesRouter);
  app.use("/api/lessons", lessonsRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/threads", communityRouter);
  app.use("/api/users", usersRouter);

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
