import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { API_BASE } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { ThreadView } from "@/components/community/ThreadView";

async function getThread(threadId) {
  const cookieStore = await cookies();
  const res = await fetch(`${API_BASE}/api/threads/${threadId}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load thread");
  return res.json();
}

export default async function ThreadPage({ params }) {
  const { threadId } = await params;
  const [user, data] = await Promise.all([getCurrentUser(), getThread(threadId)]);
  if (!data) notFound();

  return (
    <ThreadView initialThread={data.thread} initialReplies={data.replies ?? []} currentUserId={user?.id ?? null} />
  );
}
