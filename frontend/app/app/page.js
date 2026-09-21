import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { DashboardClient } from "@/components/app/DashboardClient";

async function getDashboardData() {
  const cookieStore = await cookies();
  const headers = { Cookie: cookieStore.toString() };
  const [coursesRes, progressRes] = await Promise.all([
    fetch(`${API_BASE}/api/courses`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/progress/me`, { headers, cache: "no-store" }),
  ]);
  const coursesData = coursesRes.ok ? await coursesRes.json() : { courses: [] };
  const progressData = progressRes.ok ? await progressRes.json() : { progress: [] };
  return { courses: coursesData.courses ?? [], progress: progressData.progress ?? [] };
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default async function AppHome() {
  const [user, { courses, progress }] = await Promise.all([getCurrentUser(), getDashboardData()]);
  return <DashboardClient user={user} courses={courses} initialProgress={progress} />;
}
