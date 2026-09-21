import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { siteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, OG_IMAGE } from "@/lib/site";
import { RegisterSW } from "@/components/pwa/RegisterSW";

/* design.md substitutes: feather/ codingo-sans are unavailable, so
   Nunito (800/900) backs --font-feather (display) and Nunito Sans
   (500/700) backs --font-codingo-sans (body). */

const feather = Nunito({
  variable: "--font-feather",
  subsets: ["latin"],
  weight: ["800", "900"],
  display: "swap",
});

const codingoSans = Nunito_Sans({
  variable: "--font-codingo-sans",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

const BASE = siteUrl();

export const metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "learn to code",
    "learn programming free",
    "coding for beginners",
    "javascript lessons",
    "code with AI",
    "duolingo for coding",
    "programming practice",
    "coding streak",
  ],
  authors: [{ name: "Ayush", url: "https://github.com/user-synax" }],
  creator: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: BASE,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 512,
        height: 512,
        alt: `${SITE_NAME} logo — learn to code free, fun, together`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#58cc02",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${feather.variable} ${codingoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper-white font-codingo-sans text-charcoal">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
