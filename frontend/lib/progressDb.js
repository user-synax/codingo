"use client";

/* IndexedDB cache for course progress — IDB-first, MongoDB second.
   Stores progress docs and user stats per user, plus a pending queue
   for offline saves. Single DB, multiple stores, user-scoped via key prefix.
   All ops are no-ops on the server or when IndexedDB is unavailable. */

const DB_NAME = "codingo_progress";
const DB_VERSION = 3;
const STORE_PROGRESS = "progress";
const STORE_META = "meta";
const STORE_PENDING = "pending";
const STORE_DRAFTS = "lesson_drafts";

let dbPromise = null;

export function isSupported() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDB() {
  if (!isSupported()) return Promise.reject(new Error("IndexedDB not supported"));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
        const s = db.createObjectStore(STORE_PROGRESS, { keyPath: "key" });
        s.createIndex("userId", "userId", { unique: false });
        s.createIndex("lessonId", "lessonId", { unique: false });
        s.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "userId" });
      }
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        const p = db.createObjectStore(STORE_PENDING, { keyPath: "key" });
        p.createIndex("userId", "userId", { unique: false });
        p.createIndex("lessonId", "lessonId", { unique: false });
        p.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        const d = db.createObjectStore(STORE_DRAFTS, { keyPath: "key" });
        d.createIndex("userId", "userId", { unique: false });
        d.createIndex("lessonId", "lessonId", { unique: false });
        d.createIndex("updatedAt", "updatedAt", { unique: false });
      }

      // Migration: v1 -> v2 ensure indexes exist (no-op if already)
      if (oldVersion < 2) {
        // stores already created above; nothing else
      }
      // v2 -> v3 adds lesson_drafts for resume-from-where-you-left
      if (oldVersion < 3 && !db.objectStoreNames.contains(STORE_DRAFTS)) {
        const d = db.createObjectStore(STORE_DRAFTS, { keyPath: "key" });
        d.createIndex("userId", "userId", { unique: false });
        d.createIndex("lessonId", "lessonId", { unique: false });
        d.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => {
      // still resolve with current connection; blocked means another tab has it open
      // we reject to allow retry
      reject(new Error("IndexedDB blocked"));
    };
  });
  // Reset promise on close/error so next call retries
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

async function withStore(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    let fnResult;
    try {
      fnResult = fn(store);
    } catch (e) {
      reject(e);
      return;
    }
    // fn may be async or return a request
    if (fnResult && typeof fnResult.then === "function") {
      fnResult.then(resolve).catch(reject);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
      return;
    }
    // If fn returned an IDBRequest, hook it
    if (fnResult && typeof fnResult.onsuccess !== "undefined") {
      fnResult.onsuccess = () => resolve(fnResult.result);
      fnResult.onerror = () => reject(fnResult.error);
      tx.onerror = () => reject(tx.error);
      return;
    }
    // Otherwise assume fn did its own requests and we resolve on complete
    tx.oncomplete = () => resolve(result ?? fnResult);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function makeKey(userId, lessonId) {
  const u = userId ? String(userId) : "anon";
  const l = String(lessonId);
  return `${u}:${l}`;
}

function normalizeDoc(doc, userIdHint) {
  const lessonId = String(doc.lessonId ?? doc.lesson_id ?? doc.key?.split(":").pop() ?? "");
  const userId = String(doc.userId ?? userIdHint ?? "anon");
  const key = doc.key ?? makeKey(userId, lessonId);
  return {
    ...doc,
    key,
    userId,
    lessonId,
    status: doc.status ?? "not_started",
    score: typeof doc.score === "number" ? doc.score : 0,
    bestScore: typeof doc.bestScore === "number" ? doc.bestScore : doc.score ?? 0,
    attempts: typeof doc.attempts === "number" ? doc.attempts : 0,
    updatedAt: doc.updatedAt ?? doc.updated_at ?? new Date().toISOString(),
    createdAt: doc.createdAt ?? doc.created_at ?? new Date().toISOString(),
  };
}

/* ---------- Progress ---------- */

export async function getAllProgress(userId) {
  if (!isSupported()) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, "readonly");
    const store = tx.objectStore(STORE_PROGRESS);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result ?? [];
      if (userId) {
        const uid = String(userId);
        // Filter: exact userId or anon legacy entries (for that user we still show anon if no userId known)
        const filtered = all.filter((d) => String(d.userId) === uid || (uid === "anon" && (!d.userId || d.userId === "anon")));
        resolve(filtered);
      } else {
        resolve(all);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getProgress(lessonId, userId) {
  if (!isSupported()) return null;
  const key = makeKey(userId, lessonId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, "readonly");
    const store = tx.objectStore(STORE_PROGRESS);
    // Try composite key first, then fallback to plain lessonId
    const req = store.get(key);
    req.onsuccess = () => {
      if (req.result) return resolve(req.result);
      // fallback: try plain lessonId key (legacy single-user)
      const req2 = store.get(String(lessonId));
      req2.onsuccess = () => resolve(req2.result ?? null);
      req2.onerror = () => resolve(null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putProgress(doc, userIdHint) {
  if (!isSupported()) return;
  const normalized = normalizeDoc(doc, userIdHint ?? doc.userId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, "readwrite");
    const store = tx.objectStore(STORE_PROGRESS);
    const req = store.put(normalized);
    req.onsuccess = () => resolve(normalized);
    req.onerror = () => reject(req.error);
  });
}

export async function putProgressBatch(list, userIdHint) {
  if (!isSupported()) return;
  if (!Array.isArray(list) || !list.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, "readwrite");
    const store = tx.objectStore(STORE_PROGRESS);
    let done = 0;
    let error = null;
    for (const doc of list) {
      const normalized = normalizeDoc(doc, userIdHint ?? doc.userId);
      const req = store.put(normalized);
      req.onerror = () => {
        error = req.error;
      };
      req.onsuccess = () => {
        done += 1;
        if (done === list.length && !error) {
          // let tx complete handle resolve
        }
      };
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(error ?? tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function removeProgress(lessonId, userId) {
  if (!isSupported()) return;
  const key = makeKey(userId, lessonId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, "readwrite");
    const store = tx.objectStore(STORE_PROGRESS);
    const req = store.delete(key);
    req.onsuccess = () => {
      // also try legacy key
      const req2 = store.delete(String(lessonId));
      req2.onsuccess = () => resolve();
      req2.onerror = () => resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearProgress(userId) {
  if (!isSupported()) return;
  if (!userId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROGRESS, "readwrite");
      tx.objectStore(STORE_PROGRESS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  // user-scoped clear: delete only that user's entries
  const all = await getAllProgress(userId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, "readwrite");
    const store = tx.objectStore(STORE_PROGRESS);
    for (const d of all) store.delete(d.key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------- Meta (userStats, lastSync) ---------- */

export async function getUserStats(userId) {
  if (!isSupported() || !userId) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly");
    const req = tx.objectStore(STORE_META).get(String(userId));
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAnyUserStats() {
  if (!isSupported()) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly");
    const req = tx.objectStore(STORE_META).getAll();
    req.onsuccess = () => {
      const all = req.result ?? [];
      if (!all.length) return resolve(null);
      // most recent
      all.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      resolve(all[0]);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putUserStats(userId, stats) {
  if (!isSupported() || !userId) return;
  const db = await openDB();
  const record = {
    userId: String(userId),
    stats: stats ?? null,
    // also store flat fields for easy access
    xp: stats?.xp ?? null,
    level: stats?.level ?? null,
    streak: stats?.streak ?? null,
    badges: stats?.badges ?? null,
    lastSync: Date.now(),
    updatedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readwrite");
    const req = tx.objectStore(STORE_META).put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function putLastSync(userId, ts) {
  if (!isSupported() || !userId) return;
  const existing = await getUserStats(userId);
  const db = await openDB();
  const record = {
    ...(existing ?? { userId: String(userId) }),
    userId: String(userId),
    lastSync: ts ?? Date.now(),
    updatedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readwrite");
    const req = tx.objectStore(STORE_META).put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function getLastSync(userId) {
  if (!isSupported() || !userId) return null;
  const meta = await getUserStats(userId);
  return meta?.lastSync ?? null;
}

/* ---------- Pending queue (offline saves) ---------- */

export async function addPending(payload) {
  if (!isSupported()) return;
  const { lessonId, userId } = payload;
  if (!lessonId) throw new Error("pending requires lessonId");
  const key = `${String(userId ?? "anon")}:${String(lessonId)}:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`;
  const record = {
    key,
    userId: String(userId ?? "anon"),
    lessonId: String(lessonId),
    payload: { ...payload },
    createdAt: Date.now(),
    attempts: 0,
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, "readwrite");
    const req = tx.objectStore(STORE_PENDING).put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingList(userId) {
  if (!isSupported()) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, "readonly");
    const req = tx.objectStore(STORE_PENDING).getAll();
    req.onsuccess = () => {
      const all = req.result ?? [];
      if (userId) {
        const uid = String(userId);
        resolve(all.filter((r) => String(r.userId) === uid));
      } else {
        resolve(all);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function removePending(key) {
  if (!isSupported() || !key) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, "readwrite");
    const req = tx.objectStore(STORE_PENDING).delete(String(key));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function removePendingForLesson(userId, lessonId) {
  if (!isSupported()) return;
  const all = await getPendingList(userId);
  const target = String(lessonId);
  const toRemove = all.filter((r) => String(r.lessonId) === target);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, "readwrite");
    const store = tx.objectStore(STORE_PENDING);
    for (const r of toRemove) store.delete(r.key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearPending(userId) {
  if (!isSupported()) return;
  if (!userId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING, "readwrite");
      tx.objectStore(STORE_PENDING).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  const all = await getPendingList(userId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, "readwrite");
    const store = tx.objectStore(STORE_PENDING);
    for (const r of all) store.delete(r.key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function countPending(userId) {
  const list = await getPendingList(userId);
  return list.length;
}

export async function getCacheInfo(userId) {
  const progress = await getAllProgress(userId);
  const pending = await getPendingList(userId);
  const meta = userId ? await getUserStats(userId) : await getAnyUserStats();
  return {
    progressCount: progress.length,
    pendingCount: pending.length,
    lastSync: meta?.lastSync ?? null,
    hasCache: progress.length > 0,
  };
}

export async function deleteDatabase() {
  if (!isSupported()) return;
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {}
    dbPromise = null;
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

/* ---------- Lesson drafts (resume-from-where-you-left) ---------- */
function makeDraftKey(userId, lessonId) {
  return `${String(userId ?? "anon")}:${String(lessonId)}`;
}

export async function getLessonDraft(lessonId, userId) {
  if (!isSupported()) return null;
  const key = makeDraftKey(userId, lessonId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, "readonly");
    const store = tx.objectStore(STORE_DRAFTS);
    const req = store.get(key);
    req.onsuccess = () => {
      if (req.result) return resolve(req.result);
      // legacy: try plain lessonId
      const req2 = store.get(String(lessonId));
      req2.onsuccess = () => resolve(req2.result ?? null);
      req2.onerror = () => resolve(null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putLessonDraft({ lessonId, userId, idx, answers, checked, firstTryCorrect, total, lessonTitle }) {
  if (!isSupported() || !lessonId) return;
  const key = makeDraftKey(userId, lessonId);
  const doc = {
    key,
    userId: String(userId ?? "anon"),
    lessonId: String(lessonId),
    idx: typeof idx === "number" ? idx : 0,
    answers: answers ?? {},
    checked: checked ?? {},
    firstTryCorrect: firstTryCorrect ?? {},
    total: typeof total === "number" ? total : 0,
    lessonTitle: lessonTitle ?? "",
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };
  const db = await openDB();
  // fetch existing to preserve createdAt
  const existing = await getLessonDraft(lessonId, userId).catch(() => null);
  if (existing?.createdAt) doc.createdAt = existing.createdAt;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, "readwrite");
    const req = tx.objectStore(STORE_DRAFTS).put(doc);
    req.onsuccess = () => resolve(doc);
    req.onerror = () => reject(req.error);
  });
}

export async function removeLessonDraft(lessonId, userId) {
  if (!isSupported()) return;
  const key = makeDraftKey(userId, lessonId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, "readwrite");
    const store = tx.objectStore(STORE_DRAFTS);
    const req = store.delete(key);
    req.onsuccess = () => {
      const req2 = store.delete(String(lessonId));
      req2.onsuccess = () => resolve();
      req2.onerror = () => resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllDrafts(userId) {
  if (!isSupported()) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, "readonly");
    const req = tx.objectStore(STORE_DRAFTS).getAll();
    req.onsuccess = () => {
      const all = req.result ?? [];
      if (userId) {
        const uid = String(userId);
        resolve(all.filter((d) => String(d.userId) === uid));
      } else resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllDrafts(userId) {
  if (!isSupported()) return;
  if (!userId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, "readwrite");
      tx.objectStore(STORE_DRAFTS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  const all = await getAllDrafts(userId);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFTS, "readwrite");
    const store = tx.objectStore(STORE_DRAFTS);
    for (const d of all) store.delete(d.key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// For testing / debugging
export const _internal = {
  DB_NAME,
  DB_VERSION,
  STORE_PROGRESS,
  STORE_META,
  STORE_PENDING,
  STORE_DRAFTS,
  makeKey,
  normalizeDoc,
  makeDraftKey,
};
