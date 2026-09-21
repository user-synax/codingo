import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(): Promise<void> {
  const uri = env.mongoUri;
  // Fail fast: a blocked/unreachable host (e.g. Atlas IP allowlist missing
  // Render) should surface in ~8s, not hang requests for the 30s default.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`[db] connected to ${uri.replace(/:\/\/.*@/, "://***@")}`);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
