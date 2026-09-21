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
  // Cookie domain for split deployments behind same-origin rewrites.
  // The backend sets the session cookie, but the browser only talks to the
  // frontend domain — so the cookie must be scoped to it (e.g. COOKIE_DOMAIN
  // = codingo.synax.me on Render). Unset in dev: host-only localhost cookies.
  cookieDomain: process.env.COOKIE_DOMAIN ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: (process.env.NODE_ENV ?? "development") === "production",
  // Appwrite avatar storage (server-side, API key never leaves the backend).
  // Optional — avatar upload returns 501 until all four are set.
  appwriteEndpoint: process.env.APPWRITE_ENDPOINT ?? "",
  appwriteProjectId: process.env.APPWRITE_PROJECT_ID ?? "",
  appwriteBucketId: process.env.APPWRITE_BUCKET_ID ?? "",
  appwriteApiKey: process.env.APPWRITE_API_KEY ?? "",
  // Google sign-in (ID-token / credential flow via the official Google button).
  // Only the Client ID is needed — the backend verifies the ID token audience.
  // Empty until the Google Cloud OAuth client is created (returns 501 meanwhile).
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  // AI doubt helper (PRD 5.6) — Groq primary, OpenRouter optional fallback.
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
  openrouterModel: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free",
  aiDailyLimit: (() => {
    const v = Number(process.env.AI_DAILY_LIMIT);
    return Number.isFinite(v) && v > 0 ? v : 20;
  })(),
  aiAutoReplyDelayMs: (() => {
    const v = Number(process.env.AI_AUTO_REPLY_DELAY_MS);
    return Number.isFinite(v) && v > 0 ? v : 3 * 60 * 1000;
  })(),
} as const;

export const isGoogleConfigured = Boolean(env.googleClientId);

export const isAppwriteConfigured =
  Boolean(env.appwriteEndpoint) &&
  Boolean(env.appwriteProjectId) &&
  Boolean(env.appwriteBucketId) &&
  Boolean(env.appwriteApiKey);
