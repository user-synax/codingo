"use client";

import { create } from "zustand";
import { API_BASE } from "@/lib/api";
import * as progressDb from "@/lib/progressDb";

/* Global progress — IDB-first, MongoDB second.
   - On app open: hydrate instantly from IndexedDB, then revalidate from /api/progress/me.
   - On save: optimistic IndexedDB write + pending queue for offline, then sync to MongoDB.
   - Per-user isolation via userId-scoped IndexedDB keys (fallback to anon for single-device).
   Follows PRD: saved per user/lesson, resumes where left off, awards XP. */

function mapFromList(list) {
  const map = {};
  for (const p of list ?? []) {
    const lid = String(p.lessonId ?? p.lesson_id ?? "");
    if (!lid) continue;
    map[lid] = p;
  }
  return map;
}

function inferUserIdFromProgress(list) {
  if (!Array.isArray(list) || !list.length) return null;
  const first = list[0];
  if (first?.userId) return String(first.userId);
  if (first?.user_id) return String(first.user_id);
  return null;
}

export const useProgressStore = create((set, get) => ({
  byLessonId: {}, // lessonId -> progress doc
  loading: false,
  syncing: false,
  error: null,
  hydratedFromCache: false,
  lastSync: null,
  pendingCount: 0,
  isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  userId: null,
  userStats: null,

  setUserId(userId) {
    if (!userId) return;
    const uid = String(userId);
    if (get().userId === uid) return;
    set({ userId: uid });
    // also refresh pending count for this user
    if (progressDb.isSupported()) {
      progressDb.countPending(uid).then((c) => set({ pendingCount: c })).catch(() => {});
      progressDb.getLastSync(uid).then((ts) => set({ lastSync: ts })).catch(() => {});
    }
  },

  setProgress(lessonId, doc) {
    set((s) => ({ byLessonId: { ...s.byLessonId, [String(lessonId)]: doc } }));
    // also persist to IDB (best-effort)
    const uid = get().userId;
    if (progressDb.isSupported() && doc) {
      progressDb.putProgress(doc, uid).catch(() => {});
    }
  },

  async hydrateFromCache(userIdOverride) {
    if (!progressDb.isSupported() || typeof window === "undefined") return null;
    const uid = userIdOverride ? String(userIdOverride) : get().userId;
    try {
      const cachedList = await progressDb.getAllProgress(uid);
      // If scoped fetch returned empty but we have no uid, try unscoped
      let list = cachedList;
      if (!list.length && !uid) {
        const all = await progressDb.getAllProgress();
        list = all;
      }
      if (!list.length) {
        // try any fallback: maybe anon stored
        if (uid && uid !== "anon") {
          const anonList = await progressDb.getAllProgress("anon");
          if (anonList.length) list = anonList;
        }
      }
      if (list.length) {
        const map = mapFromList(list);
        set({ byLessonId: map, hydratedFromCache: true, loading: false });
        // also hydrate userStats + meta
        const meta = uid ? await progressDb.getUserStats(uid) : await progressDb.getAnyUserStats();
        if (meta?.stats) {
          set({ userStats: meta.stats, lastSync: meta.lastSync ?? null });
          if (meta.userId && !get().userId) set({ userId: String(meta.userId) });
        } else if (meta?.xp !== undefined) {
          // flat meta shape
          const stats = meta.stats ?? { xp: meta.xp, level: meta.level, streak: meta.streak, badges: meta.badges };
          if (stats) set({ userStats: stats });
        }
        const pending = await progressDb.countPending(uid ?? undefined);
        set({ pendingCount: pending });
        if (meta?.lastSync) set({ lastSync: meta.lastSync });
        return map;
      }
      // still update pending count even if no progress
      const pending = await progressDb.countPending(uid ?? undefined).catch(() => 0);
      set({ pendingCount: pending ?? 0 });
    } catch (e) {
      // cache read failure is non-fatal
      // console.warn("[progressStore] hydrateFromCache failed", e);
    }
    return null;
  },

  async fetchAll(opts = {}) {
    const { userId: userIdOpt, forceNetwork = true, silent = false } = opts;
    const uidOpt = userIdOpt ? String(userIdOpt) : null;
    if (uidOpt && uidOpt !== get().userId) set({ userId: uidOpt });

    const isBrowser = typeof window !== "undefined";
    // Step 1: IDB-first hydration (instant)
    let cachedMap = null;
    if (isBrowser && progressDb.isSupported()) {
      try {
        cachedMap = await get().hydrateFromCache(uidOpt ?? get().userId);
      } catch {}
    }

    if (!forceNetwork) {
      return { fromCache: cachedMap, fromNetwork: null };
    }

    // Step 2: Network revalidation (MongoDB)
    if (!silent) set({ syncing: true, error: null });
    // keep loading true only if we have no cache to show
    const hasCache = cachedMap && Object.keys(cachedMap).length > 0;
    if (!hasCache && !silent) set({ loading: true });

    try {
      const res = await fetch(`${API_BASE}/api/progress/me`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load progress");
      const data = await res.json();
      const list = data.progress ?? [];
      const map = mapFromList(list);

      // Infer userId if not already known
      let inferredUserId = get().userId ?? uidOpt;
      const inferred = inferUserIdFromProgress(list);
      if (!inferredUserId && inferred) inferredUserId = String(inferred);

      // Also fetch user stats if not included — /api/progress/me does not return user, so fetch /api/auth/me
      let fetchedUser = null;
      if (!inferredUserId || !get().userStats) {
        try {
          const meRes = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData?.user?._id) {
              inferredUserId = String(meData.user._id);
              fetchedUser = meData.user;
            } else if (meData?.user) {
              fetchedUser = meData.user;
            }
          }
        } catch {}
      }
      if (inferredUserId && inferredUserId !== get().userId) set({ userId: inferredUserId });

      // Merge offline pending: keep local completed lessons that haven't yet synced to MongoDB
      // Without this, a fetch right after an offline save would clobber the optimistic IDB state.
      let finalMap = map;
      let pendingLessonIds = new Set();
      if (progressDb.isSupported() && cachedMap) {
        try {
          const pendingList = await progressDb.getPendingList(inferredUserId ?? undefined).catch(() => []);
          let listPending = pendingList;
          if (!listPending.length && inferredUserId && inferredUserId !== "anon") {
            const anonPending = await progressDb.getPendingList("anon").catch(() => []);
            if (anonPending.length) listPending = anonPending;
          }
          pendingLessonIds = new Set(listPending.map((p) => String(p.lessonId ?? p.payload?.lessonId)));
          // Preserve any cached completed lesson that is pending or missing on server
          const merged = { ...map };
          for (const [lid, doc] of Object.entries(cachedMap)) {
            const isPending = pendingLessonIds.has(String(lid));
            const serverDoc = map[String(lid)];
            const serverCompleted = serverDoc?.status === "completed";
            const localCompleted = doc?.status === "completed";
            if (isPending && localCompleted) {
              merged[String(lid)] = doc;
            } else if (localCompleted && !serverCompleted && !serverDoc) {
              // local has completion not yet on server (maybe queued but not in pending list due to race)
              // keep it if local updatedAt is newer
              const localTime = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
              const serverTime = serverDoc?.updatedAt ? new Date(serverDoc.updatedAt).getTime() : 0;
              if (localTime > serverTime) merged[String(lid)] = doc;
            }
          }
          finalMap = merged;
        } catch {}
      }

      set({
        byLessonId: finalMap,
        loading: false,
        syncing: false,
        hydratedFromCache: true,
        lastSync: Date.now(),
        error: null,
      });

      if (fetchedUser) {
        const stats = { xp: fetchedUser.xp, level: fetchedUser.level, streak: fetchedUser.streak, badges: fetchedUser.badges, _id: fetchedUser._id, username: fetchedUser.username };
        set({ userStats: fetchedUser });
        // persist stats
        if (progressDb.isSupported() && inferredUserId) {
          progressDb.putUserStats(inferredUserId, fetchedUser).catch(() => {});
        }
      }

      // Persist to IndexedDB — server truth, but do not overwrite pending lessons
      if (progressDb.isSupported()) {
        try {
          // Filter out pending lessons so we don't clobber optimistic offline docs
          let toCache = list;
          if (pendingLessonIds.size) {
            toCache = list.filter((p) => !pendingLessonIds.has(String(p.lessonId ?? p.lesson_id)));
          }
          if (toCache.length) await progressDb.putProgressBatch(toCache, inferredUserId ?? undefined);
          // Also ensure any merged pending docs are still in IDB (they already are, but re-put from finalMap)
          for (const lid of pendingLessonIds) {
            const doc = finalMap[String(lid)];
            if (doc && doc.__optimistic) {
              await progressDb.putProgress(doc, inferredUserId ?? undefined).catch(() => {});
            }
          }
          if (inferredUserId) await progressDb.putLastSync(inferredUserId, Date.now());
          const pendingAfter = await progressDb.countPending(inferredUserId ?? undefined);
          set({ pendingCount: pendingAfter });
        } catch {}
      }

      // After successful fetch, drain pending queue (in case offline saves happened before)
      if (inferredUserId) {
        get().syncPending(inferredUserId).catch(() => {});
      } else {
        get().syncPending().catch(() => {});
      }

      return { fromCache: cachedMap, fromNetwork: finalMap };
    } catch (e) {
      const msg = e?.message ?? String(e);
      // If we have cache, keep it and surface offline state, don't clear loading error harshly
      if (cachedMap && Object.keys(cachedMap).length) {
        set({ loading: false, syncing: false, error: null, isOffline: !navigator.onLine });
        return { fromCache: cachedMap, error: msg };
      }
      set({ error: msg, loading: false, syncing: false, isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false });
      throw e;
    }
  },

  async syncPending(userIdOverride) {
    if (!progressDb.isSupported() || typeof window === "undefined") return 0;
    if (typeof navigator !== "undefined" && !navigator.onLine) return 0;
    const uid = userIdOverride ? String(userIdOverride) : get().userId;
    const pending = await progressDb.getPendingList(uid).catch(() => []);
    // also include anon pending if uid specific gave none and we have anon
    let list = pending;
    if (!list.length && uid && uid !== "anon") {
      const anonPending = await progressDb.getPendingList("anon").catch(() => []);
      if (anonPending.length) list = anonPending;
    }
    if (!list.length) {
      // also try unscoped if still empty and no uid
      if (!uid) {
        const all = await progressDb.getPendingList().catch(() => []);
        list = all;
      }
      if (!list.length) return 0;
    }

    let synced = 0;
    for (const item of list) {
      const payload = item.payload ?? item;
      const lessonId = String(payload.lessonId ?? item.lessonId);
      const body = {
        lessonId,
        score: payload.score ?? 0,
        completed: payload.completed ?? false,
        firstTry: payload.firstTry,
        correctCount: payload.correctCount,
        total: payload.total,
      };
      try {
        const res = await fetch(`${API_BASE}/api/progress`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message ?? "Failed to sync progress");
        // success: update store with server doc, cache it, remove pending
        const serverDoc = data.progress;
        if (serverDoc) {
          set((s) => ({
            byLessonId: { ...s.byLessonId, [String(serverDoc.lessonId ?? lessonId)]: serverDoc },
            userStats: data.user ?? s.userStats,
          }));
          const ownerId = String(data.user?.id ?? data.progress?.userId ?? payload.userId ?? uid ?? "anon");
          await progressDb.putProgress(serverDoc, ownerId).catch(() => {});
          if (data.user && ownerId) await progressDb.putUserStats(ownerId, data.user).catch(() => {});
        }
        await progressDb.removePending(item.key).catch(() => {});
        synced += 1;
      } catch (err) {
        // keep pending for next retry; increment attempts
        // if auth error (401), stop trying until re-auth
        if (err?.message?.includes("Unauthorized") || err?.message?.includes("401")) break;
        // network error: break to retry later
        if (typeof navigator !== "undefined" && !navigator.onLine) break;
        // otherwise continue to next item (validation error should still remove? keep for debug)
        // For validation errors, remove to avoid infinite loop? Let's keep but mark attempts
        // We'll keep it but not spam; continue
      }
    }
    // update pending count
    try {
      const remaining = await progressDb.countPending(uid ?? undefined);
      set({ pendingCount: remaining });
    } catch {}
    return synced;
  },

  async save({ lessonId, score, completed, firstTry, correctCount, total }) {
    const lid = String(lessonId);
    const uid = get().userId;
    const prev = get().byLessonId[lid];

    // Optimistic doc for instant UI + offline
    const nowIso = new Date().toISOString();
    const optimistic = {
      _id: prev?._id ?? `temp_${lid}_${Date.now()}`,
      lessonId: lid,
      userId: uid ?? prev?.userId ?? undefined,
      status: completed || score >= 80 ? "completed" : score > 0 ? "in_progress" : "not_started",
      score,
      bestScore: Math.max(prev?.bestScore ?? 0, score),
      attempts: (prev?.attempts ?? 0) + 1,
      firstTry: prev ? prev.firstTry : (firstTry ?? true),
      completedAt: completed || score >= 80 ? nowIso : prev?.completedAt ?? null,
      createdAt: prev?.createdAt ?? nowIso,
      updatedAt: nowIso,
      __optimistic: true,
      __pending: true,
      key: uid ? `${uid}:${lid}` : lid,
    };

    // Immediate store update
    set((s) => ({
      byLessonId: { ...s.byLessonId, [lid]: optimistic },
    }));

    // Immediate IndexedDB write (so offline reload preserves it)
    if (progressDb.isSupported()) {
      try {
        await progressDb.putProgress(optimistic, uid ?? undefined);
      } catch {}
    }

    const payload = { lessonId: lid, score, completed, firstTry, correctCount, total };

    // Try network
    try {
      const res = await fetch(`${API_BASE}/api/progress`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Failed to save progress");

      // Server success: replace optimistic with authoritative doc
      set((s) => ({
        byLessonId: { ...s.byLessonId, [lid]: data.progress },
        userStats: data.user ?? s.userStats,
        pendingCount: s.pendingCount, // will refresh below
      }));

      const ownerId = String(data.user?.id ?? data.progress?.userId ?? uid ?? "anon");
      if (ownerId !== get().userId) set({ userId: ownerId });

      if (progressDb.isSupported()) {
        try {
          await progressDb.putProgress(data.progress, ownerId);
          if (data.user) await progressDb.putUserStats(ownerId, data.user);
          await progressDb.removePendingForLesson(ownerId, lid);
          // also clear anon pending if existed
          if (ownerId !== "anon") await progressDb.removePendingForLesson("anon", lid).catch(() => {});
          const remaining = await progressDb.countPending(ownerId);
          set({ pendingCount: remaining, lastSync: Date.now() });
          await progressDb.putLastSync(ownerId, Date.now()).catch(() => {});
        } catch {}
      }

      return data;
    } catch (err) {
      // Network failed — queue for background sync, keep optimistic
      if (progressDb.isSupported()) {
        try {
          const queueUserId = uid ?? "anon";
          await progressDb.addPending({ ...payload, lessonId: lid, userId: queueUserId });
          const c = await progressDb.countPending(queueUserId);
          set({ pendingCount: c, isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false });
          // also try fallback anon count if uid
          if (uid) {
            const anonC = await progressDb.countPending("anon").catch(() => 0);
            if (anonC) set((s) => ({ pendingCount: Math.max(s.pendingCount, anonC) }));
          }
        } catch {}
      }
      // Re-throw so caller can show "saved offline" UI
      throw err;
    }
  },

  async clearCache(userIdOverride) {
    const uid = userIdOverride ? String(userIdOverride) : get().userId;
    if (progressDb.isSupported()) {
      try {
        if (uid) {
          await progressDb.clearProgress(uid);
          await progressDb.clearPending(uid);
        } else {
          await progressDb.clearProgress();
          await progressDb.clearPending();
        }
      } catch {}
    }
    set({ byLessonId: {}, hydratedFromCache: false, lastSync: null, pendingCount: 0 });
  },

  // For logout: clear in-memory but keep IDB for that user (so next login restores)
  // Call clearCache only if you want hard wipe
  reset() {
    set({
      byLessonId: {},
      loading: false,
      syncing: false,
      error: null,
      hydratedFromCache: false,
      lastSync: null,
      pendingCount: 0,
      isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
      // keep userId and userStats? Clear on logout
      userId: null,
      userStats: null,
    });
  },
}));
