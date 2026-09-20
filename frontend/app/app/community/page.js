import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { MessagesSquare } from "lucide-react";
import { CommunityFeed } from "@/components/community/CommunityFeed";

async function getInitialThreads({ lessonId, sort }) {
  const cookieStore = await cookies();
  const q = new URLSearchParams({ limit: "20", sort: sort === "top" ? "top" : "new" });
  if (lessonId) q.set("lessonId", lessonId);
  const res = await fetch(`${API_BASE}/api/threads?${q.toString()}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return { threads: [], nextCursor: null };
  return res.json();
}

async function getLessons() {
  const cookieStore = await cookies();
  const res = await fetch(`${API_BASE}/api/courses`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  const lessons = [];
  for (const c of data.courses ?? []) {
    for (const u of c.units ?? []) {
      for (const l of u.lessons ?? []) {
        lessons.push({ id: String(l._id), title: l.title });
      }
    }
  }
  return lessons;
}

export default async function CommunityPage({ searchParams }) {
  const sp = await searchParams;
  const lessonId = typeof sp?.lessonId === "string" ? sp.lessonId : "";
  const sort = sp?.sort === "top" ? "top" : "new";
  const [user, { threads, nextCursor }, lessons] = await Promise.all([
    getCurrentUser(),
    getInitialThreads({ lessonId, sort }),
    getLessons(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      {/* Header — same banner language as /learn */}
      <header className="w-full overflow-hidden rounded-[16px] border-2 border-faded-gray bg-paper-white md:rounded-[20px]">
        <div className="relative p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#e6f4ff]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-storybook-green/60" aria-hidden="true" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[16px] border-2 border-spark-blue bg-spark-blue text-paper-white sm:h-[64px] sm:w-[64px]">
              <MessagesSquare className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-charcoal px-3 py-1 font-codingo-sans text-[11px] font-black uppercase leading-none tracking-[0.06em] text-paper-white">
                  Peer help
                </span>
                <span className="inline-flex items-center rounded-full bg-storybook-green px-3 py-1 font-codingo-sans text-[11px] font-black leading-none text-charcoal">
                  Live feed
                </span>
              </div>
              <h1 className="mt-2 font-codingo-sans text-[24px] font-bold leading-[1.1] text-charcoal sm:text-[28px]">
                Community
              </h1>
              <p className="mt-1 max-w-[560px] font-codingo-sans text-[14px] font-medium leading-[1.45] text-pencil-gray">
                Stuck on a lesson? Ask here — peers jump in, and an AI helper is on the way.
              </p>
            </div>
          </div>
        </div>
      </header>

      <CommunityFeed
        initialThreads={threads ?? []}
        initialCursor={nextCursor ?? null}
        lessons={lessons}
        initialLessonId={lessonId}
        initialSort={sort}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
