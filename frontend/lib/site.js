/* Canonical site URL for SEO (metadataBase, canonicals, sitemap, OG images).
   Set NEXT_PUBLIC_SITE_URL to the production domain (e.g. https://codingo.synax.me).
   Falls back to Vercel's automatic URL, then localhost for dev. */

function normalize(url) {
  return String(url ?? "").trim().replace(/\/$/, "");
}

export function siteUrl() {
  const explicit = normalize(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit;
  const vercel = normalize(process.env.VERCEL_URL);
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_NAME = "Codingo";
export const SITE_TAGLINE = "Learn to code. Free. Fun. Together.";
export const SITE_DESCRIPTION =
  "Codingo is a free, Duolingo-style web app for learning programming — bite-sized lessons, real code in your browser, XP, streaks, and a community that helps you get unstuck.";
export const OG_IMAGE = "/og-image.png";
