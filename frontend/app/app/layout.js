import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/app/Sidebar";
import { BottomNav } from "@/components/app/BottomNav";
import { TopbarStats } from "@/components/app/UserStats";

export const metadata = {
  title: "App — Codingo",
};

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-paper-white font-codingo-sans text-charcoal">
      <Sidebar user={user} />
      {/* Desktop offset for fixed sidebar */}
      <div className="flex min-h-screen flex-col md:pl-[280px]">
        {/* Mobile top bar — logo + streak / XP / level pills (lucide icons, no emoji) */}
        <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between border-b-2 border-faded-gray bg-paper-white px-3 sm:px-4 md:hidden">
          <span className="font-feather text-[20px] font-black tracking-[-0.02em] text-eager-green">Codingo</span>
          <TopbarStats streakCount={user.streak?.count ?? 0} xp={user.xp ?? 0} level={user.level ?? 1} />
        </header>
        <main className="flex-1 px-4 py-6 pb-[88px] sm:px-6 lg:px-8 md:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
