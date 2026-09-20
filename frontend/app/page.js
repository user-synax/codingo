import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { LearningPath } from "@/components/landing/LearningPath";
import { ExerciseTypes } from "@/components/landing/ExerciseTypes";
import { Community } from "@/components/landing/Community";
import { Stats } from "@/components/landing/Stats";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    if (!user.onboardingCompleted) redirect("/onboarding");
    redirect("/app");
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper-white font-codingo-sans text-charcoal">
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
