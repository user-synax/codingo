import { siteUrl } from "@/lib/site";

/* Crawlers may index the landing, auth, legal, and public profile pages.
   The authenticated app shell and onboarding flow are disallowed (and
   noindexed in metadata) so Google spends crawl budget on public pages. */

export default function robots() {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/u/"],
        disallow: ["/app/", "/onboarding", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
