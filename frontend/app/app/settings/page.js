import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata = {
  title: { absolute: "Settings — Codingo" },
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/app/profile"
          className="inline-flex items-center gap-1 rounded-[12px] border-2 border-faded-gray bg-paper-white px-3 py-1.5 font-codingo-sans text-[13px] font-bold text-charcoal transition-colors hover:border-charcoal"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Profile
        </Link>
        <h1 className="font-codingo-sans text-[22px] font-bold leading-[1.2] text-charcoal">Settings</h1>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}
