"use client";

import { create } from "zustand";
import { API_BASE } from "@/lib/api";

/* Global progress — cached per user, used for path resume + sidebar stats.
   Follows PRD: saved per user/lesson, resumes where left off, awards XP. */

export const useProgressStore = create((set, get) => ({
  byLessonId: {}, // lessonId -> progress doc
  loading: false,
  error: null,

  // user snapshot for XP/level/streak display
  userStats: null,

  async fetchAll() {
    set({ loading: true, error: null });
    try {
      const token = typeof document !== "undefined" ? document.cookie : "";
      // Use credentials:include via fetch with cookies automatically in browser;
      // for server we rely on lib/auth. This store is client-only.
      const res = await fetch(`${API_BASE}/api/progress/me`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load progress");
      const data = await res.json();
      const map = {};
      for (const p of data.progress ?? []) map[String(p.lessonId)] = p;
      set({ byLessonId: map, loading: false });
    } catch (e) {
      set({ error: e.message ?? String(e), loading: false });
    }
  },

  async save({ lessonId, score, completed, firstTry }) {
    const res = await fetch(`${API_BASE}/api/progress`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, score, completed, firstTry }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? "Failed to save progress");

    // Optimistically update map
    set((s) => ({
      byLessonId: { ...s.byLessonId, [String(lessonId)]: data.progress },
      userStats: data.user ?? s.userStats,
    }));
    return data;
  },

  setProgress(lessonId, doc) {
    set((s) => ({ byLessonId: { ...s.byLessonId, [String(lessonId)]: doc } }));
  },
}));
