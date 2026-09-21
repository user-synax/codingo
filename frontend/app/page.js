import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { siteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { LearningPath } from "@/components/landing/LearningPath";
import { ExerciseTypes } from "@/components/landing/ExerciseTypes";
import { Community } from "@/components/landing/Community";
import { Stats } from "@/components/landing/Stats";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

/* Structured data — helps Google show rich results (free app, rating-free).
   Kept static so it never leaks user data. */
function JsonLd() {
  const base = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: base,
    description: SITE_DESCRIPTION,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isAccessibleForFree: true,
    inLanguage: "en",
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    if (!user.onboardingCompleted) redirect("/onboarding");
    redirect("/app");
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper-white font-codingo-sans text-charcoal">
      <JsonLd />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <LearningPath />
        <ExerciseTypes />
        <Community />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
