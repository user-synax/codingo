import {
  BookOpen,
  Users,
  Heart,
  MessageCircle,
  FileText,
  Sparkles,
  Trophy,
  ShieldCheck,
  Bell,
} from "lucide-react";
import LegalPage from "@/components/legal/LegalPage";

export const metadata = {
  title: "Terms of Service",
  description:
    "The rules for using Codingo — a free, community-driven place to learn programming.",
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  {
    id: "welcome",
    icon: BookOpen,
    heading: "Welcome to Codingo",
    paragraphs: [
      "Codingo (codingo.synax.me) is a free, community-driven web app for learning programming through short, gamified lessons. It is a solo-built learning project run by Ayush — lessons, community threads, and an AI doubt helper, all free with no paywalls, hearts, or energy limits.",
      "By creating an account or using Codingo, you agree to these terms. If you do not agree, please do not use the app.",
    ],
  },
  {
    id: "who-can-join",
    icon: Users,
    heading: "Who can join",
    paragraphs: [
      "You must be at least 13 years old to use Codingo. When you sign up, give accurate information and keep your password private — you are responsible for all activity under your account.",
      "One account per person, so streaks, XP, and badges stay meaningful for everyone. If you sign in with Google, Google's own terms apply to that sign-in alongside these terms.",
    ],
  },
  {
    id: "free-fair-use",
    icon: Heart,
    heading: "Free forever, fair use",
    paragraphs: [
      "Codingo is free: no paywalls, no hearts, no energy limits. To keep it that way for everyone, fair use applies:",
    ],
    bullets: [
      "No automated scraping, bulk account creation, or attempts to overload the service.",
      "The AI doubt helper has per-user daily limits to control cost — hammering past them may get you rate-limited.",
      "Abuse of free resources may lead to rate limiting, suspension, or removal.",
    ],
  },
  {
    id: "community",
    icon: MessageCircle,
    heading: "Community rules",
    paragraphs: [
      "Lesson threads and replies are public — they may appear on public profiles, showcases, and in search results. Be kind and helpful: no spam, harassment, hate speech, explicit content, or cheating services. Never post passwords, API keys, or anyone's private information.",
      "Use the report button when you see something wrong. Reported content can be removed, and repeat offenders can lose community access or their account.",
    ],
  },
  {
    id: "content",
    icon: FileText,
    heading: "Lessons and your content",
    paragraphs: [
      "Lessons and exercises are provided as-is for learning purposes. You keep ownership of what you post, but by posting threads or replies you grant Codingo permission to display and distribute that content inside the app.",
      "Respect other people's work: do not repost private or copyrighted material that is not yours, and do not copy lesson content to competing services in bulk.",
    ],
  },
  {
    id: "ai-helper",
    icon: Sparkles,
    heading: "AI helper answers can be wrong",
    paragraphs: [
      "The AI doubt helper explains concepts and gives hints first rather than revealing full solutions, in English and Hinglish. It is a study aid, not a teacher: its answers can be wrong, so always verify code and facts before trusting them. Nothing it says counts as professional advice.",
    ],
  },
  {
    id: "progress",
    icon: Trophy,
    heading: "XP, streaks, and badges",
    paragraphs: [
      "XP, levels, streaks, and badges are motivational records of your practice — not certifications, grades, or proof of skill. Streaks are counted in your timezone (Asia/Kolkata by default) and progress can be reset or adjusted to fix bugs or cheating.",
    ],
  },
  {
    id: "enforcement",
    icon: ShieldCheck,
    heading: "Breaking the rules",
    paragraphs: [
      "If you break these terms, we may warn you, rate-limit you, remove your content, restrict community access, or suspend your account — depending on severity. If you think a decision was a mistake, reach out through the GitHub repository and we will take another look.",
    ],
  },
  {
    id: "changes",
    icon: Bell,
    heading: "Changes to these terms",
    paragraphs: [
      "Codingo is growing, so these terms may be updated from time to time. The latest version always lives on this page with its update date — continued use after changes means you accept the new terms. Thanks for being part of this community learning project.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The short version: Codingo is free, the community is kind, and everyone plays fair. The details live below."
      sections={SECTIONS}
      related={{ label: "Read the Privacy Policy", href: "/policy" }}
      cta={{
        heading: "Agree the fun way — start learning",
        text: "Create a free account in under a minute. Bite-sized lessons, real code in your browser, and a community that helps you get unstuck.",
        buttonLabel: "Start learning free",
        buttonHref: "/signup",
        secondaryHref: "/policy",
        secondaryLabel: "How we handle your data",
      }}
    />
  );
}
