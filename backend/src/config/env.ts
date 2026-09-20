import dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: requireEnv("MONGODB_URI", "mongodb://localhost:27017/codingo"),
  jwtSecret: requireEnv("JWT_SECRET"),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: (process.env.NODE_ENV ?? "development") === "production",
} as const;
