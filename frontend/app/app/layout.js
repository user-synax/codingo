import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/app/Sidebar";
import { BottomNav } from "@/components/app/BottomNav";

export const metadata = {
  title: "App — Codingo",
};

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-paper-white font-codingo-sans text-charcoal">
      <Sidebar user={user} />
      {/* Desktop offset for fixed sidebar */}
      <div className="flex min-h-screen flex-col md:pl-[280px]">
        {/* Mobile top bar — keeps Codingo visible without sidebar */}
        <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between border-b-2 border-faded-gray bg-paper-white px-4 md:hidden">
          <span className="font-feather text-[22px] font-black tracking-[-0.02em] text-eager-green">Codingo</span>
          <span className="rounded-full bg-storybook-green px-3 py-1 font-codingo-sans text-[12px] font-bold text-charcoal">
            Lv {user.level ?? 1} · {user.xp ?? 0} XP
          </span>
        </header>
        <main className="flex-1 px-4 py-6 pb-[88px] sm:px-6 lg:px-8 md:pb-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
