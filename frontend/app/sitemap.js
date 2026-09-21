import { siteUrl } from "@/lib/site";

/* Public sitemap — only indexable routes. Auth-walled /app/* and /onboarding
   stay out to protect crawl budget (they're noindexed in metadata too). */

export default function sitemap() {
  const base = siteUrl();
  const now = new Date();
  const pages = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/signup", priority: 0.8, changeFrequency: "monthly" },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];
  return pages.map((p) => ({
    url: `${base}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
