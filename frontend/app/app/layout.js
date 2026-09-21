import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/app/Sidebar";
import { BottomNav } from "@/components/app/BottomNav";
import { TopbarStats } from "@/components/app/UserStats";
import { BrandLogo } from "@/components/BrandLogo";
import { ProgressHydrator } from "@/components/progress/ProgressHydrator";

export const metadata = {
  title: { absolute: "App — Codingo" },
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-paper-white font-codingo-sans text-charcoal">
      <ProgressHydrator user={user} userId={user?._id ?? user?.id} />
      <Sidebar user={user} />
      {/* Desktop offset for fixed sidebar */}
      <div className="flex min-h-screen flex-col md:pl-[280px]">
        {/* Mobile top bar — logo + streak / XP / level pills (lucide icons, no emoji) */}
        <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between border-b-2 border-faded-gray bg-paper-white px-3 sm:px-4 md:hidden">
          <BrandLogo href="/app" size={28} wordmarkSize="text-[20px]" />
          <TopbarStats streakCount={user.streak?.count ?? 0} xp={user.xp ?? 0} level={user.level ?? 1} />
        </header>
        <main className="flex-1 px-4 py-6 pb-[88px] sm:px-6 lg:px-8 md:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
