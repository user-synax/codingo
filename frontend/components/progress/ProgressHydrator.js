"use client";

import { useEffect } from "react";
import { useProgressStore } from "@/stores/progressStore";

/* Mount once near the top of the authenticated shell.
   - Hydrates Zustand from IndexedDB instantly (IDB-first)
   - Then revalidates from MongoDB (/api/progress/me)
   - Listens for online/offline to drain the pending queue
   - Periodic retry every 30s when offline saves exist */

export function ProgressHydrator({ userId, user }) {
  const setUserId = useProgressStore((s) => s.setUserId);
  const fetchAll = useProgressStore((s) => s.fetchAll);
  const syncPending = useProgressStore((s) => s.syncPending);

  useEffect(() => {
    const uid = userId ?? user?._id ?? user?.id ?? null;
    if (uid) setUserId(uid);

    // IDB-first hydration + MongoDB revalidation
    fetchAll({ userId: uid ?? undefined }).catch(() => {});

    const onOnline = () => {
      useProgressStore.setState({ isOffline: false });
      const currentUid = useProgressStore.getState().userId ?? uid;
      syncPending(currentUid ?? undefined).catch(() => {});
      fetchAll({ userId: currentUid ?? uid ?? undefined }).catch(() => {});
    };
    const onOffline = () => {
      useProgressStore.setState({ isOffline: true });
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const interval = setInterval(() => {
      const st = useProgressStore.getState();
      if (typeof navigator !== "undefined" && navigator.onLine && st.pendingCount > 0) {
        syncPending(st.userId ?? uid ?? undefined).catch(() => {});
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, [userId, user, fetchAll, syncPending, setUserId]);

  return null;
}

/* Optional banner: shows sync/offline state where you want it (e.g. under the app header).
   Not required, but useful for the learner to know progress is saved locally when offline. */
export function ProgressSyncBadge() {
  const pendingCount = useProgressStore((s) => s.pendingCount);
  const isOffline = useProgressStore((s) => s.isOffline);
  const syncing = useProgressStore((s) => s.syncing);
  const lastSync = useProgressStore((s) => s.lastSync);

  if (syncing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-faded-gray bg-paper-white px-2.5 py-1 font-codingo-sans text-[11px] font-bold leading-none text-pencil-gray">
        <span className="h-2 w-2 animate-pulse rounded-full bg-spark-blue" aria-hidden="true" />
        Syncing…
      </span>
    );
  }
  if (isOffline && pendingCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#ffd8a8] bg-[#fff4e6] px-2.5 py-1 font-codingo-sans text-[11px] font-bold leading-none text-[#e8590c]">
        <span className="h-2 w-2 rounded-full bg-[#ff9600]" aria-hidden="true" />
        {pendingCount} saved offline
      </span>
    );
  }
  if (pendingCount > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#b5e39a] bg-storybook-green px-2.5 py-1 font-codingo-sans text-[11px] font-bold leading-none text-[#2b8a00]">
        <span className="h-2 w-2 rounded-full bg-eager-green" aria-hidden="true" />
        {pendingCount} pending sync
      </span>
    );
  }
  if (lastSync) {
    return null;
  }
  return null;
}
