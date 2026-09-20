import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function main() {
  try {
    await connectDb();
  } catch (err) {
    console.error("[db] failed to connect — server will stay up for /api/health checks:", err instanceof Error ? err.message : err);
    console.error("[db] fix MONGODB_URI in backend/.env and restart. Auth routes will return 500 until DB is reachable.");
  }
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[codingo] backend listening on http://localhost:${env.port}`);
    console.log(`[codingo] frontend origin ${env.frontendUrl}`);
    console.log(`[codingo] health http://localhost:${env.port}/api/health`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[codingo] ${signal} — shutting down`);
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
