import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { LearnPathClient } from "@/components/learn/LearnPathClient";

async function getCoursesWithProgress() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const [coursesRes, progressRes] = await Promise.all([
    fetch(`${API_BASE}/api/courses`, { headers: { Cookie: cookieHeader }, cache: "no-store" }),
    fetch(`${API_BASE}/api/progress/me`, { headers: { Cookie: cookieHeader }, cache: "no-store" }),
  ]);
  const coursesData = coursesRes.ok ? await coursesRes.json() : { courses: [] };
  const progressData = progressRes.ok ? await progressRes.json() : { progress: [] };
  const progressMap = {};
  for (const p of progressData.progress ?? []) progressMap[String(p.lessonId)] = p;
  return { courses: coursesData.courses ?? [], progressMap };
}

export default async function LearnPage({ searchParams }) {
  const { courses, progressMap } = await getCoursesWithProgress();
  const sp = searchParams ? await searchParams : {};
  const activeId = sp?.course ? String(sp.course) : null;
  return <LearnPathClient courses={courses} initialProgressMap={progressMap} activeCourseId={activeId} />;
}
