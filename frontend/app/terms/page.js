import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Terms of Service",
  description: "The rules for using Codingo — free learning with a friendly community.",
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  {
    h: "Free forever, fair use",
    ps: [
      "Codingo is free: no paywalls, no hearts, no energy limits. Fair use applies — automated scraping, bulk account creation, or hammering the AI helper past its daily limits may get rate-limited or removed.",
    ],
  },
  {
    h: "Your account",
    ps: [
      "You must be at least 13 years old. Keep your password private — you are responsible for activity under your account. One account per person for streaks and XP to stay meaningful.",
    ],
  },
  {
    h: "Community rules",
    ps: [
      "Be kind and helpful. No spam, harassment, hate, explicit content, or cheating services. Do not post passwords, keys, or anyone's private information. Reported content can be removed, and repeat offenders can lose community access.",
      "Your threads and replies may be shown publicly, including on public profile showcases and in search results.",
    ],
  },
  {
    h: "Learning content",
    ps: [
      "Lessons and exercises are provided as-is for learning. AI helper answers can be wrong — always verify before trusting code or facts. Progress, XP, and streaks are motivational records, not certifications.",
    ],
  },
  {
    h: "Changes",
    ps: [
      "We may update these terms as the app grows; continued use after changes means you accept them. This is a community learning project — thanks for being part of it.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper-white font-codingo-sans text-charcoal">
      <Navbar />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-12 sm:px-6">
        <p className="font-codingo-sans text-[12px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Legal</p>
        <h1 className="mt-1 font-feather text-[32px] font-black leading-[1.1] tracking-[-0.02em] text-charcoal sm:text-[40px]">
          Terms of Service
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
          Ready to agree the fun way?{" "}
          <Link href="/signup" className="font-bold text-spark-blue hover:underline">
            Start learning free
          </Link>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
