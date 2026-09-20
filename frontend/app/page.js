import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";

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
      </main>
    </div>
  );
}
