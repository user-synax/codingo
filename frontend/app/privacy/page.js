import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Privacy Policy",
  description: "How Codingo collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    h: "What we collect",
    ps: [
      "Account data you give us: name, username, email, and password (stored hashed — we never see it). If you sign in with Google, we receive your name, verified email, and profile picture.",
      "Learning data: lesson progress, XP, streaks, badges, and onboarding answers (age, country, language) used to personalize your path.",
      "Community data: threads, replies, and votes you post. Public profiles show your name, stats, and badges unless you set your profile to private.",
      "AI helper data: questions you ask the AI doubt helper, stored briefly with rate-limit counters to control cost and abuse.",
    ],
  },
  {
    h: "How we use it",
    ps: [
      "To run the app: authentication, saving progress, streaks, leaderboards-in-spirit, and community features.",
      "To improve learning: understanding which lessons work and fixing confusing ones. We do not sell your data, and we show no ads.",
    ],
  },
  {
    h: "Cookies",
    ps: [
      "We use one strictly-necessary cookie (codingo_token) that keeps you logged in for 7 days. It is httpOnly so page scripts cannot read it. Without it, the app cannot remember you.",
    ],
  },
  {
    h: "Third parties",
    ps: [
      "MongoDB Atlas stores our database. Google verifies sign-ins (see Google's own privacy policy). Appwrite stores avatar uploads if enabled. Our AI helper sends your question plus lesson context to our configured AI provider — never your password.",
    ],
  },
  {
    h: "Your choices",
    ps: [
      "Set your profile to private in Settings to hide stats from the public showcase. Log out any time to clear your session cookie. To delete your account and data, contact us via the GitHub repository and we will remove it.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper-white font-codingo-sans text-charcoal">
      <Navbar />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-12 sm:px-6">
        <p className="font-codingo-sans text-[12px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Legal</p>
        <h1 className="mt-1 font-feather text-[32px] font-black leading-[1.1] tracking-[-0.02em] text-charcoal sm:text-[40px]">
          Privacy Policy
        </h1>
        <p className="mt-2 font-codingo-sans text-[14px] font-medium text-pencil-gray">Last updated: September 2026</p>
        <div className="mt-8 flex flex-col gap-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="font-codingo-sans text-[19px] font-black text-charcoal">{s.h}</h2>
              {s.ps.map((p, i) => (
                <p key={i} className="mt-2 font-codingo-sans text-[15px] font-medium leading-[1.6] text-charcoal">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
        <p className="mt-10 font-codingo-sans text-[14px] font-medium text-pencil-gray">
          Questions?{" "}
          <Link href="/signup" className="font-bold text-spark-blue hover:underline">
            Create a free account
          </Link>{" "}
          and ask in the community — or open an issue on GitHub.
        </p>
      </main>
      <Footer />
    </div>
  );
}
