import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";

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

export const metadata = {
  title: "Codingo - Learn programming in fun way",
  description:
    "A free web app for learning programming through short, gamified lessons with the look and feel of Duolingo.",
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
    title: "Codingo - Learn programming in fun way",
    description:
      "A free web app for learning programming through short, gamified lessons with the look and feel of Duolingo.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Codingo - Learn programming in fun way",
    description:
      "A free web app for learning programming through short, gamified lessons with the look and feel of Duolingo.",
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
        {children}
      </body>
    </html>
  );
}
