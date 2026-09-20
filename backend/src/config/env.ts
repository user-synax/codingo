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
  // Appwrite avatar storage (server-side, API key never leaves the backend).
  // Optional — avatar upload returns 501 until all four are set.
  appwriteEndpoint: process.env.APPWRITE_ENDPOINT ?? "",
  appwriteProjectId: process.env.APPWRITE_PROJECT_ID ?? "",
  appwriteBucketId: process.env.APPWRITE_BUCKET_ID ?? "",
  appwriteApiKey: process.env.APPWRITE_API_KEY ?? "",
} as const;

export const isAppwriteConfigured =
  Boolean(env.appwriteEndpoint) &&
  Boolean(env.appwriteProjectId) &&
  Boolean(env.appwriteBucketId) &&
  Boolean(env.appwriteApiKey);
