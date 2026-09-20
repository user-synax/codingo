import { getCurrentUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="font-codingo-sans text-[28px] font-bold leading-[1.2] text-charcoal">Profile</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-6">
          <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Username</p>
          <p className="mt-1 font-codingo-sans text-[17px] font-bold text-charcoal">{user?.username}</p>
          <p className="mt-4 font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Email</p>
          <p className="mt-1 font-codingo-sans text-[15px] font-medium text-charcoal">{user?.email}</p>
        </div>
        <div className="rounded-[12px] border-2 border-faded-gray bg-paper-white p-6">
          <p className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">Progress</p>
          <p className="mt-2 font-codingo-sans text-[15px] font-medium text-pencil-gray">XP {user?.xp ?? 0} · Streak {user?.streak?.count ?? 0} · Level {user?.level ?? 1}</p>
          <p className="mt-2 font-codingo-sans text-[13px] font-medium text-pencil-gray">Timezone {user?.timezone ?? "Asia/Kolkata"}</p>
        </div>
      </div>
    </div>
  );
}
