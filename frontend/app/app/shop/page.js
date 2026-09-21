import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { ShopClient } from "@/components/shop/ShopClient";

export const metadata = {
  title: "Shop — Codingo",
  robots: { index: false, follow: false },
};

async function getEconomy() {
  const cookieStore = await cookies();
  const res = await fetch(`${API_BASE}/api/economy/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

export default async function ShopPage() {
  const [user, economy] = await Promise.all([getCurrentUser(), getEconomy()]);
  // Fallback economy from user if API fails
  const eco = economy ?? {
    cc: user?.cc ?? 50,
    hearts: user?.hearts ?? 3,
    heartsCap: 3,
    regenInMs: 0,
    fullInMs: 0,
    dailyGoalXp: user?.dailyGoalXp ?? 50,
    dailyXp: user?.dailyXp ?? 0,
    freezes: user?.freezes ?? 0,
    prices: { heartSingle: 20, heartFull: 50, freeze: 50 },
  };
  return <ShopClient user={user} initialEconomy={eco} />;
}
