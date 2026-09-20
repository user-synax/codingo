"use client";

/* Gamification sounds — files primary (/correct.mp3 etc.) + Web Audio synth fallback.
   User uploaded 3 mp3s to frontend/public: correct.mp3 (32KB), wrong.mp3 (21KB), complete.mp3 (42KB).
   Mute persisted in localStorage codingo_muted, toggle exposed for UI. */

let ctx = null;

function getCtx() {
  if (ctx) return ctx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    return ctx;
  } catch {
    return null;
  }
}

async function ensureResumed(c) {
  if (!c) return;
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {}
  }
}

function tone({ freq, duration, type = "sine", gain = 0.22, attack = 0.01, sweepTo }) {
  const c = getCtx();
  if (!c) return;
  ensureResumed(c);
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + attack);
  g.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function synthCorrect() {
  tone({ freq: 880, duration: 0.12, type: "sine", gain: 0.24 });
  setTimeout(() => tone({ freq: 1320, duration: 0.18, type: "sine", gain: 0.22 }), 90);
}
function synthWrong() {
  tone({ freq: 220, duration: 0.22, type: "triangle", gain: 0.18, sweepTo: 140 });
  setTimeout(() => tone({ freq: 160, duration: 0.18, type: "triangle", gain: 0.14 }), 110);
}
function synthComplete() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => setTimeout(() => tone({ freq: f, duration: 0.22, type: "sine", gain: 0.22 }), i * 90));
  setTimeout(() => tone({ freq: 1318, duration: 0.35, type: "sine", gain: 0.16 }), 380);
}

// Mute — persisted
export function isMuted() {
  try {
    return localStorage.getItem("codingo_muted") === "1";
  } catch {
    return false;
  }
}
export function setMuted(v) {
  try {
    localStorage.setItem("codingo_muted", v ? "1" : "0");
  } catch {}
  // also dispatch event for UI to react
  try {
    window.dispatchEvent(new CustomEvent("codingo:mute", { detail: { muted: !!v } }));
  } catch {}
}
export function toggleMuted() {
  const next = !isMuted();
  setMuted(next);
  return next;
}

// Audio file handling — try /correct.mp3 etc., fallback to synth
let audios = {};

function getAudio(name) {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  if (audios[name]) return audios[name];
  // Files are at public root per upload: /correct.mp3 etc. Also try /sounds/ prefix for compat
  const srcMap = {
    correct: "/correct.mp3",
    wrong: "/wrong.mp3",
    complete: "/complete.mp3",
  };
  const src = srcMap[name];
  if (!src) return null;
  const a = new Audio(src);
  a.preload = "auto";
  // Also try to preload alternative path on error
  a.addEventListener("error", () => {
    // fallback src with /sounds/ prefix if root fails
    if (!a.dataset.triedAlt) {
      a.dataset.triedAlt = "1";
      a.src = `/sounds/${name}.mp3`;
      a.load();
    }
  });
  audios[name] = a;
  return a;
}

async function playFile(name, fallback) {
  if (isMuted()) return;
  const a = getAudio(name);
  if (a) {
    try {
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.then === "function") {
        await p;
        return;
      }
      return;
    } catch {
      // fall through to synth
    }
  }
  // synth fallback
  fallback();
}

export function playCorrect() {
  playFile("correct", synthCorrect);
}
export function playWrong() {
  playFile("wrong", synthWrong);
}
export function playComplete() {
  playFile("complete", synthComplete);
}
