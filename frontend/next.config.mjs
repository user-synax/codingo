/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Same-origin API: the browser talks only to the frontend domain, so the
    // session cookie is first-party and visible to both client components and
    // the Next server (which forwards it to the backend). BACKEND_URL is
    // server-only — never exposed to the browser.
    const backend = process.env.BACKEND_URL ?? "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Service workers must always revalidate — a cached sw.js would
        // pin users to stale app shells and block PWA updates.
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
